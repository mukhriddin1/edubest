#!/bin/bash
# ============================================================
#  EDU BEST — Бэкап базы данных
#  Добавь в cron: 0 2 * * * /var/www/edubest/scripts/backup.sh
# ============================================================
set -euo pipefail

BACKUP_DIR="/var/backups/edubest"
DB_NAME="edubest"
DB_USER="edubest_user"
KEEP_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/edubest_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Читаем пароль из .env
DB_PASS=$(grep '^DATABASE_URL=' /var/www/edubest/backend/.env | sed 's/.*:\(.*\)@.*/\1/')
export PGPASSWORD="${DB_PASS}"

echo "[$(date)] Начало бэкапа..."

pg_dump \
    --host=localhost \
    --port=5432 \
    --username="${DB_USER}" \
    --format=custom \
    --compress=9 \
    "${DB_NAME}" \
| gzip > "${FILENAME}"

SIZE=$(du -sh "${FILENAME}" | cut -f1)
echo "[$(date)] Бэкап создан: ${FILENAME} (${SIZE})"

# Удаление старых бэкапов
find "${BACKUP_DIR}" -name "edubest_*.sql.gz" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] Старые бэкапы (>${KEEP_DAYS} дней) удалены"

unset PGPASSWORD
