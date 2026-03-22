"""
Auth API Views — Registration without Redis/Celery dependency
Users are activated immediately without OTP for simplicity
"""
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from .serializers import (
    UserRegisterSerializer, UserProfileSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)

User = get_user_model()
logger = logging.getLogger('apps.users')


class AuthThrottle(AnonRateThrottle):
    rate = '10/min'


@extend_schema(tags=['Auth'])
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-activate user immediately (no OTP needed)
        user.is_active = True
        user.is_verified = True
        user.save(update_fields=['is_active', 'is_verified'])

        # Return JWT tokens immediately
        refresh = RefreshToken.for_user(user)
        logger.info('New user registered', extra={'user_id': user.id, 'email': user.email})

        return Response(
            {
                'message': 'Регистрация успешна!',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Stub - OTP not required, users auto-activate."""
    return Response({'message': 'Аккаунт подтверждён!', 'verified': True})


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({'message': 'Если аккаунт найден, код отправлен.'})


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    filters = {}
    if data.get('email'):
        filters['email'] = data['email']
    elif data.get('phone'):
        filters['phone'] = data['phone']
    else:
        return Response({'error': 'Email обязателен'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(**filters)
        user.set_password(data['new_password'])
        user.save(update_fields=['password'])
        return Response({'message': 'Пароль успешно изменён'})
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(tags=['Profile'])
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Blacklist refresh token on logout."""
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Вы вышли из системы'})
    except Exception:
        return Response({'error': 'Недействительный токен'}, status=status.HTTP_400_BAD_REQUEST)
