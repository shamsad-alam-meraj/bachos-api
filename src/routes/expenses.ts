import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Expense from '../models/Expense';
import Mess from '../models/Mess';

const router = express.Router();

// Create expense - Only managers can create expenses
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, description, amount, category, expensedBy, date } = req.body;

    // Verify the mess exists
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if the user is the manager
    const isManager = mess.managerId.toString() === req.userId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only mess managers can add expenses' });
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

// Get expenses with flexible filtering
router.get('/mess/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, category, userId } = req.query;
    const messId = req.params.messId;

    let dateFilter: any = {};
    let categoryFilter: any = {};
    let userFilter: any = {};

    // Date filter
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    }

    // Category filter
    if (category && category !== 'all') {
      categoryFilter = { category };
    }

    // User filter
    if (userId && userId !== 'all') {
      userFilter = { expensedBy: userId };
    }

    const expenses = await Expense.find({
      messId,
      ...dateFilter,
      ...categoryFilter,
      ...userFilter,
    })
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update expense - Only managers can update expenses
router.put('/:expenseId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { description, amount, category, expensedBy, date } = req.body;
    const expenseId = req.params.expenseId;

    const expense = await Expense.findById(expenseId)
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Get mess to check permissions
    const mess = await Mess.findById(expense.messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === req.userId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only mess managers can edit expenses' });
    }

    // Verify the expensedBy user belongs to the mess
    const expensedUserIsInMess = mess.members.some((member) => member.toString() === expensedBy);
    if (!expensedUserIsInMess) {
      return res.status(403).json({ error: 'Expensed user does not belong to this mess' });
    }

    // Update expense
    expense.description = description;
    expense.amount = amount;
    expense.category = category;
    expense.expensedBy = expensedBy;
    expense.date = new Date(date);

    await expense.save();

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete expense - Only managers can delete expenses
router.delete('/:expenseId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const expenseId = req.params.expenseId;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Get mess to check permissions
    const mess = await Mess.findById(expense.messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === req.userId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only mess managers can delete expenses' });
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
