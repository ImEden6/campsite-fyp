# Backend Production/Development Dockerfile

# Development stage
FROM node:22-slim AS development
WORKDIR /app

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy all package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/
# Install all dependencies
RUN npm install

# Copy sources
COPY shared/ ./shared/
COPY backend/ ./backend/

# Generate Prisma Client
RUN npm run db:generate -w @campsite-management/backend

# Expose port
EXPOSE 5000

# Command to run in development
CMD ["npm", "run", "dev", "-w", "@campsite-management/backend"]

FROM node:22-slim AS builder

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/
# Install all dependencies
RUN npm install

# Copy sources for built packages
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build
RUN npm run db:generate -w @campsite-management/backend && \
  npm run build -w @campsite-management/shared && \
  npm run build -w @campsite-management/backend

# Production stage
FROM node:22-slim AS production

# Create app directory
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/
# Install production dependencies
RUN npm install --omit=dev --ignore-scripts

# Copy built applications
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Create non-root user
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home backend

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
