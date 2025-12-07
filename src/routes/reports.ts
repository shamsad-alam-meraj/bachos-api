/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report generation endpoints
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { ReportController } from '../controllers/ReportController';

const router = express.Router();

/**
 * @swagger
 * /api/reports/{messId}:
 *   get:
 *     summary: Get comprehensive reports data for a mess
 *     tags: [Reports]
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
 *         description: Start date for reports
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for reports
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [meals, expenses, deposits, summary]
 *         description: Report type
 *     responses:
 *       200:
 *         description: Comprehensive reports data
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
 *                   description: Reports data including various report types and summaries
 */
router.get('/:messId', authMiddleware, ReportController.getReports);

export default router;
