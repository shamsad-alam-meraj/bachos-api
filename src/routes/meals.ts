/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal management endpoints
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { MealController } from '../controllers/MealController';

const router = express.Router();

/**
 * @swagger
 * /api/meals:
 *   post:
 *     summary: Create meal - Only managers can create meals
 *     tags: [Meals]
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
 *               - date
 *             properties:
 *               messId:
 *                 type: string
 *                 description: Mess ID
 *               userId:
 *                 type: string
 *                 description: User ID
 *               breakfast:
 *                 type: number
 *                 default: 0
 *               lunch:
 *                 type: number
 *                 default: 0
 *               dinner:
 *                 type: number
 *                 default: 0
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [taken, skipped, guest, offday]
 *                 default: taken
 *               isGuest:
 *                 type: boolean
 *                 default: false
 *               guestName:
 *                 type: string
 *               mealType:
 *                 type: string
 *                 enum: [regular, offday, holiday]
 *                 default: regular
 *               preferences:
 *                 type: object
 *                 properties:
 *                   vegetarian:
 *                     type: boolean
 *                   spicy:
 *                     type: boolean
 *                   notes:
 *                     type: string
 *     responses:
 *       201:
 *         description: Meal created
 */
router.post('/', authMiddleware, MealController.createMeal);

/**
 * @swagger
 * /api/meals/bulk:
 *   post:
 *     summary: Bulk create meals - Only managers can create meals
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - messId
 *                 - userId
 *                 - date
 *               properties:
 *                 messId:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 breakfast:
 *                   type: number
 *                 lunch:
 *                   type: number
 *                 dinner:
 *                   type: number
 *                 date:
 *                   type: string
 *                   format: date
 *                 status:
 *                   type: string
 *                   enum: [taken, skipped, guest, offday]
 *                 isGuest:
 *                   type: boolean
 *                 guestName:
 *                   type: string
 *                 mealType:
 *                   type: string
 *                   enum: [regular, offday, holiday]
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     vegetarian:
 *                       type: boolean
 *                     spicy:
 *                       type: boolean
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Meals created
 */
router.post('/bulk', authMiddleware, MealController.bulkCreateMeals);

/**
 * @swagger
 * /api/meals/stats/{messId}:
 *   get:
 *     summary: Get meal statistics
 *     tags: [Meals]
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
 *         description: Meal statistics
 */
router.get('/stats/:messId', authMiddleware, MealController.getMealStatistics);

/**
 * @swagger
 * /api/meals/calculate-costs/{messId}:
 *   post:
 *     summary: Calculate meal costs
 *     tags: [Meals]
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Meal costs calculated
 */
router.post('/calculate-costs/:messId', authMiddleware, MealController.calculateMealCosts);

/**
 * @swagger
 * /api/meals/summary/{messId}/{userId}:
 *   get:
 *     summary: Get user meal summary
 *     tags: [Meals]
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
 *     responses:
 *       200:
 *         description: User meal summary
 */
router.get('/summary/:messId/:userId', authMiddleware, MealController.getUserMealSummary);

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Get meals with flexible filtering
 *     tags: [Meals]
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
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: List of meals
 */
router.get('/', authMiddleware, MealController.getAllMeals);

/**
 * @swagger
 * /api/meals/mess/{messId}:
 *   get:
 *     summary: Get meals with flexible filtering (by mess)
 *     tags: [Meals]
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
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: List of meals for the mess
 */
router.get('/mess/:messId', authMiddleware, MealController.getMeals);

/**
 * @swagger
 * /api/meals/{mealId}:
 *   put:
 *     summary: Update meal - Only managers can update meals
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               breakfast:
 *                 type: number
 *               lunch:
 *                 type: number
 *               dinner:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [taken, skipped, guest, offday]
 *               isGuest:
 *                 type: boolean
 *               guestName:
 *                 type: string
 *               mealType:
 *                 type: string
 *                 enum: [regular, offday, holiday]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   vegetarian:
 *                     type: boolean
 *                   spicy:
 *                     type: boolean
 *                   notes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Meal updated
 */
router.put('/:mealId', authMiddleware, MealController.updateMeal);

/**
 * @swagger
 * /api/meals/{mealId}:
 *   delete:
 *     summary: Delete meal - Only managers can delete meals
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Meal deleted
 */
router.delete('/:mealId', authMiddleware, MealController.deleteMeal);

export default router;
