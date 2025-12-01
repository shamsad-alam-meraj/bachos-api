import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = express.Router();

// Get comprehensive analytics data
router.get('/:messId', authMiddleware, AnalyticsController.getAnalytics);

export default router;
