import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Expense from '../models/Expense';
import Mess from '../models/Mess';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, description, amount, category, expensedBy, date } = req.body;

    // Verify the mess exists and user has access
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Verify the expensedBy user belongs to the mess
    const expensedUserIsInMess = mess.members.some((member) => member.toString() === expensedBy);
    if (!expensedUserIsInMess) {
      return res.status(403).json({ error: 'Expensed user does not belong to this mess' });
    }

    const expense = new Expense({
      messId,
      description,
      amount,
      category,
      addedBy: req.userId,
      expensedBy,
      date: date ? new Date(date) : new Date(),
    });

    await expense.save();

    // Populate user info in response
    await expense.populate('addedBy', 'name email');
    await expense.populate('expensedBy', 'name email');

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/mess/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await Expense.find({ messId: req.params.messId })
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
