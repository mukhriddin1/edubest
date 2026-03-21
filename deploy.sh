#!/bin/bash
# ============================================================
#  EDU BEST — Полный деплой на Ubuntu 22.04 (без Docker)
#  Запуск: sudo bash deploy.sh
# ============================================================
set -euo pipefail

# ── Цвета для вывода ──────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
die()  { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

# ── Конфигурация (измени под свой сервер) ─────────────────────
APP_USER="edubest"
APP_DIR="/var/www/edubest"
REPO_URL="https://github.com/YOUR_USERNAME/edubest.git"  # ← вставь свой
DOMAIN="yourdomain.com"                                   # ← вставь домен
DB_NAME="edubest"
DB_USER="edubest_user"
DB_PASS="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)"
PYTHON_VERSION="3.11"
NODE_VERSION="20"

# ── Проверка root ─────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "Запускай от root: sudo bash deploy.sh"

log "=== Начинаем деплой EDU BEST ==="

# ── 1. Обновление системы ─────────────────────────────────────
log "1/12 Обновление пакетов..."
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q \
    curl wget git unzip build-essential \
    software-properties-common \
    libpq-dev libssl-dev libffi-dev \
    supervisor \
    certbot python3-certbot-nginx \
    postgresql postgresql-contrib \
    redis-server \
    nginx \
    python${PYTHON_VERSION} python${PYTHON_VERSION}-dev python${PYTHON_VERSION}-venv python3-pip \
    postgresql-client
ok "Пакеты установлены"

# ── 2. Node.js ────────────────────────────────────────────────
log "2/12 Установка Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi
ok "Node.js $(node -v)"

# ── 3. Системный пользователь ─────────────────────────────────
log "3/12 Создание пользователя ${APP_USER}..."
if ! id "${APP_USER}" &>/dev/null; then
    useradd -m -s /bin/bash "${APP_USER}"
fi
ok "Пользователь ${APP_USER} готов"

# ── 4. PostgreSQL ─────────────────────────────────────────────
log "4/12 Настройка PostgreSQL..."
systemctl enable --now postgresql

sudo -u postgres psql <<PSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
CREATE DATABASE IF NOT EXISTS ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
PSQL
ok "PostgreSQL настроен (DB: ${DB_NAME}, User: ${DB_USER})"

# ── 5. Redis ──────────────────────────────────────────────────
log "5/12 Настройка Redis..."
systemctl enable --now redis-server
redis-cli ping | grep -q PONG && ok "Redis работает"

# ── 6. Папка проекта ─────────────────────────────────────────
log "6/12 Клонирование репозитория..."
mkdir -p "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

if [ -d "${APP_DIR}/.git" ]; then
    sudo -u "${APP_USER}" git -C "${APP_DIR}" pull
else
    sudo -u "${APP_USER}" git clone "${REPO_URL}" "${APP_DIR}"
fi
ok "Код скачан в ${APP_DIR}"

# ── 7. Python virtualenv + зависимости ───────────────────────
log "7/12 Настройка Python virtualenv..."
sudo -u "${APP_USER}" python${PYTHON_VERSION} -m venv "${APP_DIR}/venv"
sudo -u "${APP_USER}" "${APP_DIR}/venv/bin/pip" install --upgrade pip wheel
sudo -u "${APP_USER}" "${APP_DIR}/venv/bin/pip" install -r "${APP_DIR}/backend/requirements.txt"
ok "Python зависимости установлены"

# ── 8. Создание .env файла ────────────────────────────────────
log "8/12 Генерация .env..."
SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')"

cat > "${APP_DIR}/backend/.env" <<ENV
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},localhost,127.0.0.1

DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

REDIS_URL=redis://127.0.0.1:6379/0
CELERY_BROKER_URL=redis://127.0.0.1:6379/1
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/2

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=EDU BEST <no-reply@${DOMAIN}>

CORS_ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}

PLATFORM_COMMISSION_PERCENT=20
DAILY_BACKUP_PATH=/var/backups/edubest
ENV

chown "${APP_USER}:${APP_USER}" "${APP_DIR}/backend/.env"
chmod 600 "${APP_DIR}/backend/.env"
ok ".env создан (SECRET_KEY и DB_PASS сгенерированы)"

# ── 9. Django: миграции, статика ─────────────────────────────
log "9/12 Django: migrate + collectstatic..."
cd "${APP_DIR}/backend"
sudo -u "${APP_USER}" "${APP_DIR}/venv/bin/python" manage.py migrate --noinput
sudo -u "${APP_USER}" "${APP_DIR}/venv/bin/python" manage.py collectstatic --noinput
mkdir -p "${APP_DIR}/backend/logs"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/backend/logs"
ok "Миграции применены, статика собрана"

# ── 10. Frontend: сборка ─────────────────────────────────────
log "10/12 Frontend: npm install + build..."
cd "${APP_DIR}/frontend"
sudo -u "${APP_USER}" npm ci --silent
sudo -u "${APP_USER}" VITE_API_URL=/api/v1 npm run build
ok "Frontend собран в ${APP_DIR}/frontend/dist"

# ── 11. systemd сервисы ───────────────────────────────────────
log "11/12 Установка systemd сервисов..."
bash "$(dirname "$0")/scripts/install_services.sh" \
    "${APP_USER}" "${APP_DIR}" "${DOMAIN}"
ok "Сервисы установлены"

# ── 12. Nginx ─────────────────────────────────────────────────
log "12/12 Настройка Nginx..."
bash "$(dirname "$0")/scripts/setup_nginx.sh" \
    "${APP_USER}" "${APP_DIR}" "${DOMAIN}"
ok "Nginx настроен"

# ── Итог ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  EDU BEST успешно задеплоен!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  DB Password (сохрани!): ${DB_PASS}"
echo "  Сайт:  http://${DOMAIN}"
echo "  Admin: http://${DOMAIN}/admin/"
echo ""
echo "  Следующие шаги:"
echo "  1. Добавь email в .env: ${APP_DIR}/backend/.env"
echo "  2. Получи SSL: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "  3. Создай суперпользователя:"
echo "     sudo -u ${APP_USER} ${APP_DIR}/venv/bin/python ${APP_DIR}/backend/manage.py createsuperuser"
echo ""
