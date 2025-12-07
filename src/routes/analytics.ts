/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting endpoints
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/{messId}:
 *   get:
 *     summary: Get comprehensive analytics data for a mess
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mess ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Comprehensive analytics data
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
 *                   description: Analytics data including meal stats, expense stats, deposit stats, etc.
 */
router.get('/:messId', authMiddleware, AnalyticsController.getAnalytics);

export default router;
