from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify/', views.verify_otp, name='verify-otp'),
    path('login/', views.CustomTokenObtainPairView.as_view() if hasattr(views, 'CustomTokenObtainPairView') else __import__('rest_framework_simplejwt.views', fromlist=['TokenObtainPairView']).TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', views.logout, name='logout'),
    path('password-reset/', views.password_reset_request, name='password-reset'),
    path('password-reset/confirm/', views.password_reset_confirm, name='password-reset-confirm'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
]
