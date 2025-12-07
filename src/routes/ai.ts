import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

// Generate market schedule for rest days
router.post('/market-schedule', AIController.generateMarketSchedule);

// Generate meal plan
router.post('/meal-plan', AIController.generateMealPlan);

export default router;
