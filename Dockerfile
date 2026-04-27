# ─────────────────────────────────────────────────────────
# Stage 1 – Build the Next.js static frontend
# NEXT_PUBLIC_API_URL is intentionally empty so the browser
# uses relative URLs (/api/...), which nginx proxies to FastAPI.
# ─────────────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# Build with empty API URL → relative paths (/api/...)
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 2 – Production image (Python + nginx + supervisor)
# ─────────────────────────────────────────────────────────
FROM python:3.11-slim

# Install nginx and supervisor
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor gettext-base && \
    rm -rf /var/lib/apt/lists/*

# ── FastAPI backend ──────────────────────────────────────
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# ── Frontend static files ────────────────────────────────
COPY --from=frontend-builder /frontend/out /usr/share/nginx/html

# ── Config files ─────────────────────────────────────────
# Keep nginx config as a template; resolve PORT at runtime.
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY supervisord.conf /etc/supervisor/conf.d/app.conf
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Cloud Run uses PORT env (default 8080); nginx listens on 8080
EXPOSE 8080

# Render nginx config, run bootstrap once, then start supervisor.
CMD ["/usr/local/bin/docker-entrypoint.sh"]
