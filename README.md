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



*Разработано по ТЗ EDU BEST — Senior Architecture*
