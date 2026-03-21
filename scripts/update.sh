#!/bin/bash
# ============================================================
#  EDU BEST — Обновление кода (после первого деплоя)
#  Запуск: sudo bash scripts/update.sh
# ============================================================
set -euo pipefail

APP_USER="edubest"
APP_DIR="/var/www/edubest"
VENV="${APP_DIR}/venv"
BACKEND="${APP_DIR}/backend"
FRONTEND="${APP_DIR}/frontend"

log()  { echo -e "\033[0;36m[INFO]\033[0m $1"; }
ok()   { echo -e "\033[0;32m[OK]\033[0m   $1"; }

log "Пул последних изменений..."
sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --ff-only
ok "Код обновлён"

log "Обновление Python-зависимостей..."
sudo -u "${APP_USER}" "${VENV}/bin/pip" install -q -r "${BACKEND}/requirements.txt"
ok "Зависимости обновлены"

log "Django: migrate + collectstatic..."
cd "${BACKEND}"
sudo -u "${APP_USER}" "${VENV}/bin/python" manage.py migrate --noinput
sudo -u "${APP_USER}" "${VENV}/bin/python" manage.py collectstatic --noinput --clear
ok "Django обновлён"

log "Frontend: сборка..."
cd "${FRONTEND}"
sudo -u "${APP_USER}" npm ci --silent
sudo -u "${APP_USER}" VITE_API_URL=/api/v1 npm run build
ok "Frontend пересобран"

log "Перезапуск сервисов..."
systemctl restart edubest-gunicorn
systemctl restart edubest-celery
systemctl restart edubest-celerybeat
systemctl reload nginx

sleep 2
for svc in edubest-gunicorn edubest-celery edubest-celerybeat; do
    systemctl is-active --quiet "${svc}" \
        && ok "${svc} работает" \
        || echo "  ❌ ${svc} — проблема, проверь: journalctl -u ${svc} -n 30"
done

ok "=== Обновление завершено ==="
