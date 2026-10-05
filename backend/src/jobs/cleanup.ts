/**
 * Cleanup Jobs
 * Scheduled tasks for maintenance and housekeeping
 */

import cron, { ScheduledTask } from 'node-cron';
import { getPrismaClient } from '@/database';
import logger from '@/utils/logger';
import bookingService from '@/services/booking.service';
import { publishBookingEvent, BOOKING_EVENTS } from '@/socket/booking-events';

// Store active cron jobs for graceful shutdown
const activeTasks: ScheduledTask[] = [];

/**
 * Clean up expired user sessions
 * Runs daily at 2 AM (server timezone)
 */
function scheduleSessionCleanup(): void {
    const task = cron.schedule('0 2 * * *', async () => {
        try {
            const prisma = getPrismaClient();

            const deleted = await prisma.userSession.deleteMany({
                where: {
                    expiresAt: { lt: new Date() }
                }
            });

            logger.info('Session cleanup completed', {
                deletedCount: deleted.count,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            // Log error but don't crash the server
            logger.error('Session cleanup failed', { error });
        }
    });

    activeTasks.push(task);
    logger.info('Session cleanup job scheduled (daily at 2 AM)');
}

/**
 * Cancel unpaid PENDING bookings once their hold window has passed.
 * Runs every minute so a hold lasts at most the configured window plus a minute.
 */
export async function expireUnpaidBookingsNow(): Promise<number> {
    const cancelled = await bookingService.expireUnpaidBookings();

    // Same event the cancel route publishes, so open booking calendars drop the entry
    for (const booking of cancelled) {
        publishBookingEvent(BOOKING_EVENTS.cancelled, booking);
    }

    return cancelled.length;
}

function scheduleBookingExpiry(): void {
    let running = false; // don't stack runs if one is slow

    const task = cron.schedule('* * * * *', async () => {
        if (running) return;
        running = true;
        try {
            await expireUnpaidBookingsNow();
        } catch (error) {
            logger.error('Booking expiry failed', { error });
        } finally {
            running = false;
        }
    });

    activeTasks.push(task);
    logger.info('Booking expiry job scheduled (every minute)');
}

/**
 * Start all cleanup jobs
 */
export function startCleanupJobs(): void {
    scheduleSessionCleanup();
    scheduleBookingExpiry();
    logger.info('All cleanup jobs started');
}

/**
 * Stop all cleanup jobs (for graceful shutdown)
 */
export function stopCleanupJobs(): void {
    activeTasks.forEach(task => task.stop());
    logger.info('All cleanup jobs stopped');
}

/**
 * Manually trigger session cleanup (for testing)
 */
export async function runSessionCleanupNow(): Promise<number> {
    try {
        const prisma = getPrismaClient();

        const deleted = await prisma.userSession.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });

        logger.info('Manual session cleanup completed', {
            deletedCount: deleted.count
        });

        return deleted.count;
    } catch (error) {
        logger.error('Manual session cleanup failed', { error });
        throw error;
    }
}
