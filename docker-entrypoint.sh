#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BOOTSTRAP_RETRIES:=3}"
: "${BOOTSTRAP_RETRY_DELAY_SECONDS:=2}"
: "${RUN_BOOTSTRAP:=auto}"
: "${BOOTSTRAP_STRICT:=false}"

is_truthy() {
  value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "$value" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

run_bootstrap="$RUN_BOOTSTRAP"
if [ "$RUN_BOOTSTRAP" = "auto" ]; then
  if [ -n "${K_SERVICE:-}" ]; then
    # Cloud Run: avoid blocking container startup on one-off bootstrap tasks.
    run_bootstrap="false"
  else
    run_bootstrap="true"
  fi
fi

# Clean up any existing default configs to prevent conflicts
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/conf.d/default.conf

# Render nginx config with the runtime Cloud Run PORT.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

cd /app

if is_truthy "$run_bootstrap"; then
  attempt=1
  bootstrap_succeeded=false
  while [ "$attempt" -le "$BOOTSTRAP_RETRIES" ]; do
    echo "[entrypoint] Bootstrap attempt ${attempt}/${BOOTSTRAP_RETRIES}"
    if python scripts/bootstrap.py; then
      echo "[entrypoint] Bootstrap completed."
      bootstrap_succeeded=true
      break
    fi

    if [ "$attempt" -lt "$BOOTSTRAP_RETRIES" ]; then
      echo "[entrypoint] Bootstrap failed. Retrying in ${BOOTSTRAP_RETRY_DELAY_SECONDS}s..."
      sleep "$BOOTSTRAP_RETRY_DELAY_SECONDS"
    fi
    attempt=$((attempt + 1))
  done

  if [ "$bootstrap_succeeded" != "true" ]; then
    if is_truthy "$BOOTSTRAP_STRICT"; then
      echo "[entrypoint] Bootstrap failed after ${BOOTSTRAP_RETRIES} attempts; exiting because BOOTSTRAP_STRICT=true."
      exit 1
    fi
    echo "[entrypoint] Bootstrap failed after ${BOOTSTRAP_RETRIES} attempts; continuing startup because BOOTSTRAP_STRICT=false."
  fi
else
  echo "[entrypoint] Bootstrap skipped (RUN_BOOTSTRAP=${RUN_BOOTSTRAP}, effective=${run_bootstrap})."
fi

echo "[entrypoint] Listing files in /app:"
ls -R /app

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/app.conf
