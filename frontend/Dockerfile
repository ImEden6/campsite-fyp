# Frontend Production/Development Dockerfile
# Optimized for minimal image size with multi-stage builds and layer caching

# =============================================================================
# Stage 0: Development - Hot reloading
# =============================================================================
FROM node:22-alpine AS development
WORKDIR /app/frontend
# Note: In a workspace, we might need the root context, but user requested specific structure.
# User's request: "FROM node:18-alpine AS development ... COPY package*.json ./ ... RUN npm install"
# Adapting to monorepo structure while keeping user's intent for dev stage.
# We need to run from root to respect workspaces or adjust accordingly.
# Assuming we run from root context in docker-compose, we should set WORKDIR to /app first.

WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
RUN npm ci

# Copy sources provided by volumes in dev, but for the image itself:
COPY shared/ ./shared/
COPY frontend/ ./frontend/

EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "@campsite-management/frontend", "--", "--host", "0.0.0.0"]


# =============================================================================
# Stage 1: Dependencies - Cached layer for npm packages
# =============================================================================

FROM node:22-alpine AS deps

# Set working directory
WORKDIR /app

# Copy all package files to support workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
# Install dependencies directly to ensure correctness
# Attempt to force install the native binary for Alpine/musl as requested
RUN npm ci && npm install lightningcss-linux-x64-musl --save-optional

# =============================================================================
# Stage 2: Builder - Compile the application
# =============================================================================
FROM deps AS builder

WORKDIR /app

# Copy source files for built packages
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared first, then frontend using workspace commands
# We use the specific package names defined in their package.json files
RUN npm run build -w @campsite-management/frontend && \
  # Remove source files and dev dependencies after build
  rm -rf shared/src frontend/src && \
  rm -rf node_modules/.cache

# =============================================================================
# Stage 3: Production - Minimal nginx image
# =============================================================================
FROM nginx:alpine-slim AS production

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

# Copy frontend-specific nginx configuration (serves static files with SPA fallback)
COPY docker/frontend.nginx.conf /etc/nginx/nginx.conf

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
