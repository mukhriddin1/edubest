"""
Payments Models
Subscriptions, one-time purchases, teacher revenue sharing, commission tracking.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()


class SubscriptionPlan(models.Model):
    """Available subscription packages."""
    class PlanType(models.TextChoices):
        MONTHLY = 'monthly', _('Месячный')
        SEASONAL = 'seasonal', _('Сезонный (3 мес)')
        YEARLY = 'yearly', _('Годовой')

    name_ru = models.CharField(_('Название (рус)'), max_length=100)
    name_ky = models.CharField(_('Название (кырг)'), max_length=100, blank=True)
    plan_type = models.CharField(_('Тип'), max_length=20, choices=PlanType.choices)
    price = models.DecimalField(_('Цена (сом)'), max_digits=8, decimal_places=2)
    duration_days = models.PositiveSmallIntegerField(_('Длительность (дней)'))
    description_ru = models.TextField(_('Описание (рус)'), blank=True)
    features = models.JSONField(_('Возможности'), default=list)
    is_active = models.BooleanField(_('Активен'), default=True)
    is_featured = models.BooleanField(_('Рекомендуемый'), default=False)
    order = models.PositiveSmallIntegerField(_('Порядок'), default=0)

    class Meta:
        verbose_name = _('Тарифный план')
        verbose_name_plural = _('Тарифные планы')
        ordering = ['order']

    def __str__(self):
        return f'{self.name_ru} — {self.price} сом'


class UserSubscription(models.Model):
    """Active user subscriptions."""
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Активна')
        EXPIRED = 'expired', _('Истекла')
        CANCELLED = 'cancelled', _('Отменена')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(_('Статус'), max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    started_at = models.DateTimeField(_('Начало'), auto_now_add=True)
    expires_at = models.DateTimeField(_('Истекает'))
    auto_renew = models.BooleanField(_('Автопродление'), default=False)

    class Meta:
        verbose_name = _('Подписка пользователя')
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.user} — {self.plan} до {self.expires_at.date()}'

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE and self.expires_at > timezone.now()


class UserPurchase(models.Model):
    """One-time purchase for specific test/course access."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    template = models.ForeignKey('tests.TestTemplate', on_delete=models.PROTECT, null=True, blank=True)
    amount_paid = models.DecimalField(_('Уплачено (сом)'), max_digits=8, decimal_places=2)
    is_active = models.BooleanField(_('Активен'), default=True)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Разовая покупка')
        unique_together = ['user', 'template']


class PaymentTransaction(models.Model):
    """Audit log for all payment operations."""
    class Status(models.TextChoices):
        PENDING = 'pending', _('В ожидании')
        COMPLETED = 'completed', _('Завершён')
        FAILED = 'failed', _('Ошибка')
        REFUNDED = 'refunded', _('Возврат')

    class Provider(models.TextChoices):
        MBANK = 'mbank', _('MBank')
        ODENGI = 'odengi', _('О!Деньги')
        BALANCE = 'balance', _('Баланс счёта')

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='transactions')
    amount = models.DecimalField(_('Сумма (сом)'), max_digits=10, decimal_places=2)
    provider = models.CharField(_('Провайдер'), max_length=20, choices=Provider.choices)
    status = models.CharField(_('Статус'), max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    provider_transaction_id = models.CharField(_('ID у провайдера'), max_length=200, blank=True)

    # What was purchased
    subscription = models.ForeignKey(UserSubscription, on_delete=models.SET_NULL, null=True, blank=True)
    purchase = models.ForeignKey(UserPurchase, on_delete=models.SET_NULL, null=True, blank=True)

    # Commission tracking (for teacher courses)
    commission_amount = models.DecimalField(_('Комиссия платформы'), max_digits=8, decimal_places=2, default=0)
    teacher_payout = models.DecimalField(_('Выплата учителю'), max_digits=8, decimal_places=2, default=0)

    metadata = models.JSONField(_('Метаданные'), default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Транзакция')
        verbose_name_plural = _('Транзакции')
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'status', '-created_at'])]
