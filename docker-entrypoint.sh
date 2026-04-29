#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BOOTSTRAP_RETRIES:=3}"
: "${BOOTSTRAP_RETRY_DELAY_SECONDS:=2}"
: "${RUN_BOOTSTRAP:=true}"

# Render nginx config with the runtime Cloud Run PORT.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/sites-enabled/default

cd /app

if [ "${RUN_BOOTSTRAP}" = "true" ]; then
  attempt=1
  while [ "$attempt" -le "$BOOTSTRAP_RETRIES" ]; do
    echo "[entrypoint] Bootstrap attempt ${attempt}/${BOOTSTRAP_RETRIES}"
    if python scripts/bootstrap.py; then
      echo "[entrypoint] Bootstrap completed."
      break
    fi

    if [ "$attempt" -eq "$BOOTSTRAP_RETRIES" ]; then
      echo "[entrypoint] Bootstrap failed after ${BOOTSTRAP_RETRIES} attempts."
      exit 1
    fi

    echo "[entrypoint] Bootstrap failed. Retrying in ${BOOTSTRAP_RETRY_DELAY_SECONDS}s..."
    sleep "$BOOTSTRAP_RETRY_DELAY_SECONDS"
    attempt=$((attempt + 1))
  done
else
  echo "[entrypoint] Bootstrap skipped (RUN_BOOTSTRAP=false)."
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/app.conf
