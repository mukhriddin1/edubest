from rest_framework import serializers
from .models import TestTemplate, TestTemplateSection, TestSession, TestSessionQuestion, SectionResult
from apps.questions.models import Subject, Question, Answer


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name_ru', 'name_ky', 'section_key', 'icon', 'time_minutes', 'questions_count']


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'text_ru', 'text_ky', 'order']
        # Note: is_correct NOT included — never expose to client during test!


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'text_ru', 'text_ky', 'image',
            'column_a_ru', 'column_a_ky', 'column_b_ru', 'column_b_ky',
            'question_type', 'difficulty', 'answers',
        ]


class TestTemplateSectionSerializer(serializers.ModelSerializer):
    subject_name_ru = serializers.CharField(source='subject.name_ru', read_only=True)
    subject_name_ky = serializers.CharField(source='subject.name_ky', read_only=True)
    subject_key = serializers.CharField(source='subject.section_key', read_only=True)

    class Meta:
        model = TestTemplateSection
        fields = ['id', 'subject', 'subject_name_ru', 'subject_name_ky', 'subject_key',
                  'question_count', 'time_minutes', 'order']


class TestTemplateSerializer(serializers.ModelSerializer):
    sections = TestTemplateSectionSerializer(many=True, read_only=True)

    class Meta:
        model = TestTemplate
        fields = ['id', 'name_ru', 'name_ky', 'test_type', 'sections',
                  'requires_subscription', 'price', 'is_active']


class SessionQuestionSerializer(serializers.ModelSerializer):
    """Session question WITH question data, section_index for FE navigation."""
    question = QuestionSerializer(read_only=True)
    section_index = serializers.SerializerMethodField()
    subject_id = serializers.IntegerField(source='subject.id', read_only=True)

    class Meta:
        model = TestSessionQuestion
        fields = ['id', 'question', 'order', 'section_index', 'subject_id', 'selected_answer_id']

    def get_section_index(self, obj):
        """Determine which section this question belongs to by subject order."""
        template = obj.session.template
        sections = list(template.sections.all().order_by('order'))
        for i, section in enumerate(sections):
            if section.subject_id == obj.subject_id:
                return i
        return 0


class TestSessionDetailSerializer(serializers.ModelSerializer):
    """Full session data sent to FE to hydrate the test engine."""
    questions = SessionQuestionSerializer(source='session_questions', many=True, read_only=True)
    sections = TestTemplateSectionSerializer(source='template.sections', many=True, read_only=True)
    template_name = serializers.CharField(source='template.name_ru', read_only=True)

    class Meta:
        model = TestSession
        fields = [
            'id', 'template_name', 'status', 'current_section_index',
            'section_started_at', 'started_at', 'expires_at',
            'sections', 'questions',
        ]


class TestSessionSerializer(serializers.ModelSerializer):
    """Lightweight session for history list."""
    template_name = serializers.CharField(source='template.name_ru', read_only=True)

    class Meta:
        model = TestSession
        fields = ['id', 'template_name', 'status', 'scaled_score', 'raw_score',
                  'xp_earned', 'started_at', 'completed_at']


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_id = serializers.IntegerField()


class SectionResultSerializer(serializers.ModelSerializer):
    subject_name_ru = serializers.CharField(source='subject.name_ru', read_only=True)

    class Meta:
        model = SectionResult
        fields = ['subject_name_ru', 'total_questions', 'correct_answers',
                  'raw_score', 'scaled_score', 'time_spent_seconds']


class TestResultSerializer(serializers.ModelSerializer):
    """Full result with per-section breakdown and wrong answers."""
    section_results = SectionResultSerializer(many=True, read_only=True)
    wrong_questions = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name_ru', read_only=True)
    accuracy_percent = serializers.SerializerMethodField()

    class Meta:
        model = TestSession
        fields = [
            'id', 'template_name', 'scaled_score', 'raw_score', 'xp_earned',
            'accuracy_percent', 'completed_at', 'section_results', 'wrong_questions',
        ]

    def get_accuracy_percent(self, obj):
        total = obj.session_questions.count()
        if not total:
            return 0
        correct = obj.session_questions.filter(is_correct=True).count()
        return round(correct / total * 100, 1)

    def get_wrong_questions(self, obj):
        wrong = obj.session_questions.filter(is_correct=False).select_related(
            'question', 'question__subject'
        ).prefetch_related('question__answers')[:50]  # limit for performance

        result = []
        for sqq in wrong:
            q = sqq.question
            correct_answer = q.answers.filter(is_correct=True).first()
            result.append({
                'question_id': q.id,
                'text_ru': q.text_ru,
                'subject': q.subject.name_ru,
                'explanation_ru': q.explanation_ru,
                'your_answer_id': sqq.selected_answer_id,
                'correct_answer_id': correct_answer.id if correct_answer else None,
                'correct_answer_text': correct_answer.text_ru if correct_answer else None,
            })
        return result
