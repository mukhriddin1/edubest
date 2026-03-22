"""
Test API Views — Session management, question delivery, answer submission
"""
import logging
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import TestTemplate, TestSession, TestSessionQuestion
from .services import TestGeneratorService, TestSessionService
from .serializers import (
    TestTemplateSerializer, TestSessionSerializer,
    TestSessionDetailSerializer, SubmitAnswerSerializer,
    TestResultSerializer,
)

logger = logging.getLogger('apps.tests')


@extend_schema(tags=['Tests'])
@api_view(['GET'])
@permission_classes([AllowAny])
def list_templates(request):
    """List available test templates."""
    templates = TestTemplate.objects.filter(is_active=True).prefetch_related('sections__subject')
    serializer = TestTemplateSerializer(templates, many=True, context={'request': request})
    return Response(serializer.data)


@extend_schema(tags=['Tests'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_test(request, template_id):
    """Start a new test session for the authenticated user."""
    try:
        template = TestTemplate.objects.prefetch_related('sections__subject').get(
            id=template_id, is_active=True
        )
    except TestTemplate.DoesNotExist:
        return Response({'error': 'Шаблон теста не найден'}, status=status.HTTP_404_NOT_FOUND)

    # Check subscription requirement
    if template.requires_subscription and not request.user.has_active_subscription:
        # Check one-time purchase
        from apps.payments.models import UserPurchase
        has_purchase = UserPurchase.objects.filter(
            user=request.user, template=template, is_active=True
        ).exists()
        if not has_purchase:
            return Response(
                {'error': 'Требуется подписка или разовая покупка', 'code': 'subscription_required'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

    # Check for existing in-progress session
    existing = TestSession.objects.filter(
        user=request.user,
        template=template,
        status=TestSession.Status.IN_PROGRESS,
    ).first()
    if existing:
        serializer = TestSessionDetailSerializer(existing, context={'request': request})
        return Response({'session': serializer.data, 'resumed': True})

    session = TestGeneratorService.generate_session(request.user, template)
    session = TestSessionService.start_session(session)
    serializer = TestSessionDetailSerializer(session, context={'request': request})
    return Response({'session': serializer.data, 'resumed': False}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Tests'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session(request, session_id):
    """Get current state of a test session (supports page refresh recovery)."""
    try:
        session = TestSession.objects.select_related('template').prefetch_related(
            'session_questions__question__answers',
            'session_questions__subject',
        ).get(id=session_id, user=request.user)
    except TestSession.DoesNotExist:
        return Response({'error': 'Сессия не найдена'}, status=status.HTTP_404_NOT_FOUND)

    # Restore cached answer state (survived page refresh)
    cached_state = TestSessionService.get_cached_state(session_id)

    serializer = TestSessionDetailSerializer(session, context={'request': request})
    data = serializer.data
    if cached_state:
        data['cached_answers'] = cached_state.get('answers', {})
    return Response(data)


@extend_schema(tags=['Tests'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answer(request, session_id):
    """Submit an answer for a question in the session."""
    try:
        session = TestSession.objects.get(id=session_id, user=request.user, status=TestSession.Status.IN_PROGRESS)
    except TestSession.DoesNotExist:
        return Response({'error': 'Активная сессия не найдена'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SubmitAnswerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        result = TestSessionService.submit_answer(session, data['question_id'], data['answer_id'])
        return Response(result)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Tests'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advance_section(request, session_id):
    """Explicitly finish current section and move to next (or complete test)."""
    try:
        session = TestSession.objects.select_related('template').get(
            id=session_id, user=request.user, status=TestSession.Status.IN_PROGRESS
        )
    except TestSession.DoesNotExist:
        return Response({'error': 'Активная сессия не найдена'}, status=status.HTTP_404_NOT_FOUND)

    has_next = TestSessionService.advance_section(session)
    session.refresh_from_db()

    return Response({
        'has_next_section': has_next,
        'current_section_index': session.current_section_index,
        'status': session.status,
    })


@extend_schema(tags=['Tests'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_test(request, session_id):
    """Force-complete a test session (e.g., user finished last section)."""
    try:
        session = TestSession.objects.get(id=session_id, user=request.user, status=TestSession.Status.IN_PROGRESS)
    except TestSession.DoesNotExist:
        return Response({'error': 'Активная сессия не найдена'}, status=status.HTTP_404_NOT_FOUND)

    session = TestSessionService.complete_session(session)
    serializer = TestResultSerializer(session, context={'request': request})
    return Response(serializer.data)


@extend_schema(tags=['Tests'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_result(request, session_id):
    """Get full results for a completed test."""
    try:
        session = TestSession.objects.prefetch_related(
            'section_results__subject',
            'session_questions__question__answers',
            'session_questions__subject',
        ).get(id=session_id, user=request.user, status=TestSession.Status.COMPLETED)
    except TestSession.DoesNotExist:
        return Response({'error': 'Результат не найден'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TestResultSerializer(session, context={'request': request})
    return Response(serializer.data)


@extend_schema(tags=['Tests'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_history(request):
    """Paginated list of completed tests for the current user."""
    sessions = TestSession.objects.filter(
        user=request.user,
        status=TestSession.Status.COMPLETED,
    ).select_related('template').order_by('-completed_at')

    from utils.pagination import StandardPagination
    paginator = StandardPagination()
    page = paginator.paginate_queryset(sessions, request)
    serializer = TestSessionSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
