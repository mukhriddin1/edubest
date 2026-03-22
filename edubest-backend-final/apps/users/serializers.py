import random
import string
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import OTPCode

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT tokens enriched with user data."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['level'] = user.level
        return token


class UserRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True)
    language = serializers.ChoiceField(choices=['ru', 'ky'], default='ru')

    def validate(self, data):
        if not data.get('email') and not data.get('phone'):
            raise serializers.ValidationError('Email или телефон обязательны')
        if data.get('email') and User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'Этот email уже используется'})
        if data.get('phone') and User.objects.filter(phone=data['phone']).exists():
            raise serializers.ValidationError({'phone': 'Этот номер уже используется'})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data.get('email'),
            phone=validated_data.get('phone'),
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            language=validated_data.get('language', 'ru'),
            role=User.Role.STUDENT,
            is_active=False,
        )
        self._send_otp(user, validated_data)
        return user

    def _send_otp(self, user, data):
        code = ''.join(random.choices(string.digits, k=6))
        OTPCode.objects.filter(
            email=data.get('email'), phone=data.get('phone'), purpose='register', is_used=False
        ).update(is_used=True)
        OTPCode.objects.create(
            user=user,
            email=data.get('email'),
            phone=data.get('phone'),
            code=code,
            purpose=OTPCode.Purpose.REGISTER,
            expires_at=timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
        )
        from apps.notifications.tasks import send_otp_notification
        send_otp_notification.delay(user.id, code, data.get('email'), str(data.get('phone', '')))


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=OTPCode.Purpose.choices)

    def validate(self, data):
        filters = {'purpose': data['purpose'], 'is_used': False}
        if data.get('email'):
            filters['email'] = data['email']
        elif data.get('phone'):
            filters['phone'] = data['phone']
        else:
            raise serializers.ValidationError('Email или телефон обязателен')

        try:
            otp = OTPCode.objects.filter(**filters).latest('created_at')
        except OTPCode.DoesNotExist:
            raise serializers.ValidationError('Код не найден')

        otp.attempts += 1
        otp.save(update_fields=['attempts'])

        if not otp.is_valid:
            raise serializers.ValidationError('Код недействителен или истёк')
        if otp.code != data['code']:
            raise serializers.ValidationError('Неверный код')

        otp.is_used = True
        otp.save(update_fields=['is_used'])
        data['otp'] = otp
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    has_active_subscription = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    xp_to_next_level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'avatar', 'bio', 'role', 'language', 'xp', 'level',
            'xp_to_next_level', 'balance', 'has_active_subscription',
            'subscription_expires', 'date_joined',
        ]
        read_only_fields = ['id', 'role', 'xp', 'level', 'balance', 'date_joined', 'subscription_expires']

    def get_xp_to_next_level(self, obj):
        thresholds = [0, 100, 250, 500, 900, 1500, 2300, 3300, 4500, 6000]
        if obj.level < len(thresholds):
            return thresholds[obj.level] - obj.xp
        return 0


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('email') and not data.get('phone'):
            raise serializers.ValidationError('Email или телефон обязателен')
        return data


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Пароли не совпадают'})
        return data
