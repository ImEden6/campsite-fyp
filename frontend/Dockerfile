# Frontend Production Dockerfile
# Optimized for minimal image size with multi-stage builds and layer caching

# =============================================================================
# Stage 1: Dependencies - Cached layer for npm packages
# =============================================================================
FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Copy only package files first (maximizes layer caching)
# These rarely change, so this layer stays cached
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install ALL dependencies in a single layer with cleanup
RUN npm ci --prefer-offline --no-audit --no-fund && \
  cd shared && npm ci --prefer-offline --no-audit --no-fund && \
  cd ../frontend && npm ci --prefer-offline --no-audit --no-fund && \
  # Clean npm cache in same layer to reduce size
  npm cache clean --force && \
  rm -rf /root/.npm /tmp/*

# =============================================================================
# Stage 2: Builder - Compile the application
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage (cached)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Copy package files (needed for scripts)
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Copy source files
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared package first, then frontend in single RUN command
RUN cd shared && npm run build && \
  cd ../frontend && npm run build && \
  # Remove source files and dev dependencies after build
  rm -rf ../shared/src ../frontend/src && \
  rm -rf node_modules/.cache

# =============================================================================
# Stage 3: Production - Minimal nginx image
# =============================================================================
FROM nginx:alpine AS production

# Install curl for healthcheck and clean up in single layer
RUN apk add --no-cache curl && \
  # Create non-root user
  adduser -S -D -H -u 1001 -s /sbin/nologin appuser && \
  # Pre-create directories and set permissions
  mkdir -p /var/run/nginx && \
  chown -R appuser:root /usr/share/nginx/html \
  /var/cache/nginx \
  /var/log/nginx \
  /var/run/nginx && \
  chmod -R g+w /var/cache/nginx /var/log/nginx /var/run/nginx && \
  # Remove unnecessary files to reduce image size
  rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy only the built static files from builder stage
COPY --from=builder --chown=appuser:root /app/frontend/dist /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 36257

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:36257/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
