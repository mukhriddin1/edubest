"""
Auth API Views — Registration, OTP, JWT, Profile, Password Reset
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
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from .models import OTPCode
from .serializers import (
    UserRegisterSerializer, OTPVerifySerializer, UserProfileSerializer,
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
        logger.info('New user registered', extra={'user_id': user.id, 'email': user.email})
        return Response(
            {'message': 'Регистрация успешна. Проверьте код подтверждения.', 'user_id': user.id},
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def verify_otp(request):
    """Verify OTP code and activate account (or confirm password reset)."""
    serializer = OTPVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if data['purpose'] == OTPCode.Purpose.REGISTER:
        user = data['otp'].user
        user.is_active = True
        user.is_verified = True
        user.save(update_fields=['is_active', 'is_verified'])
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Аккаунт подтверждён!',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data,
        })

    return Response({'message': 'Код подтверждён', 'verified': True})


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    filters = {}
    if data.get('email'):
        filters['email'] = data['email']
    else:
        filters['phone'] = data['phone']

    try:
        user = User.objects.get(**filters)
    except User.DoesNotExist:
        # Don't reveal if user exists
        return Response({'message': 'Если аккаунт найден, код отправлен.'})

    import random, string
    code = ''.join(random.choices(string.digits, k=6))
    OTPCode.objects.create(
        user=user,
        email=data.get('email'),
        phone=data.get('phone'),
        code=code,
        purpose=OTPCode.Purpose.RESET_PASSWORD,
        expires_at=timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
    )
    from apps.notifications.tasks import send_otp_notification
    send_otp_notification.delay(user.id, code, data.get('email'), str(data.get('phone', '')))
    return Response({'message': 'Если аккаунт найден, код отправлен.'})


@extend_schema(tags=['Auth'])
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Verify OTP first
    verify_data = {
        'email': data.get('email'),
        'phone': data.get('phone'),
        'code': data['code'],
        'purpose': OTPCode.Purpose.RESET_PASSWORD,
    }
    verify_ser = OTPVerifySerializer(data=verify_data)
    verify_ser.is_valid(raise_exception=True)

    user = verify_ser.validated_data['otp'].user
    user.set_password(data['new_password'])
    user.save(update_fields=['password'])
    logger.info('Password reset', extra={'user_id': user.id})
    return Response({'message': 'Пароль успешно изменён'})


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
