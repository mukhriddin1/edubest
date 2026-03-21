#!/bin/bash
# Устанавливает systemd-сервисы: gunicorn, celery worker, celery beat
set -euo pipefail

APP_USER="${1:-edubest}"
APP_DIR="${2:-/var/www/edubest}"
DOMAIN="${3:-yourdomain.com}"

VENV="${APP_DIR}/venv"
BACKEND="${APP_DIR}/backend"

# ── Gunicorn ─────────────────────────────────────────────────
cat > /etc/systemd/system/edubest-gunicorn.service <<EOF
[Unit]
Description=EDU BEST Gunicorn Application Server
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=notify
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${BACKEND}
Environment="PATH=${VENV}/bin"
EnvironmentFile=${BACKEND}/.env

ExecStart=${VENV}/bin/gunicorn config.wsgi:application \\
    --bind unix:/run/edubest/gunicorn.sock \\
    --workers 4 \\
    --threads 2 \\
    --worker-class gthread \\
    --worker-tmp-dir /dev/shm \\
    --timeout 60 \\
    --keep-alive 5 \\
    --max-requests 1000 \\
    --max-requests-jitter 100 \\
    --log-file ${BACKEND}/logs/gunicorn.log \\
    --log-level info \\
    --access-logfile ${BACKEND}/logs/access.log

ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
RuntimeDirectory=edubest
RuntimeDirectoryMode=0755

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ── Celery Worker ─────────────────────────────────────────────
cat > /etc/systemd/system/edubest-celery.service <<EOF
[Unit]
Description=EDU BEST Celery Worker
After=network.target redis.service postgresql.service
Requires=redis.service

[Service]
Type=forking
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${BACKEND}
Environment="PATH=${VENV}/bin"
EnvironmentFile=${BACKEND}/.env

ExecStart=${VENV}/bin/celery -A config worker \\
    --loglevel=info \\
    --concurrency=4 \\
    --prefetch-multiplier=1 \\
    -E \\
    --logfile=${BACKEND}/logs/celery_worker.log \\
    --pidfile=/run/edubest/celery_worker.pid \\
    --detach

ExecStop=/bin/kill -s TERM \$MAINPID
ExecReload=/bin/kill -s HUP \$MAINPID

RuntimeDirectory=edubest
RuntimeDirectoryMode=0755

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# ── Celery Beat ───────────────────────────────────────────────
cat > /etc/systemd/system/edubest-celerybeat.service <<EOF
[Unit]
Description=EDU BEST Celery Beat Scheduler
After=network.target redis.service
Requires=redis.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${BACKEND}
Environment="PATH=${VENV}/bin"
EnvironmentFile=${BACKEND}/.env

ExecStart=${VENV}/bin/celery -A config beat \\
    --loglevel=info \\
    --scheduler django_celery_beat.schedulers:DatabaseScheduler \\
    --logfile=${BACKEND}/logs/celery_beat.log \\
    --pidfile=/run/edubest/celery_beat.pid

RuntimeDirectory=edubest
RuntimeDirectoryMode=0755

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# ── Активация ─────────────────────────────────────────────────
systemctl daemon-reload

for svc in edubest-gunicorn edubest-celery edubest-celerybeat; do
    systemctl enable "${svc}"
    systemctl restart "${svc}"
    sleep 2
    systemctl is-active --quiet "${svc}" \
        && echo "  ✅ ${svc} работает" \
        || echo "  ❌ ${svc} не запустился — проверь: journalctl -u ${svc} -n 30"
done
