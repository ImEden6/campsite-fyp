// Load environment variables before anything reads them (config is read at import time)
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

import { config, validateConfig } from './config';
import { getAllowedOrigins } from './config/origins';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './database';
import { errorHandler } from './utils/errors';
import { generalRateLimit } from './middleware/security';
import {
  initializeErrorTracking,
  hasExpressHandlers,
  flushErrorTracker,
} from './services/error-tracking';
import cacheService from './services/cache.service';
import socketService from './services/socket.service';
import { startCleanupJobs, stopCleanupJobs } from './jobs/cleanup';
import { createSocketServer } from './socket/server';
import { createShutdown } from './shutdown';

import authRoutes from './routes/auth.routes';
import campsiteRoutes from './routes/site.routes';
import bookingRoutes from './routes/booking.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import apiKeyRoutes from './routes/api-key.routes';
import equipmentRoutes from './routes/equipment.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import mapRoutes from './routes/map.routes';
import publicRoutes from './routes/public.routes';

const errorTracker = initializeErrorTracking();

const app = express();
const server = createServer(app);
const io = createSocketServer(server);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
// General rate limit for all routes. Stricter limits sit on specific routes
// (login/register, payment intents, booking creation); see middleware/security.ts.
app.use(generalRateLimit);
app.use(express.json({
  limit: '10mb',
  // Keep the raw bytes: Stripe webhook signatures are verified against them
  verify: (req, _res, buf) => {
    (req as typeof req & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(config.upload.staticPath, express.static(config.upload.path));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/campsites', campsiteRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/admin/api-keys', apiKeyRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/maps', mapRoutes);
app.use('/api/v1/public', publicRoutes);

app.use('*', (_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Error handling. Order matters: report to the error tracker first, then answer the client.
if (hasExpressHandlers(errorTracker)) {
  app.use(errorTracker.getErrorHandler());
}
app.use(errorHandler);

// Real-time updates
socketService.initialize(io);

io.on('connection', (socket) => {
  const { user } = socket.data as { user: { id: string; role: string } };
  logger.info(`Client connected: ${socket.id}`, { userId: user.id, role: user.role });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`, { userId: user.id });
  });
});

// Graceful shutdown: stop taking work, close connections, flush, then release resources.
const shutdown = createShutdown({
  steps: [
    { name: 'background jobs', run: () => stopCleanupJobs() },
    { name: 'http and socket server', run: () => io.close() }, // also closes the HTTP server
    { name: 'error tracker', run: () => flushErrorTracker(errorTracker) },
    { name: 'cache', run: () => cacheService.disconnect() },
    { name: 'database', run: () => disconnectDatabase() },
  ],
});

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  void shutdown('uncaughtException', 1);
});
// A rejected promise nobody handled is a bug, but not worth taking the whole server down for
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    validateConfig();
    await connectDatabase();
    startCleanupJobs();

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
