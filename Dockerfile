# syntax=docker/dockerfile:1.7

# -----------------------------------------------------------------------------
# Stage 1: Build the React / TypeScript application
# Development dependencies stay in this stage and never reach the final image.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile \
    && npm cache clean --force

COPY . .
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Serve the compiled static files with Nginx (Alpine)
# No Node.js runtime, no npm, no development dependencies.
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="STANS" \
      org.opencontainers.image.description="Smart Traffic-Aware Navigation System" \
      org.opencontainers.image.source="https://github.com/Arnold-RG/STANS"

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /tmp/nginx.pid \
    && chown nginx:nginx /tmp/nginx.pid

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/health || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
