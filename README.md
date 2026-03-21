# EDU BEST — Платформа подготовки к ОРТ

> **Senior-уровень архитектура** · Django 4 · React 18 · PostgreSQL · Redis · Celery · Docker

---

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (Reverse Proxy)                │
│  Rate limiting · SSL/TLS · Static files · Gzip              │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
       ┌───────▼──────┐      ┌─────────▼──────┐
       │   Frontend   │      │    Backend     │
       │  React 18    │      │  Django 4 DRF  │
       │  Vite + TW   │      │  Gunicorn 4w   │
       └──────────────┘      └────────┬───────┘
                                      │
              ┌───────────────────────┼─────────────────┐
              │                       │                 │
       ┌──────▼──────┐       ┌────────▼──────┐  ┌──────▼──────┐
       │ PostgreSQL  │       │     Redis     │  │   Celery    │
       │  Primary DB │       │ Cache+Queue   │  │  Workers+Beat│
       └─────────────┘       └───────────────┘  └─────────────┘
```

## 📁 Структура проекта

```
edubest/
├── backend/
│   ├── apps/
│   │   ├── users/          # Auth, OTP, JWT, профили
│   │   ├── questions/      # База вопросов, темы, предметы
│   │   ├── tests/          # Движок тестирования, сессии, результаты
│   │   ├── gamification/   # XP, уровни, достижения, лидерборд
│   │   ├── payments/       # Подписки, разовые покупки, транзакции
│   │   └── notifications/  # Email, SMS, Celery уведомления
│   ├── config/             # settings.py, urls.py, celery.py
│   ├── utils/              # pagination, exceptions
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # Страницы (landing, dashboard, test engine...)
│   │   ├── components/     # UI компоненты
│   │   ├── store/          # Zustand (auth, test engine)
│   │   ├── api/            # Axios + JWT refresh interceptor
│   │   └── App.jsx         # Router с auth guards
│   └── package.json
├── nginx/
│   ├── nginx.conf          # Global settings, rate limiting
│   └── conf.d/default.conf # Virtual host, SSL, proxy
├── docker-compose.yml      # Full stack orchestration
└── .env.example
```

## 🚀 Быстрый старт (Local Dev)

```bash
# 1. Клонировать и настроить окружение
cp .env.example .env
# Отредактируй .env — заполни SECRET_KEY, DB пароли

# 2. Запустить весь стек
docker-compose up -d

# 3. Применить миграции (автоматически через entrypoint)
# Или вручную:
docker-compose exec backend python manage.py migrate

# 4. Создать суперпользователя
docker-compose exec backend python manage.py createsuperuser

# 5. Загрузить предметы ОРТ
docker-compose exec backend python manage.py shell -c "
from apps.questions.models import Subject
Subject.objects.get_or_create(name_ru='Математика', section_key='math', defaults={'time_minutes': 70, 'questions_count': 40, 'order': 1, 'name_ky': 'Математика'})
Subject.objects.get_or_create(name_ru='Аналогии', section_key='analogies', defaults={'time_minutes': 40, 'questions_count': 30, 'order': 2, 'name_ky': 'Аналогиялар'})
Subject.objects.get_or_create(name_ru='Чтение и понимание', section_key='reading', defaults={'time_minutes': 50, 'questions_count': 30, 'order': 3, 'name_ky': 'Окуу жана түшүнүү'})
Subject.objects.get_or_create(name_ru='Грамматика', section_key='grammar', defaults={'time_minutes': 30, 'questions_count': 20, 'order': 4, 'name_ky': 'Грамматика'})
print('Subjects created!')
"

# 6. Импорт вопросов из Excel
docker-compose exec backend python manage.py import_questions --file /path/to/math_questions.xlsx --subject math

# 7. Frontend (разработка)
cd frontend && npm install && npm run dev
```

## 📋 API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/v1/auth/register/` | Регистрация |
| POST | `/api/v1/auth/verify/` | Подтверждение OTP |
| POST | `/api/v1/auth/login/` | Вход (JWT) |
| POST | `/api/v1/auth/token/refresh/` | Обновить токен |
| GET  | `/api/v1/auth/profile/` | Профиль |
| GET  | `/api/v1/tests/templates/` | Список шаблонов тестов |
| POST | `/api/v1/tests/{id}/start/` | Начать тест |
| GET  | `/api/v1/tests/session/{id}/` | Состояние сессии |
| POST | `/api/v1/tests/session/{id}/answer/` | Ответить на вопрос |
| POST | `/api/v1/tests/session/{id}/advance/` | Перейти к следующему разделу |
| POST | `/api/v1/tests/session/{id}/complete/` | Завершить тест |
| GET  | `/api/v1/tests/result/{id}/` | Результаты |
| GET  | `/api/v1/tests/history/` | История тестов |
| GET  | `/api/v1/gamification/leaderboard/` | Лидерборд |
| GET  | `/api/v1/gamification/achievements/` | Достижения |

Swagger UI: `http://localhost/api/docs/`

## 🔒 Безопасность

- JWT в Authorization header (не в cookies для SPA)
- Refresh token rotation + blacklisting
- Rate limiting на всех auth endpoints (10 req/min)
- SQL injection protection (Django ORM)
- XSS protection headers (Nginx)
- CSRF protection
- Statement timeout на PostgreSQL (30s)
- Автобэкап БД каждые 24 часа

## ⚡ Производительность

- Redis кэш для горячих данных (сессии, лидерборд)
- PostgreSQL CONN_MAX_AGE=60 (connection pooling)
- Nginx gzip + static files caching (1 year)
- Celery для тяжёлых вычислений (scoring, emails)
- React lazy loading + code splitting
- Gunicorn 4 workers, 2 threads = 8 concurrent requests

## 📱 Excel формат для импорта вопросов

| text_ru | text_ky | difficulty | type | col_a_ru | col_a_ky | col_b_ru | col_b_ky | topic | explanation | ans1_ru | ans1_ky | ans1_correct | ans2_ru | ... |
|---------|---------|------------|------|----------|----------|----------|----------|-------|-------------|---------|---------|--------------|---------|-----|
| Найдите x... | Табыңыз x... | 3 | standard | | | | | Уравнения | Решение: ... | 12 | | 1 | 15 | |

## 🗺️ Roadmap

- [ ] Этап I: Настройка БД + моделей + Django admin
- [ ] Этап II: Backend API (Auth + Tests)
- [ ] Этап III: Frontend (Test Engine + Dashboard)
- [ ] Этап IV: Геймификация (XP, достижения, лидерборд)
- [ ] Этап V: Наполнение базы (1000+ вопросов)
- [ ] Этап VI: Деплой на VPS + SSL + домен

---

*Разработано по ТЗ EDU BEST — Senior Architecture*
