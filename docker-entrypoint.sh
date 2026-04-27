#!/bin/sh
set -eu

: "${PORT:=8080}"

# Render nginx config with the runtime Cloud Run PORT.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/sites-enabled/default

cd /app
python scripts/bootstrap.py

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/app.conf
