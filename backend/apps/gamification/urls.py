from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard(request):
    from apps.gamification.models import WeeklyLeaderboard
    from django.utils import timezone
    from datetime import timedelta
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    entries = WeeklyLeaderboard.objects.filter(
        week_start=week_start
    ).select_related('user').order_by('rank')[:10]
    data = [
        {
            'rank': e.rank,
            'user_name': e.user.full_name or e.user.email,
            'xp_this_week': e.xp_this_week,
        }
        for e in entries
    ]
    return Response({'results': data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def achievements(request):
    from apps.gamification.models import UserAchievement
    earned = UserAchievement.objects.filter(
        user=request.user
    ).select_related('achievement')
    data = [
        {
            'id': ua.achievement.id,
            'name_ru': ua.achievement.name_ru,
            'description_ru': ua.achievement.description_ru,
            'icon': ua.achievement.icon,
            'earned_at': ua.earned_at,
        }
        for ua in earned
    ]
    return Response({'results': data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_quests(request):
    from apps.gamification.models import DailyQuest, UserDailyQuestProgress
    from django.utils import timezone
    today = timezone.now().date()
    quests = DailyQuest.objects.filter(is_active=True)
    result = []
    for quest in quests:
        progress = UserDailyQuestProgress.objects.filter(
            user=request.user, quest=quest, date=today
        ).first()
        result.append({
            'id': quest.id,
            'title_ru': quest.title_ru,
            'target_value': quest.target_value,
            'xp_reward': quest.xp_reward,
            'progress': progress.progress if progress else 0,
            'is_completed': progress.is_completed if progress else False,
        })
    return Response({'results': result})

urlpatterns = [
    path('leaderboard/', leaderboard, name='leaderboard'),
    path('achievements/', achievements, name='achievements'),
    path('daily-quests/', daily_quests, name='daily-quests'),
]
