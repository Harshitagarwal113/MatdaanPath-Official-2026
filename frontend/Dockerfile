# Stage 1 – Build the Next.js static export
FROM node:20-slim AS builder

WORKDIR /app

# Accept the backend URL at build time
ARG NEXT_PUBLIC_API_URL=https://matdaanpath-backend-135105451054.asia-south1.run.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 – Serve static files with nginx
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder
COPY --from=builder /app/out /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run sends traffic to PORT env variable (default 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
