# Frontend Production Dockerfile
# just in case for docker build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci

# Copy shared package and build
COPY shared/ ./shared/
WORKDIR /app/shared
RUN npm ci && npm run build

# Copy frontend source and build
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm ci && npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built app to nginx
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create non-root user (nginx group already exists in nginx:alpine)
RUN adduser -S -D -H -u 1001 -s /sbin/nologin appuser

# Change ownership
RUN chown -R appuser:root /usr/share/nginx/html && \
    chown -R appuser:root /var/cache/nginx && \
    chown -R appuser:root /var/log/nginx && \
    mkdir -p /var/run/nginx && \
    chown -R appuser:root /var/run/nginx && \
    chmod -R g+w /var/cache/nginx /var/log/nginx /var/run/nginx

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
