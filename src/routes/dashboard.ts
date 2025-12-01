import express from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get comprehensive dashboard data
router.get('/:messId', authMiddleware, DashboardController.getDashboard);

export default router;
