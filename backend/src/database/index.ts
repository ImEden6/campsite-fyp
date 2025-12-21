// Database Connection and Prisma Client Setup

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Prisma Client instance & DB Pool
let prisma: PrismaClient;
let pool: Pool;

// Initialize Prisma Client
const initializePrisma = (): PrismaClient => {
  if (!prisma) {
    // 1. Create a `pg` Pool
    pool = new Pool({
      connectionString: config.database.url,
      // You can also add more pool options here if needed, e.g.:
      // max: 20,
      // idleTimeoutMillis: 30000,
      // connectionTimeoutMillis: 2000,
    });

    // 2. Create the driver adapter
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to `PrismaClient`
    prisma = new PrismaClient({
      adapter,
      log: config.server.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    const cleanup = async (reason: string) => {
      logger.info(`Cleaning up database connections... (${reason})`);
      try {
        if (prisma) await prisma.$disconnect();
        if (pool) await pool.end();
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
      // Prisma $disconnect should be sufficient, but we also ensure pool is closed in cleanup handlers.
      // Explicitly closing prisma disconnects the adapter.
      await prisma.$disconnect();
      if (pool) await pool.end();
      logger.info('Database disconnected successfully');
    }
  } catch (error) {
    logger.error('Database disconnection failed:', error);
    throw error;
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
export const transaction = async <T>(
  callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> => {
  const client = getPrismaClient();
  return await client.$transaction(callback);
};

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
