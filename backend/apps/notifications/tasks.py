"""
Notification Tasks
Handles OTP delivery via email and SMS, daily reminders, DB backup.
"""
import logging
import subprocess
import os
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('apps.notifications')


@shared_task(bind=True, max_retries=3)
def send_otp_notification(self, user_id, code, email=None, phone=None):
    """Send OTP via email and/or SMS."""
    message = f'Ваш код подтверждения EDU BEST: {code}\nКод действителен 5 минут.'

    if email:
        try:
            send_mail(
                subject='Код подтверждения EDU BEST',
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f'OTP email sent to {email}')
        except Exception as exc:
            logger.error(f'Failed to send OTP email: {exc}')
            raise self.retry(exc=exc, countdown=30)

    if phone:
        try:
            _send_sms(phone, message)
            logger.info(f'OTP SMS sent to {phone}')
        except Exception as exc:
            logger.warning(f'Failed to send OTP SMS to {phone}: {exc}')
            # SMS failure is non-critical if email was sent


@shared_task
def send_daily_quest_reminders():
    """Push email reminders for users who haven't started daily quests."""
    from django.contrib.auth import get_user_model
    from apps.gamification.models import UserDailyQuestProgress
    from django.utils import timezone

    User = get_user_model()
    today = timezone.now().date()

    # Find active users who haven't completed any quest today
    completed_user_ids = UserDailyQuestProgress.objects.filter(
        date=today, is_completed=True
    ).values_list('user_id', flat=True)

    users = User.objects.filter(
        is_active=True,
        role='student',
    ).exclude(id__in=completed_user_ids).only('email', 'first_name')[:500]  # batch limit

    for user in users:
        if user.email:
            try:
                send_mail(
                    subject='⚡ Не забудь про ежедневное задание!',
                    message=f'Привет, {user.first_name}!\n\nТы ещё не выполнил(а) задание на сегодня. '
                            f'Реши 5 задач и получи бонусный XP!\n\nEDU BEST',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

    logger.info(f'Daily quest reminders sent to {users.count()} users')


@shared_task
def backup_database():
    """Create a PostgreSQL dump and save to backup directory."""
    backup_dir = settings.DAILY_BACKUP_PATH if hasattr(settings, 'DAILY_BACKUP_PATH') else '/backups'
    os.makedirs(backup_dir, exist_ok=True)

    from django.utils import timezone
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f'{backup_dir}/edubest_{timestamp}.sql.gz'

    db = settings.DATABASES['default']
    cmd = [
        'pg_dump',
        f'--host={db.get("HOST", "db")}',
        f'--port={db.get("PORT", "5432")}',
        f'--username={db.get("USER", "edubest_user")}',
        f'--dbname={db.get("NAME", "edubest")}',
        '--no-password',
        '--format=custom',
        f'--file={filename}',
    ]

    env = os.environ.copy()
    env['PGPASSWORD'] = db.get('PASSWORD', '')

    try:
        result = subprocess.run(cmd, env=env, capture_output=True, timeout=300)
        if result.returncode == 0:
            logger.info(f'Database backup created: {filename}')
            _cleanup_old_backups(backup_dir, keep=7)
        else:
            logger.error(f'Backup failed: {result.stderr.decode()}')
    except Exception as exc:
        logger.error(f'Backup exception: {exc}')


def _cleanup_old_backups(backup_dir: str, keep: int = 7):
    """Keep only the N most recent backups."""
    import glob
    backups = sorted(glob.glob(f'{backup_dir}/edubest_*.sql.gz'))
    for old in backups[:-keep]:
        try:
            os.remove(old)
            logger.info(f'Removed old backup: {old}')
        except Exception:
            pass


def _send_sms(phone: str, message: str):
    """SMS sending — integrate your local Kyrgyz provider here."""
    provider = getattr(settings, 'SMS_PROVIDER', 'twilio')

    if provider == 'twilio':
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone,
        )
    else:
        logger.warning(f'SMS provider "{provider}" not configured, skipping SMS to {phone}')
