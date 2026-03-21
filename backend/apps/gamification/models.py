"""
Gamification Models
XP tracking, achievements/badges, weekly leaderboard, daily quests.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()


class Achievement(models.Model):
    """Badge definitions."""
    class Category(models.TextChoices):
        QUANTITY = 'quantity', _('Количество')
        ACCURACY = 'accuracy', _('Точность')
        STREAK = 'streak', _('Серия')
        TOPIC = 'topic', _('По теме')
        SPECIAL = 'special', _('Особые')

    code = models.CharField(_('Код'), max_length=50, unique=True)
    name_ru = models.CharField(_('Название (рус)'), max_length=200)
    name_ky = models.CharField(_('Название (кырг)'), max_length=200, blank=True)
    description_ru = models.TextField(_('Описание (рус)'))
    description_ky = models.TextField(_('Описание (кырг)'), blank=True)
    icon = models.CharField(_('Иконка (emoji или URL)'), max_length=200)
    category = models.CharField(_('Категория'), max_length=20, choices=Category.choices)
    xp_reward = models.PositiveIntegerField(_('XP за достижение'), default=0)

    # Condition config (JSON): e.g. {"type": "solved_questions", "subject": "math", "count": 100}
    condition = models.JSONField(_('Условие'), default=dict)

    is_active = models.BooleanField(_('Активно'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Достижение')
        verbose_name_plural = _('Достижения')

    def __str__(self):
        return f'{self.icon} {self.name_ru}'


class UserAchievement(models.Model):
    """M2M: User ↔ Achievement, with earned timestamp."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'achievement']
        verbose_name = _('Достижение пользователя')
        verbose_name_plural = _('Достижения пользователей')


class XPTransaction(models.Model):
    """Audit log for all XP changes."""
    class Reason(models.TextChoices):
        TEST_CORRECT = 'test_correct', _('Правильный ответ')
        SECTION_COMPLETE = 'section_complete', _('Раздел завершён')
        PERFECT_SECTION = 'perfect_section', _('Идеальный раздел')
        DAILY_QUEST = 'daily_quest', _('Ежедневное задание')
        ACHIEVEMENT = 'achievement', _('Достижение')
        BONUS = 'bonus', _('Бонус')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='xp_transactions')
    amount = models.IntegerField(_('Количество XP'))
    reason = models.CharField(_('Причина'), max_length=30, choices=Reason.choices)
    description = models.CharField(_('Описание'), max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reference_id = models.CharField(_('ID объекта'), max_length=50, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at'])]


class WeeklyLeaderboard(models.Model):
    """Cached weekly XP leaderboard snapshot."""
    week_start = models.DateField(_('Начало недели'), db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaderboard_entries')
    xp_this_week = models.PositiveIntegerField(_('XP за неделю'), default=0)
    rank = models.PositiveSmallIntegerField(_('Место'), default=0)

    class Meta:
        unique_together = ['week_start', 'user']
        ordering = ['rank']
        indexes = [models.Index(fields=['week_start', 'rank'])]

    def __str__(self):
        return f'#{self.rank} {self.user} — {self.xp_this_week} XP ({self.week_start})'


class DailyQuest(models.Model):
    """Daily challenge definition."""
    class QuestType(models.TextChoices):
        SOLVE_N = 'solve_n', _('Решить N задач')
        CORRECT_STREAK = 'correct_streak', _('N правильных подряд')
        COMPLETE_SECTION = 'complete_section', _('Завершить раздел')

    title_ru = models.CharField(_('Название (рус)'), max_length=200)
    title_ky = models.CharField(_('Название (кырг)'), max_length=200, blank=True)
    quest_type = models.CharField(_('Тип'), max_length=20, choices=QuestType.choices)
    target_value = models.PositiveSmallIntegerField(_('Целевое значение'), default=5)
    xp_reward = models.PositiveIntegerField(_('XP награда'), default=15)
    subject = models.ForeignKey('questions.Subject', on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(_('Активно'), default=True)

    class Meta:
        verbose_name = _('Ежедневное задание')
        verbose_name_plural = _('Ежедневные задания')


class UserDailyQuestProgress(models.Model):
    """Tracks user's daily quest progress."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_quest_progress')
    quest = models.ForeignKey(DailyQuest, on_delete=models.CASCADE)
    date = models.DateField(_('Дата'), default=timezone.now)
    progress = models.PositiveSmallIntegerField(_('Прогресс'), default=0)
    is_completed = models.BooleanField(_('Выполнено'), default=False)
    xp_awarded = models.BooleanField(_('XP начислен'), default=False)

    class Meta:
        unique_together = ['user', 'quest', 'date']
        indexes = [models.Index(fields=['user', 'date'])]
