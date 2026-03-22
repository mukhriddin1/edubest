from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
import logging

logger = logging.getLogger('apps')


def custom_exception_handler(exc, context):
    """Standardized error response format."""
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        # Flatten validation errors
        if isinstance(errors, dict):
            error_messages = []
            for field, messages in errors.items():
                if isinstance(messages, list):
                    for msg in messages:
                        prefix = '' if field == 'non_field_errors' else f'{field}: '
                        error_messages.append(f'{prefix}{msg}')
                else:
                    error_messages.append(str(messages))
            response.data = {
                'success': False,
                'errors': errors,
                'message': error_messages[0] if error_messages else 'Ошибка запроса',
            }
        else:
            response.data = {
                'success': False,
                'message': str(errors),
                'errors': None,
            }

    return response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
        })
