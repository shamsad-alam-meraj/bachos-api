/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management endpoints
 */

import express from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create expense - Only managers can create expenses
 *     tags: [Expenses]
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
 *               - description
 *               - amount
 *               - addedBy
 *               - expensedBy
 *             properties:
 *               messId:
 *                 type: string
 *                 description: Mess ID
 *               description:
 *                 type: string
 *                 description: Expense description
 *               amount:
 *                 type: number
 *                 description: Expense amount
 *               category:
 *                 type: string
 *                 enum: [food, utilities, maintenance, other]
 *                 default: food
 *                 description: Expense category
 *               addedBy:
 *                 type: string
 *                 description: User ID who added the expense
 *               expensedBy:
 *                 type: string
 *                 description: User ID who made the expense
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Expense date
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post('/', authMiddleware, ExpenseController.createExpense);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get expenses with flexible filtering
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: messId
 *         schema:
 *           type: string
 *         description: Filter by mess ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [food, utilities, maintenance, other]
 *         description: Filter by category
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
 *         description: List of expenses
 */
router.get('/', authMiddleware, ExpenseController.getAllExpenses);

/**
 * @swagger
 * /api/expenses/mess/{messId}:
 *   get:
 *     summary: Get expenses with flexible filtering (by mess)
 *     tags: [Expenses]
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [food, utilities, maintenance, other]
 *         description: Filter by category
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
 *         description: List of expenses for the mess
 */
router.get('/mess/:messId', authMiddleware, ExpenseController.getExpenses);

/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   put:
 *     summary: Update expense - Only managers can update expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [food, utilities, maintenance, other]
 *               expensedBy:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Expense updated
 */
router.put('/:expenseId', authMiddleware, ExpenseController.updateExpense);

/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   delete:
 *     summary: Delete expense - Only managers can delete expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/:expenseId', authMiddleware, ExpenseController.deleteExpense);

export default router;
