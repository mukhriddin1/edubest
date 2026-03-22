from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    return Response({'results': []})

urlpatterns = [
    path('', notifications_list, name='notifications-list'),
]
