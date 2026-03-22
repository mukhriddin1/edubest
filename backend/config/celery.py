import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('edubest')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ── Periodic Tasks ─────────────────────────────────────────────────────────────
app.conf.beat_schedule = {
    # Refresh weekly leaderboard every Monday at midnight
    'refresh-weekly-leaderboard': {
        'task': 'apps.gamification.tasks.refresh_weekly_leaderboard',
        'schedule': crontab(hour=0, minute=0, day_of_week=1),
    },
    # Send daily quest reminders at 9am
    'send-daily-quest-reminders': {
        'task': 'apps.notifications.tasks.send_daily_quest_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    # Database backup every 24 hours
    'backup-database': {
        'task': 'apps.notifications.tasks.backup_database',
        'schedule': crontab(hour=2, minute=0),
    },
    # Expire stale test sessions (in-progress > 4 hours)
    'expire-stale-test-sessions': {
        'task': 'apps.tests.tasks.expire_stale_sessions',
        'schedule': crontab(minute='*/30'),
    },
    # Award daily quest XP to completers
    'process-daily-quests': {
        'task': 'apps.gamification.tasks.process_daily_quests',
        'schedule': crontab(hour=23, minute=55),
    },
}
