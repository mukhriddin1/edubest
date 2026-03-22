from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def plans(request):
    from apps.payments.models import SubscriptionPlan
    plans = SubscriptionPlan.objects.filter(is_active=True).order_by('order')
    data = [
        {
            'id': p.id,
            'name_ru': p.name_ru,
            'price': str(p.price),
            'duration_days': p.duration_days,
            'features': p.features,
            'is_featured': p.is_featured,
        }
        for p in plans
    ]
    return Response({'results': data})

urlpatterns = [
    path('plans/', plans, name='plans'),
]
