import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// Load environment variables
dotenv.config();

// Import configuration and services
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './database';
import { errorHandler } from './utils/errors';
import { authMiddleware } from './middleware/auth';
import { initializeErrorTracking, getErrorTracker } from './services/error-tracking';
import { startCleanupJobs, stopCleanupJobs } from './jobs/cleanup';
import socketService from './services/socket.service';

// Import routes (these will be created later)
import authRoutes from './routes/auth.routes';
import campsiteRoutes from './routes/site.routes';
import bookingRoutes from './routes/booking.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import apiKeyRoutes from './routes/api-key.routes';
import equipmentRoutes from './routes/equipment.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import publicRoutes from './routes/public.routes';

// Initialize error tracking first
const errorTracker = initializeErrorTracking();

import mapRoutes from './routes/map.routes';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Rate limiting - using generalRateLimit from security.ts
// Specific rate limiters are now applied at route level in each route file
import { generalRateLimit } from './middleware/security';

// Sentry request handler
if (errorTracker.isEnabled() && 'getRequestHandler' in errorTracker) {
  app.use((errorTracker as any).getRequestHandler());
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(generalRateLimit); // General rate limit for all routes
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(config.upload.staticPath, express.static(config.upload.path));

// Rate limiting is now applied at route level:
// - authRateLimit on /auth/login and /auth/register
// - registerRateLimit on /auth/register  
// - paymentRateLimit on /payments/intent
// - bookingRateLimit defined in security.ts for booking creation

// Health check route
app.get('/health', (req, res) => {
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

// Socket.io connection handling
socketService.initialize(io);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Add more socket event handlers as needed
});

// Sentry error handler (must be before other error handlers)
// Temporarily disabled due to compilation issues
// if (errorTracker.isEnabled() && 'getErrorHandler' in errorTracker) {
//   app.use((errorTracker as any).getErrorHandler());
// }

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Validate configuration
    validateConfig();

    // Connect to database
    await connectDatabase();

    // Start cleanup jobs
    startCleanupJobs();

    // Start server
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  stopCleanupJobs();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  stopCleanupJobs();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
