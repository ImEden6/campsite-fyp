# Backend Production Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/
COPY tests/package*.json ./tests/

# Install all dependencies
RUN npm ci

# Copy sources for built packages
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build
RUN npm run db:generate -w @campsite-management/backend && \
  npm run build -w @campsite-management/shared && \
  npm run build -w @campsite-management/backend

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/
COPY tests/package*.json ./tests/

# Install production dependencies
RUN npm ci --only=production

# Copy built applications
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
