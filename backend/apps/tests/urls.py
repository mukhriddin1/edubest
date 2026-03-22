from django.urls import path
from . import views

urlpatterns = [
    path('templates/', views.list_templates, name='test-templates'),
    path('<int:template_id>/start/', views.start_test, name='test-start'),
    path('session/<uuid:session_id>/', views.get_session, name='test-session'),
    path('session/<uuid:session_id>/answer/', views.submit_answer, name='test-answer'),
    path('session/<uuid:session_id>/advance/', views.advance_section, name='test-advance'),
    path('session/<uuid:session_id>/complete/', views.complete_test, name='test-complete'),
    path('result/<uuid:session_id>/', views.test_result, name='test-result'),
    path('history/', views.test_history, name='test-history'),
]
