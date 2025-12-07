/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data endpoints
 */

import express from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/{messId}:
 *   get:
 *     summary: Get comprehensive dashboard data for a mess
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mess ID
 *     responses:
 *       200:
 *         description: Comprehensive dashboard data
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
 *                   description: Dashboard data including summary stats, recent activities, charts data, etc.
 */
router.get('/:messId', authMiddleware, DashboardController.getDashboard);

export default router;
