import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { ExpenseController } from '../controllers/ExpenseController';

const router = express.Router();

// Create expense - Only managers can create expenses
router.post('/', authMiddleware, ExpenseController.createExpense);

// Get expenses with flexible filtering
router.get('/mess/:messId', authMiddleware, ExpenseController.getExpenses);

// Update expense - Only managers can update expenses
router.put('/:expenseId', authMiddleware, ExpenseController.updateExpense);

// Delete expense - Only managers can delete expenses
router.delete('/:expenseId', authMiddleware, ExpenseController.deleteExpense);

export default router;
