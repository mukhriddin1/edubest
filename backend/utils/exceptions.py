from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        errors = response.data
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
