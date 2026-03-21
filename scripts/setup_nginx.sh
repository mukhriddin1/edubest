#!/bin/bash
# Настраивает Nginx: статика, проксирование gunicorn через Unix socket
set -euo pipefail

APP_USER="${1:-edubest}"
APP_DIR="${2:-/var/www/edubest}"
DOMAIN="${3:-yourdomain.com}"

# ── Глобальный nginx.conf ─────────────────────────────────────
cat > /etc/nginx/nginx.conf <<'NGINXCONF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    server_tokens off;
    client_max_body_size 10M;

    # Logging
    log_format main '$remote_addr - [$time_local] "$request" $status $body_bytes_sent rt=$request_time';
    access_log /var/log/nginx/access.log main;
    error_log  /var/log/nginx/error.log warn;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 256;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m    rate=30r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m   rate=10r/m;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINXCONF

# ── Виртуальный хост ─────────────────────────────────────────
cat > /etc/nginx/sites-available/edubest <<VHOST
# HTTP → редирект на HTTPS (после certbot это заменится)
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Для certbot (ACME challenge)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        # После получения SSL закомментируй строку ниже и раскомментируй redirect
        # return 301 https://\$host\$request_uri;

        # Временно работаем по HTTP:
        include /etc/nginx/sites-available/edubest-upstream;
    }
}
VHOST

# Содержимое upstream вынесено отдельно, чтобы не дублировать
cat > /etc/nginx/sites-available/edubest-upstream <<UPSTREAM
    # ── Frontend SPA ───────────────────────────────────────────
    root ${APP_DIR}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Кэш статических ассетов Vite (хэши в именах)
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ── Django API ─────────────────────────────────────────────
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        limit_conn addr 20;

        proxy_pass http://unix:/run/edubest/gunicorn.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 8 16k;
    }

    # Строгий лимит на авторизацию
    location ~* ^/api/v1/auth/(login|register|password) {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://unix:/run/edubest/gunicorn.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ── Django статика и медиа ─────────────────────────────────
    location /static/ {
        alias ${APP_DIR}/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    location /media/ {
        alias ${APP_DIR}/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Django admin (можно ограничить по IP)
    location /admin/ {
        # allow YOUR_IP;
        # deny all;
        proxy_pass http://unix:/run/edubest/gunicorn.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
UPSTREAM

# Активируем сайт
ln -sf /etc/nginx/sites-available/edubest /etc/nginx/sites-enabled/edubest
rm -f /etc/nginx/sites-enabled/default

# Проверка и перезапуск
nginx -t && systemctl reload nginx
echo "  ✅ Nginx настроен"

echo ""
echo "  ━━━ Следующий шаг: получи SSL ━━━"
echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
