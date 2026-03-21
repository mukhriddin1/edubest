"""
Test Session Models
Handles test lifecycle: generation → in-progress → completed → scored
ORT rules: strict timer per section, no going back, auto-submit on timeout.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from apps.questions.models import Subject, Question

User = get_user_model()


class TestTemplate(models.Model):
    """Pre-defined test structures (Full ORT, Math-only, Demo, Teacher-created)."""
    class TestType(models.TextChoices):
        FULL_ORT = 'full_ort', _('Полный ОРТ')
        SECTION = 'section', _('По предмету')
        DEMO = 'demo', _('Демо-тест')
        CUSTOM = 'custom', _('Авторский тест')

    name_ru = models.CharField(_('Название (рус)'), max_length=200)
    name_ky = models.CharField(_('Название (кырг)'), max_length=200, blank=True)
    test_type = models.CharField(_('Тип'), max_length=20, choices=TestType.choices, default=TestType.FULL_ORT)
    subjects = models.ManyToManyField(Subject, through='TestTemplateSection')
    is_active = models.BooleanField(_('Активен'), default=True)
    requires_subscription = models.BooleanField(_('Требует подписки'), default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    price = models.DecimalField(_('Цена (разовая покупка)'), max_digits=8, decimal_places=2, default=0)

    class Meta:
        verbose_name = _('Шаблон теста')
        verbose_name_plural = _('Шаблоны тестов')

    def __str__(self):
        return self.name_ru


class TestTemplateSection(models.Model):
    """Defines questions per subject within a test template."""
    template = models.ForeignKey(TestTemplate, on_delete=models.CASCADE, related_name='sections')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    question_count = models.PositiveSmallIntegerField(_('Кол-во вопросов'), default=30)
    time_minutes = models.PositiveSmallIntegerField(_('Время (мин)'), default=60)
    order = models.PositiveSmallIntegerField(_('Порядок'), default=0)

    class Meta:
        ordering = ['order']
        unique_together = ['template', 'subject']


class TestSession(models.Model):
    """Live test instance tied to a user."""
    class Status(models.TextChoices):
        PENDING = 'pending', _('Не начат')
        IN_PROGRESS = 'in_progress', _('В процессе')
        COMPLETED = 'completed', _('Завершён')
        EXPIRED = 'expired', _('Истёк')
        ABANDONED = 'abandoned', _('Прерван')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_sessions')
    template = models.ForeignKey(TestTemplate, on_delete=models.PROTECT)
    status = models.CharField(_('Статус'), max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    # Section tracking
    current_section_index = models.PositiveSmallIntegerField(_('Текущий раздел'), default=0)
    section_started_at = models.DateTimeField(_('Раздел начат'), null=True, blank=True)

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Scores (populated after completion)
    raw_score = models.PositiveSmallIntegerField(_('Сырой балл'), null=True, blank=True)
    scaled_score = models.PositiveSmallIntegerField(_('Тестовый балл'), null=True, blank=True)
    xp_earned = models.PositiveSmallIntegerField(_('XP получено'), default=0)

    class Meta:
        verbose_name = _('Сессия теста')
        verbose_name_plural = _('Сессии тестов')
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', '-started_at']),
        ]

    def __str__(self):
        return f'{self.user} — {self.template} [{self.status}]'


class TestSessionQuestion(models.Model):
    """Individual question assigned to a test session."""
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='session_questions')
    question = models.ForeignKey(Question, on_delete=models.PROTECT)
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)
    order = models.PositiveSmallIntegerField(_('Порядок'), default=0)

    # Answer tracking
    selected_answer_id = models.IntegerField(_('Выбранный ответ ID'), null=True, blank=True)
    is_correct = models.BooleanField(_('Правильный'), null=True, blank=True)
    answered_at = models.DateTimeField(_('Время ответа'), null=True, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ['session', 'question']


class SectionResult(models.Model):
    """Aggregated result per section after completion."""
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='section_results')
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)
    total_questions = models.PositiveSmallIntegerField()
    correct_answers = models.PositiveSmallIntegerField(default=0)
    raw_score = models.PositiveSmallIntegerField(default=0)
    scaled_score = models.PositiveSmallIntegerField(default=0)
    time_spent_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['session', 'subject']
