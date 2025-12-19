# Frontend Production Dockerfile
# Optimized for minimal image size with multi-stage builds and layer caching

# =============================================================================
# Stage 1: Dependencies - Cached layer for npm packages
# =============================================================================
FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Copy all package files to support workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY tests/package*.json ./tests/

# Install ALL dependencies in a single layer
RUN npm ci

# =============================================================================
# Stage 2: Builder - Compile the application
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
# Note: Root npm ci might hoist everything to root node_modules, checking...

# Copy all package files again for reference
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY tests/package*.json ./tests/

# Copy source files for built packages
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared first, then frontend using workspace commands
# We use the specific package names defined in their package.json files
RUN npm run build -w @campsite-management/shared && \
  npm run build -w @campsite-management/frontend && \
  # Remove source files and dev dependencies after build
  rm -rf shared/src frontend/src && \
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

# Configure nginx to listen on port 5137
RUN sed -i 's/listen 80;/listen 5137;/' /etc/nginx/nginx.conf

# Copy only the built static files from builder stage
COPY --from=builder --chown=appuser:root /app/frontend/dist /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5137

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5137/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
