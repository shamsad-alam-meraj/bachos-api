/**
 * @swagger
 * tags:
 *   name: Deposits
 *   description: Deposit management endpoints
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { DepositController } from '../controllers/DepositController';

const router = express.Router();

/**
 * @swagger
 * /api/deposits:
 *   post:
 *     summary: Create a new deposit - Only managers can create deposits
 *     tags: [Deposits]
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
 *               - userId
 *               - amount
 *               - date
 *             properties:
 *               messId:
 *                 type: string
 *                 description: Mess ID
 *               userId:
 *                 type: string
 *                 description: User ID
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 description: Deposit amount
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Deposit date
 *               description:
 *                 type: string
 *                 description: Deposit description
 *     responses:
 *       201:
 *         description: Deposit created
 */
router.post('/', authMiddleware, DepositController.createDeposit);

/**
 * @swagger
 * /api/deposits:
 *   get:
 *     summary: Get deposits with flexible filtering
 *     tags: [Deposits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: messId
 *         schema:
 *           type: string
 *         description: Filter by mess ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: List of deposits
 */
router.get('/', authMiddleware, DepositController.getAllDeposits);

/**
 * @swagger
 * /api/deposits/mess/{messId}:
 *   get:
 *     summary: Get all deposits for a mess with filtering
 *     tags: [Deposits]
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
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: List of deposits for the mess
 */
router.get('/mess/:messId', authMiddleware, DepositController.getDeposits);

/**
 * @swagger
 * /api/deposits/mess/{messId}/user/{userId}:
 *   get:
 *     summary: Get deposits for a specific user in a mess
 *     tags: [Deposits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mess ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: User's deposits
 */
router.get('/mess/:messId/user/:userId', authMiddleware, DepositController.getUserDeposits);

/**
 * @swagger
 * /api/deposits/mess/{messId}/stats:
 *   get:
 *     summary: Get deposit statistics for a mess
 *     tags: [Deposits]
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
 *         description: Deposit statistics
 */
router.get('/mess/:messId/stats', authMiddleware, DepositController.getDepositStats);

/**
 * @swagger
 * /api/deposits/{depositId}:
 *   put:
 *     summary: Update a deposit - Only managers can update deposits
 *     tags: [Deposits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: depositId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deposit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deposit updated
 */
router.put('/:depositId', authMiddleware, DepositController.updateDeposit);

/**
 * @swagger
 * /api/deposits/{depositId}:
 *   delete:
 *     summary: Delete a deposit (manager only)
 *     tags: [Deposits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: depositId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deposit ID
 *     responses:
 *       200:
 *         description: Deposit deleted
 */
router.delete('/:depositId', authMiddleware, DepositController.deleteDeposit);

export default router;
