"""
Question Bank Models
Supports standard multiple choice and "column comparison" (Сравнение колонок) ORT question types.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class Subject(models.Model):
    """Предмет (Математика, Аналогии, Чтение...)"""
    class SectionKey(models.TextChoices):
        MATH = 'math', _('Математика')
        ANALOGIES = 'analogies', _('Аналогии')
        READING = 'reading', _('Чтение и понимание')
        GRAMMAR = 'grammar', _('Грамматика')

    name_ru = models.CharField(_('Название (рус)'), max_length=100)
    name_ky = models.CharField(_('Название (кырг)'), max_length=100)
    section_key = models.CharField(_('Ключ секции'), max_length=20, choices=SectionKey.choices, unique=True)
    order = models.PositiveSmallIntegerField(_('Порядок'), default=0)
    icon = models.CharField(_('Иконка'), max_length=50, blank=True)
    time_minutes = models.PositiveSmallIntegerField(_('Время (мин)'), default=60)
    questions_count = models.PositiveSmallIntegerField(_('Кол-во вопросов'), default=30)

    class Meta:
        verbose_name = _('Предмет')
        verbose_name_plural = _('Предметы')
        ordering = ['order']

    def __str__(self):
        return self.name_ru


class Topic(models.Model):
    """Подтема (напр. "Треугольники" для Математики)"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name_ru = models.CharField(_('Название (рус)'), max_length=200)
    name_ky = models.CharField(_('Название (кырг)'), max_length=200)

    class Meta:
        verbose_name = _('Тема')
        verbose_name_plural = _('Темы')
        ordering = ['name_ru']

    def __str__(self):
        return f'{self.subject.name_ru} → {self.name_ru}'


class Question(models.Model):
    class QuestionType(models.TextChoices):
        STANDARD = 'standard', _('Стандартный')
        COLUMN_COMPARE = 'column_compare', _('Сравнение колонок')

    class Difficulty(models.IntegerChoices):
        EASY = 1, _('Лёгкий')
        EASY_MEDIUM = 2, _('Ниже среднего')
        MEDIUM = 3, _('Средний')
        MEDIUM_HARD = 4, _('Выше среднего')
        HARD = 5, _('Сложный')

    # Identification
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name='questions', db_index=True)
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')

    # Content (bilingual)
    text_ru = models.TextField(_('Текст вопроса (рус)'))
    text_ky = models.TextField(_('Текст вопроса (кырг)'), blank=True)
    image = models.ImageField(_('Изображение'), upload_to='questions/', null=True, blank=True)

    # For column comparison questions
    column_a_ru = models.TextField(_('Колонка А (рус)'), blank=True)
    column_a_ky = models.TextField(_('Колонка А (кырг)'), blank=True)
    column_b_ru = models.TextField(_('Колонка Б (рус)'), blank=True)
    column_b_ky = models.TextField(_('Колонка Б (кырг)'), blank=True)

    # Meta
    question_type = models.CharField(_('Тип'), max_length=20, choices=QuestionType.choices, default=QuestionType.STANDARD)
    difficulty = models.PositiveSmallIntegerField(_('Сложность'), choices=Difficulty.choices, default=Difficulty.MEDIUM, db_index=True)

    # Explanation
    explanation_ru = models.TextField(_('Объяснение (рус)'), blank=True)
    explanation_ky = models.TextField(_('Объяснение (кырг)'), blank=True)

    # Authorship
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_questions')
    is_published = models.BooleanField(_('Опубликован'), default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Вопрос')
        verbose_name_plural = _('Вопросы')
        indexes = [
            models.Index(fields=['subject', 'difficulty', 'is_published']),
            models.Index(fields=['topic', 'is_published']),
        ]

    def __str__(self):
        return f'[{self.subject.name_ru}] {self.text_ru[:80]}'

    def get_text(self, lang='ru'):
        return self.text_ky if lang == 'ky' and self.text_ky else self.text_ru


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text_ru = models.CharField(_('Текст ответа (рус)'), max_length=500)
    text_ky = models.CharField(_('Текст ответа (кырг)'), max_length=500, blank=True)
    is_correct = models.BooleanField(_('Правильный'), default=False)
    order = models.PositiveSmallIntegerField(_('Порядок'), default=0)

    class Meta:
        verbose_name = _('Ответ')
        verbose_name_plural = _('Ответы')
        ordering = ['order']

    def __str__(self):
        marker = '✓' if self.is_correct else '✗'
        return f'{marker} {self.text_ru[:60]}'
