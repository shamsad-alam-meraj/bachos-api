/**
 * @swagger
 * tags:
 *   name: Mess
 *   description: Mess management endpoints
 */

import express from 'express';
import { MessController } from '../controllers/MessController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/mess:
 *   post:
 *     summary: Create a new mess
 *     tags: [Mess]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - managerId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Mess name
 *               description:
 *                 type: string
 *                 description: Mess description
 *               address:
 *                 type: string
 *                 description: Mess address
 *               managerId:
 *                 type: string
 *                 description: Manager user ID
 *               mealRate:
 *                 type: number
 *                 default: 50
 *                 description: Meal rate per meal
 *               currency:
 *                 type: string
 *                 default: ৳
 *                 description: Currency symbol
 *     responses:
 *       201:
 *         description: Mess created
 */
router.post('/', authMiddleware, MessController.createMess);

/**
 * @swagger
 * /api/mess/{messId}:
 *   get:
 *     summary: Get mess details
 *     tags: [Mess]
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
 *         description: Mess details
 *       404:
 *         description: Mess not found
 */
router.get('/:messId', authMiddleware, MessController.getMess);

/**
 * @swagger
 * /api/mess/{messId}:
 *   put:
 *     summary: Update mess
 *     tags: [Mess]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mess ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               mealRate:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mess updated
 */
router.put('/:messId', authMiddleware, MessController.updateMess);

/**
 * @swagger
 * /api/mess/{messId}/meal-rate:
 *   get:
 *     summary: Get current meal rate
 *     tags: [Mess]
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
 *         description: Current meal rate
 */
router.get('/:messId/meal-rate', authMiddleware, MessController.getMealRate);

/**
 * @swagger
 * /api/mess/{messId}/members:
 *   post:
 *     summary: Add member to mess
 *     tags: [Mess]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mess ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to add
 *     responses:
 *       200:
 *         description: Member added
 */
router.post('/:messId/members', authMiddleware, MessController.addMember);

/**
 * @swagger
 * /api/mess/{messId}/members/{userId}:
 *   delete:
 *     summary: Remove member from mess
 *     tags: [Mess]
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
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete('/:messId/members/:userId', authMiddleware, MessController.removeMember);

/**
 * @swagger
 * /api/mess:
 *   get:
 *     summary: Get all messes (admin only)
 *     tags: [Mess]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all messes
 */
router.get('/', authMiddleware, MessController.getAllMesses);

/**
 * @swagger
 * /api/mess/{messId}:
 *   delete:
 *     summary: Delete mess
 *     tags: [Mess]
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
 *         description: Mess deleted
 */
router.delete('/:messId', authMiddleware, MessController.deleteMess);

/**
 * @swagger
 * /api/mess/admin/cleanup:
 *   post:
 *     summary: Cleanup mess data (admin only)
 *     tags: [Mess]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data cleaned up
 */
router.post('/admin/cleanup', authMiddleware, MessController.cleanupData);

export default router;
