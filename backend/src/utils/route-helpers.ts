import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

type ServiceMethod = (dateRange?: { startDate: string; endDate: string }) => Promise<unknown>;

export const createAnalyticsHandler = (
    serviceMethod: ServiceMethod,
    logMessage: string
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;

            const dateRange = startDate && endDate
                ? { startDate: startDate as string, endDate: endDate as string }
                : undefined;

            const data = await serviceMethod(dateRange);

            res.json({
                success: true,
                data,
            });
        } catch (error) {
            logger.error(logMessage, { error });
            next(error);
        }
    };
};
