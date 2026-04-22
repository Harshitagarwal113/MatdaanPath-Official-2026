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
    apt-get install -y --no-install-recommends nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

# ── FastAPI backend ──────────────────────────────────────
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# ── Frontend static files ────────────────────────────────
COPY --from=frontend-builder /frontend/out /usr/share/nginx/html

# ── Config files ─────────────────────────────────────────
# Replace the default nginx site with our unified config
COPY nginx.conf /etc/nginx/sites-enabled/default
RUN rm -f /etc/nginx/sites-enabled/default.conf

COPY supervisord.conf /etc/supervisor/conf.d/app.conf

# Cloud Run uses PORT env (default 8080); nginx listens on 8080
EXPOSE 8080

# Start both nginx and uvicorn via supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/app.conf"]
