
import { Router, Request, Response, NextFunction } from 'express';
import mapService from '@/services/map.service';
import { authenticate, authorizeMinimumRole } from '@/middleware/auth';
import logger from '@/utils/logger';

const router = Router();

/**
 * GET /maps/:id
 * Retrieve map data (Derived from sites)
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id!;
    const map = await mapService.getMapById(id);
    
    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /maps/:id/save
 * Update site positions from map modules
 */
router.post('/:id/save', authenticate, authorizeMinimumRole('STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id!;
    const payload = await mapService.saveMap(id, req.body);

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
