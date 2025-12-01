import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { ReportController } from '../controllers/ReportController';

const router = express.Router();

// Get comprehensive reports data
router.get('/:messId', authMiddleware, ReportController.getReports);

export default router;
