from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger('apps.tests')


@shared_task
def expire_stale_sessions():
    """Mark in-progress sessions older than 4 hours as expired."""
    from apps.tests.models import TestSession
    cutoff = timezone.now() - timedelta(hours=4)
    expired = TestSession.objects.filter(
        status=TestSession.Status.IN_PROGRESS,
        started_at__lt=cutoff,
    ).update(status=TestSession.Status.EXPIRED)
    if expired:
        logger.info(f'Expired {expired} stale test sessions')
