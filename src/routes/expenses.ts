import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Expense from '../models/Expense';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, description, amount, category } = req.body;

    const expense = new Expense({
      messId,
      description,
      amount,
      category,
      addedBy: req.userId,
    });

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/mess/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await Expense.find({ messId: req.params.messId })
      .populate('addedBy', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
