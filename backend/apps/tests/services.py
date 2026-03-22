"""
Test Service Layer
Contains all business logic for test generation, session management, and ORT scoring.
"""
import logging
import random
from datetime import timedelta
from typing import Optional

from django.db import transaction
from django.utils import timezone
from django.core.cache import cache

from apps.questions.models import Question, Subject
from apps.tests.models import TestSession, TestSessionQuestion, TestTemplate, SectionResult

logger = logging.getLogger('apps.tests')

SCALE_BREAKPOINTS = [
    (0, 0, 100),
    (1, 5, 105),
    (6, 10, 115),
    (11, 20, 125),
    (21, 30, 140),
    (31, 40, 155),
    (41, 50, 168),
    (51, 60, 180),
    (61, 70, 193),
    (71, 80, 206),
    (81, 90, 220),
    (91, 100, 235),
    (101, 110, 242),
    (111, 120, 245),
]


def raw_to_scaled_score(raw: int) -> int:
    for i, (low, high, scaled) in enumerate(SCALE_BREAKPOINTS):
        if low <= raw <= high:
            return scaled
    return 245


class TestGeneratorService:
    DIFFICULTY_DISTRIBUTION = {
        1: 0.20,
        2: 0.25,
        3: 0.25,
        4: 0.20,
        5: 0.10,
    }

    @classmethod
    def generate_session(cls, user, template: TestTemplate) -> TestSession:
        with transaction.atomic():
            session = TestSession.objects.create(
                user=user,
                template=template,
                status=TestSession.Status.PENDING,
            )

            order = 0
            for section in template.sections.all().order_by('order'):
                questions = cls._select_questions(
                    subject=section.subject,
                    count=section.question_count,
                )
                bulk_sqq = [
                    TestSessionQuestion(
                        session=session,
                        question=q,
                        subject=section.subject,
                        order=order + i,
                    )
                    for i, q in enumerate(questions)
                ]
                TestSessionQuestion.objects.bulk_create(bulk_sqq)
                order += section.question_count

            return session

    @classmethod
    def _select_questions(cls, subject: Subject, count: int):
        selected = []
        remaining = count

        for difficulty, ratio in cls.DIFFICULTY_DISTRIBUTION.items():
            n = round(count * ratio)
            qs = list(
                Question.objects.filter(
                    subject=subject,
                    difficulty=difficulty,
                    is_published=True,
                ).values_list('id', flat=True)
            )
            if len(qs) >= n:
                selected.extend(random.sample(qs, n))
                remaining -= n
            else:
                selected.extend(qs)
                remaining -= len(qs)

        if remaining > 0:
            used_ids = set(selected)
            fallback = list(
                Question.objects.filter(subject=subject, is_published=True)
                .exclude(id__in=used_ids)
                .values_list('id', flat=True)[:remaining]
            )
            selected.extend(fallback)

        random.shuffle(selected)
        return Question.objects.filter(id__in=selected[:count])


class TestSessionService:
    CACHE_KEY = 'test_session:{session_id}:state'

    @classmethod
    def start_session(cls, session: TestSession) -> TestSession:
        now = timezone.now()
        session.status = TestSession.Status.IN_PROGRESS
        session.started_at = now
        session.section_started_at = now
        total_minutes = sum(s.time_minutes for s in session.template.sections.all())
        session.expires_at = now + timedelta(minutes=total_minutes + 10)
        session.save(update_fields=['status', 'started_at', 'section_started_at', 'expires_at'])
        cls._cache_session_state(session)
        return session

    @classmethod
    def submit_answer(cls, session: TestSession, question_id: int, answer_id: int) -> dict:
        try:
            sqq = TestSessionQuestion.objects.select_related('question').get(
                session=session, question_id=question_id
            )
        except TestSessionQuestion.DoesNotExist:
            raise ValueError('Вопрос не принадлежит этой сессии')

        from apps.questions.models import Answer
        correct_answer = sqq.question.answers.filter(is_correct=True).first()
        is_correct = correct_answer and correct_answer.id == answer_id

        sqq.selected_answer_id = answer_id
        sqq.is_correct = is_correct
        sqq.answered_at = timezone.now()
        sqq.save(update_fields=['selected_answer_id', 'is_correct', 'answered_at'])

        cls._update_cache(session.id, question_id, answer_id)

        return {
            'is_correct': is_correct,
            'correct_answer_id': correct_answer.id if correct_answer else None,
        }

    @classmethod
    def advance_section(cls, session: TestSession) -> bool:
        sections = list(session.template.sections.all().order_by('order'))
        next_index = session.current_section_index + 1

        if next_index >= len(sections):
            cls.complete_session(session)
            return False

        session.current_section_index = next_index
        session.section_started_at = timezone.now()
        session.save(update_fields=['current_section_index', 'section_started_at'])
        return True

    @classmethod
    @transaction.atomic
    def complete_session(cls, session: TestSession) -> TestSession:
        if session.status == TestSession.Status.COMPLETED:
            return session

        now = timezone.now()
        session.status = TestSession.Status.COMPLETED
        session.completed_at = now

        total_raw = 0
        for section_def in session.template.sections.all():
            sqqs = session.session_questions.filter(subject=section_def.subject)
            correct = sqqs.filter(is_correct=True).count()
            total = sqqs.count()
            section_scaled = raw_to_scaled_score(correct)
            SectionResult.objects.update_or_create(
                session=session,
                subject=section_def.subject,
                defaults={
                    'total_questions': total,
                    'correct_answers': correct,
                    'raw_score': correct,
                    'scaled_score': section_scaled,
                    'time_spent_seconds': 0,
                },
            )
            total_raw += correct

        session.raw_score = total_raw
        session.scaled_score = raw_to_scaled_score(total_raw)

        from django.conf import settings
        xp = total_raw * getattr(settings, 'XP_PER_TEST_CORRECT_ANSWER', 2)
        session.xp_earned = xp
        session.user.add_xp(xp)

        session.save(update_fields=['status', 'completed_at', 'raw_score', 'scaled_score', 'xp_earned'])

        from apps.gamification.tasks import process_test_completion
        process_test_completion.delay(str(session.id))

        cache.delete(cls.CACHE_KEY.format(session_id=str(session.id)))
        return session

    @classmethod
    def _cache_session_state(cls, session: TestSession):
        key = cls.CACHE_KEY.format(session_id=str(session.id))
        cache.set(key, {'section': session.current_section_index, 'answers': {}}, timeout=86400)

    @classmethod
    def _update_cache(cls, session_id, question_id, answer_id):
        key = cls.CACHE_KEY.format(session_id=str(session_id))
        state = cache.get(key, {})
        answers = state.get('answers', {})
        answers[str(question_id)] = answer_id
        state['answers'] = answers
        cache.set(key, state, timeout=86400)

    @classmethod
    def get_cached_state(cls, session_id) -> Optional[dict]:
        return cache.get(cls.CACHE_KEY.format(session_id=str(session_id)))
