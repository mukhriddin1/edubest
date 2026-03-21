"""
EDU BEST User Model
Custom AbstractBaseUser with role-based access, XP, balance, and bilingual support.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField


class UserManager(BaseUserManager):
    def create_user(self, email=None, phone=None, password=None, **extra_fields):
        if not email and not phone:
            raise ValueError(_('Email или номер телефона обязателен'))
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email, phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        GUEST = 'guest', _('Гость')
        STUDENT = 'student', _('Ученик')
        TEACHER = 'teacher', _('Учитель')
        ADMIN = 'admin', _('Администратор')

    class Language(models.TextChoices):
        RU = 'ru', _('Русский')
        KY = 'ky', _('Кыргызча')

    # Identification
    email = models.EmailField(_('Email'), unique=True, null=True, blank=True, db_index=True)
    phone = PhoneNumberField(_('Телефон'), unique=True, null=True, blank=True, db_index=True)

    # Profile
    first_name = models.CharField(_('Имя'), max_length=100)
    last_name = models.CharField(_('Фамилия'), max_length=100)
    avatar = models.ImageField(_('Аватар'), upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(_('О себе'), blank=True)

    # Access control
    role = models.CharField(_('Роль'), max_length=20, choices=Role.choices, default=Role.STUDENT, db_index=True)
    is_active = models.BooleanField(_('Активен'), default=False)  # activated via OTP
    is_staff = models.BooleanField(_('Персонал'), default=False)
    is_verified = models.BooleanField(_('Верифицирован'), default=False)

    # Preferences
    language = models.CharField(_('Язык'), max_length=2, choices=Language.choices, default=Language.RU)

    # Gamification
    xp = models.PositiveIntegerField(_('Опыт (XP)'), default=0, db_index=True)
    level = models.PositiveIntegerField(_('Уровень'), default=1)

    # Financial
    balance = models.DecimalField(_('Баланс (сом)'), max_digits=10, decimal_places=2, default=0.00)

    # Timestamps
    date_joined = models.DateTimeField(_('Дата регистрации'), auto_now_add=True)
    last_login = models.DateTimeField(_('Последний вход'), null=True, blank=True)

    # Subscription
    subscription_expires = models.DateTimeField(_('Подписка до'), null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        indexes = [
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['xp']),
        ]

    def __str__(self):
        return self.full_name or self.email or str(self.phone)

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def has_active_subscription(self):
        from django.utils import timezone
        return self.subscription_expires and self.subscription_expires > timezone.now()

    def add_xp(self, amount: int) -> bool:
        """Add XP and check for level up. Returns True if leveled up."""
        self.xp += amount
        new_level = self._calculate_level()
        leveled_up = new_level > self.level
        self.level = new_level
        self.save(update_fields=['xp', 'level'])
        return leveled_up

    def _calculate_level(self) -> int:
        """Level thresholds: 1→0xp, 2→100, 3→250, 4→500... exponential growth."""
        thresholds = [0, 100, 250, 500, 900, 1500, 2300, 3300, 4500, 6000]
        for lvl, threshold in enumerate(thresholds, start=1):
            if self.xp < threshold:
                return lvl - 1
        return len(thresholds)


class OTPCode(models.Model):
    """One-time password for phone/email verification."""
    class Purpose(models.TextChoices):
        REGISTER = 'register', _('Регистрация')
        RESET_PASSWORD = 'reset_password', _('Сброс пароля')
        LOGIN = 'login', _('Вход')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes', null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = PhoneNumberField(null=True, blank=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    attempts = models.PositiveSmallIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [models.Index(fields=['email', 'purpose']), models.Index(fields=['phone', 'purpose'])]

    def __str__(self):
        return f'OTP {self.code} для {self.email or self.phone}'

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired and self.attempts < 5
