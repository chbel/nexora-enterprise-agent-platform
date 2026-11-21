"""Celery application used by the celery-worker service."""
from celery import Celery

from backend.core.config import settings

celery_app = Celery(
    "enterprise_agentic_ai",
    broker=settings.redis_url,
    backend=settings.redis_url,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    broker_connection_retry_on_startup=True,
)
