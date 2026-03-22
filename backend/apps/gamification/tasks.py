"""
Gamification Celery Tasks
"""
import logging
from datetime import date, timedelta
from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum, F
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger('apps.gamification')


@shared_task(bind=True, max_retries=3)
def process_test_completion(self, session_id: str):
    """Called after a test is completed: check achievements, update daily quest, refresh leaderboard."""
    from apps.tests.models import TestSession
    from apps.gamification.models import Achievement, UserAchievement, UserDailyQuestProgress, DailyQuest, XPTransaction

    try:
        session = TestSession.objects.select_related('user').get(id=session_id)
        user = session.user

        with transaction.atomic():
            _check_and_award_achievements(user, session)
            _update_daily_quest_progress(user)
            _update_weekly_xp(user)

    except Exception as exc:
        logger.error(f'process_test_completion failed: {exc}', extra={'session_id': session_id})
        raise self.retry(exc=exc, countdown=60)


def _check_and_award_achievements(user, session):
    from apps.gamification.models import Achievement, UserAchievement, XPTransaction
    from apps.tests.models import TestSessionQuestion

    already_earned = set(UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True))
    candidates = Achievement.objects.filter(is_active=True).exclude(id__in=already_earned)

    total_solved = TestSessionQuestion.objects.filter(user=user, is_correct=True).count() if hasattr(TestSessionQuestion, 'user') else \
        TestSessionQuestion.objects.filter(session__user=user).count()
    total_correct = TestSessionQuestion.objects.filter(session__user=user, is_correct=True).count()

    for achievement in candidates:
        cond = achievement.condition
        awarded = False

        if cond.get('type') == 'solved_questions':
            required = cond.get('count', 1)
            subject_key = cond.get('subject')
            if subject_key:
                count = TestSessionQuestion.objects.filter(
                    session__user=user,
                    subject__section_key=subject_key,
                ).count()
            else:
                count = total_solved
            awarded = count >= required

        elif cond.get('type') == 'correct_answers':
            awarded = total_correct >= cond.get('count', 1)

        elif cond.get('type') == 'perfect_test':
            awarded = session.raw_score == session.session_questions.count()

        elif cond.get('type') == 'scaled_score_above':
            awarded = session.scaled_score and session.scaled_score >= cond.get('score', 200)

        if awarded:
            UserAchievement.objects.create(user=user, achievement=achievement)
            if achievement.xp_reward:
                user.add_xp(achievement.xp_reward)
                XPTransaction.objects.create(
                    user=user,
                    amount=achievement.xp_reward,
                    reason=XPTransaction.Reason.ACHIEVEMENT,
                    description=f'Достижение: {achievement.name_ru}',
                    reference_id=str(achievement.id),
                )
            logger.info(f'Achievement awarded: {achievement.code} to user {user.id}')


def _update_daily_quest_progress(user):
    from apps.gamification.models import DailyQuest, UserDailyQuestProgress, XPTransaction
    today = timezone.now().date()
    active_quests = DailyQuest.objects.filter(is_active=True)

    for quest in active_quests:
        progress, created = UserDailyQuestProgress.objects.get_or_create(
            user=user, quest=quest, date=today,
            defaults={'progress': 0}
        )
        if progress.is_completed:
            continue
        progress.progress = min(progress.progress + 1, quest.target_value)
        if progress.progress >= quest.target_value:
            progress.is_completed = True
        progress.save(update_fields=['progress', 'is_completed'])


def _update_weekly_xp(user):
    from apps.gamification.models import WeeklyLeaderboard, XPTransaction
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())

    week_xp = XPTransaction.objects.filter(
        user=user,
        created_at__date__gte=week_start,
    ).aggregate(total=Sum('amount'))['total'] or 0

    WeeklyLeaderboard.objects.update_or_create(
        week_start=week_start,
        user=user,
        defaults={'xp_this_week': week_xp},
    )


@shared_task
def refresh_weekly_leaderboard():
    """Recalculate ranks for the current week's leaderboard. Runs every Monday."""
    from apps.gamification.models import WeeklyLeaderboard
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())

    entries = WeeklyLeaderboard.objects.filter(week_start=week_start).order_by('-xp_this_week')
    for rank, entry in enumerate(entries, start=1):
        entry.rank = rank
    WeeklyLeaderboard.objects.bulk_update(entries, ['rank'])
    logger.info(f'Weekly leaderboard refreshed: {entries.count()} entries')


@shared_task
def process_daily_quests():
    """Award XP to users who completed daily quests today."""
    from apps.gamification.models import UserDailyQuestProgress, XPTransaction
    today = timezone.now().date()
    pending = UserDailyQuestProgress.objects.filter(
        date=today, is_completed=True, xp_awarded=False
    ).select_related('user', 'quest')

    for progress in pending:
        progress.user.add_xp(progress.quest.xp_reward)
        XPTransaction.objects.create(
            user=progress.user,
            amount=progress.quest.xp_reward,
            reason=XPTransaction.Reason.DAILY_QUEST,
            description=f'Ежедневное задание: {progress.quest.title_ru}',
        )
        progress.xp_awarded = True
        progress.save(update_fields=['xp_awarded'])
    logger.info(f'Daily quest XP awarded to {pending.count()} users')
