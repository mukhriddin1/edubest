"""
Management command: import_questions
Usage: python manage.py import_questions --file questions.xlsx --subject math

Excel format:
  Columns: text_ru | text_ky | difficulty | type | column_a_ru | column_b_ru | topic |
           answer1_ru | answer1_correct | answer2_ru | answer2_correct | ... (up to 5 answers)
"""
import openpyxl
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.questions.models import Question, Answer, Subject, Topic


class Command(BaseCommand):
    help = 'Import questions from Excel file'

    def add_arguments(self, parser):
        parser.add_argument('--file', required=True, help='Path to .xlsx file')
        parser.add_argument('--subject', required=True, help='Subject section_key (math, analogies, reading, grammar)')
        parser.add_argument('--dry-run', action='store_true', help='Validate only, do not save')

    def handle(self, *args, **options):
        filepath = options['file']
        subject_key = options['subject']
        dry_run = options['dry_run']

        try:
            subject = Subject.objects.get(section_key=subject_key)
        except Subject.DoesNotExist:
            raise CommandError(f'Subject with key "{subject_key}" not found')

        try:
            wb = openpyxl.load_workbook(filepath)
            ws = wb.active
        except Exception as e:
            raise CommandError(f'Cannot open file: {e}')

        rows = list(ws.iter_rows(min_row=2, values_only=True))
        self.stdout.write(f'Found {len(rows)} rows in file...')

        created = 0
        errors = []

        with transaction.atomic():
            for idx, row in enumerate(rows, start=2):
                try:
                    if not row[0]:
                        continue
                    q = self._create_question(row, subject)
                    if not dry_run:
                        q.save()
                        self._create_answers(q, row)
                    created += 1
                except Exception as e:
                    errors.append(f'Row {idx}: {e}')

            if dry_run or errors:
                transaction.set_rollback(True)

        if errors:
            self.stderr.write(f'\n❌ {len(errors)} errors:')
            for err in errors[:20]:
                self.stderr.write(f'  {err}')
        else:
            self.stdout.write(self.style.SUCCESS(
                f'✅ {"Would import" if dry_run else "Imported"} {created} questions'
            ))

    def _create_question(self, row, subject):
        (text_ru, text_ky, difficulty, q_type,
         col_a_ru, col_a_ky, col_b_ru, col_b_ky,
         topic_name, explanation_ru, *_) = (list(row) + [None] * 20)[:20]

        if not text_ru:
            raise ValueError('text_ru is required')

        topic = None
        if topic_name:
            topic, _ = Topic.objects.get_or_create(
                subject=subject,
                name_ru=str(topic_name).strip(),
                defaults={'name_ky': ''}
            )

        return Question(
            subject=subject,
            topic=topic,
            text_ru=str(text_ru).strip(),
            text_ky=str(text_ky).strip() if text_ky else '',
            difficulty=int(difficulty) if difficulty else 3,
            question_type=str(q_type).strip() if q_type else 'standard',
            column_a_ru=str(col_a_ru).strip() if col_a_ru else '',
            column_a_ky=str(col_a_ky).strip() if col_a_ky else '',
            column_b_ru=str(col_b_ru).strip() if col_b_ru else '',
            column_b_ky=str(col_b_ky).strip() if col_b_ky else '',
            explanation_ru=str(explanation_ru).strip() if explanation_ru else '',
            is_published=True,
        )

    def _create_answers(self, question, row):
        # Answers start at column index 10: ans1_ru, ans1_ky, ans1_correct, ans2_ru...
        row_list = list(row) + [None] * 40
        answer_data = row_list[10:]

        answers = []
        for i in range(5):
            base = i * 3
            text_ru = answer_data[base]
            text_ky = answer_data[base + 1]
            is_correct = answer_data[base + 2]
            if not text_ru:
                break
            answers.append(Answer(
                question=question,
                text_ru=str(text_ru).strip(),
                text_ky=str(text_ky).strip() if text_ky else '',
                is_correct=bool(is_correct),
                order=i,
            ))

        if not answers:
            raise ValueError('No answers provided')
        if not any(a.is_correct for a in answers):
            raise ValueError('No correct answer marked')

        Answer.objects.bulk_create(answers)
