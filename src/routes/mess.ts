import express, { type Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

const router = express.Router();

// Admin-only email domains or specific emails
const ADMIN_EMAILS = ['admin@bachos.com'];
const ADMIN_DOMAINS = ['@admin.'];

const isAdminEmail = (email: string): boolean => {
  return (
    ADMIN_EMAILS.includes(email.toLowerCase()) ||
    ADMIN_DOMAINS.some((domain) => email.toLowerCase().includes(domain))
  );
};

// Calculate dynamic meal rate based on expenses and meals
const calculateMealRate = async (messId: string): Promise<number> => {
  try {
    // Get current month's expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Get current month's total meals
    const totalMeals = await Meal.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $add: ['$breakfast', '$lunch', '$dinner'] },
          },
        },
      },
    ]);

    const expenses = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
    const meals = totalMeals.length > 0 ? totalMeals[0].total : 0;

    // Calculate meal rate (default to 50 if no meals)
    const rate = expenses / meals;
    const mealRate = parseFloat(Number(rate).toFixed(2)); // Convert back to number

    return mealRate;
  } catch (error) {
    console.error('Error calculating meal rate:', error);
    return 50; // Default fallback
  }
};

router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can create messes. Please ask an existing mess manager to add you.',
      });
    }

    const { name, description, address, managerId } = req.body;

    // Verify manager exists
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ error: 'Selected manager not found' });
    }

    const mess = new Mess({
      name,
      description,
      address,
      managerId: managerId,
      members: [managerId],
      mealRate: 50, // Initial default rate
    });

    await mess.save();

    // Update manager's messId
    await User.findByIdAndUpdate(managerId, { messId: mess._id });

    res.json(mess);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const mess = await Mess.findById(req.params.messId)
      .populate('managerId', 'name email')
      .populate('members', 'name email phone');

    if (mess) {
      // Calculate current meal rate
      const currentMealRate = await calculateMealRate(mess._id.toString());
      mess.mealRate = currentMealRate;
      await mess.save();
    }

    res.json(mess);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// API to get current meal rate
router.get('/:messId/meal-rate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const mealRate = await calculateMealRate(req.params.messId);
    res.json({ mealRate });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:messId/add-member', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    // Check if current user is the manager of this mess
    const mess = await Mess.findById(req.params.messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    if (mess.managerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only mess manager can add members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.messId) {
      return res.status(400).json({ error: 'User is already in a mess' });
    }

    // Add user to mess
    await Mess.findByIdAndUpdate(
      req.params.messId,
      { $addToSet: { members: user._id } },
      { new: true }
    );

    await User.findByIdAndUpdate(user._id, { messId: req.params.messId });

    const updatedMess = await Mess.findById(req.params.messId)
      .populate('managerId', 'name email')
      .populate('members', 'name email phone');

    res.json(updatedMess);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
