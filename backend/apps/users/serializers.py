from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
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
            is_active=True,
        )
        return user


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
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Пароли не совпадают'})
        return data
