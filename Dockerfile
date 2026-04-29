# ─────────────────────────────────────────────────────────
# Stage 1 – Build the Next.js static frontend
# ─────────────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

# Build-time arguments for Firebase and API configuration
# NEXT_PUBLIC_API_URL is intentionally empty by default so the browser
# uses relative URLs (/api/...), which nginx proxies to FastAPI.
ARG NEXT_PUBLIC_FIREBASE_API_KEY=""
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
ARG NEXT_PUBLIC_FIREBASE_APP_ID=""
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""

# Set them as ENV so Next.js picks them up during build
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
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
CMD ["/bin/sh", "/usr/local/bin/docker-entrypoint.sh"]
