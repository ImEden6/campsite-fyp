// Database Connection and Prisma Client Setup

import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Prisma Client instance
let prisma: PrismaClient;

// Initialize Prisma Client
const initializePrisma = (): PrismaClient => {
  if (!prisma) {
    // Use default Prisma client (no adapter needed for Prisma 6.x)
    prisma = new PrismaClient({
      log: config.server.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    const cleanup = async (reason: string) => {
      logger.info(`Cleaning up database connections... (${reason})`);
      try {
        if (prisma) await prisma.$disconnect();
        logger.info('Database cleanup finished.');
      } catch (err) {
        logger.error('Error during database cleanup', err);
      }
    };

    // Handle process termination
    process.on('beforeExit', () => cleanup('beforeExit'));

    process.on('SIGINT', async () => {
      await cleanup('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await cleanup('SIGTERM');
      process.exit(0);
    });
  }

  return prisma;
};

// Get Prisma client instance
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    return initializePrisma();
  }
  return prisma;
};

// Database connection helper
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

// Database disconnection helper
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Database disconnected successfully');
    }
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Database transaction helper
export async function transaction<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const client = getPrismaClient();
   
  return (client as any).$transaction(callback);
}

// Database metrics
export const getDatabaseMetrics = async () => {
  const client = getPrismaClient();

  try {
    const [
      userCount,
      bookingCount,
      siteCount,
      equipmentCount,
      paymentCount,
    ] = await Promise.all([
      client.user.count(),
      client.booking.count(),
      client.site.count(),
      client.equipment.count(),
      client.payment.count(),
    ]);

    return {
      users: userCount,
      bookings: bookingCount,
      sites: siteCount,
      equipment: equipmentCount,
      payments: paymentCount,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('Failed to get database metrics:', error);
    throw error;
  }
};

// Database seed check
export const isDatabaseSeeded = async (): Promise<boolean> => {
  try {
    const client = getPrismaClient();
    const adminUser = await client.user.findFirst({
      where: { role: 'ADMIN' },
    });
    return !!adminUser;
  } catch (error) {
    logger.error('Failed to check database seed status:', error);
    return false;
  }
};

// Export the default client
export default getPrismaClient();
