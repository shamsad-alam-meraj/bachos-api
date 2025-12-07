/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered features and recommendations
 */

import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/ai/market-schedule:
 *   post:
 *     summary: Generate market schedule for rest days
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messId
 *               - restDays
 *             properties:
 *               messId:
 *                 type: string
 *                 description: Mess ID
 *               restDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *                 description: List of rest days
 *               preferences:
 *                 type: object
 *                 description: Additional preferences for scheduling
 *     responses:
 *       200:
 *         description: Generated market schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: AI-generated market schedule
 */
router.post('/market-schedule', AIController.generateMarketSchedule);

/**
 * @swagger
 * /api/ai/meal-plan:
 *   post:
 *     summary: Generate meal plan
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messId
 *             properties:
 *               messId:
 *                 type: string
 *                 description: Mess ID
 *               duration:
 *                 type: integer
 *                 default: 7
 *                 description: Plan duration in days
 *               preferences:
 *                 type: object
 *                 properties:
 *                   vegetarian:
 *                     type: boolean
 *                     description: Prefer vegetarian meals
 *                   budget:
 *                     type: number
 *                     description: Budget constraint
 *                   dietaryRestrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Dietary restrictions
 *                 description: Meal plan preferences
 *     responses:
 *       200:
 *         description: Generated meal plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: AI-generated meal plan
 */
router.post('/meal-plan', AIController.generateMealPlan);

export default router;
