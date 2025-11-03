import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

const router = express.Router();

// Create meal - Only managers can create meals
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, userId, breakfast, lunch, dinner, date } = req.body;

    // Verify that the user belongs to the mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if the user is the manager
    const isManager = mess.managerId.toString() === req.userId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only mess managers can add meals' });
    }

    // Verify that the target user belongs to the mess
    const targetUserIsInMess = mess.members.some((memberId) => memberId.toString() === userId);
    if (!targetUserIsInMess) {
      return res.status(403).json({ error: 'User does not belong to this mess' });
    }

    const meal = new Meal({
      messId,
      userId,
      breakfast,
      lunch,
      dinner,
      date: new Date(date),
    });

    await meal.save();

    // Populate user info in response
    await meal.populate('userId', 'name email role');

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get meals with flexible filtering
router.get('/mess/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { year, month, startDate, endDate, userId } = req.query;
    const messId = req.params.messId;

    let dateFilter: any = {};

    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    } else if (year && month) {
      // Specific month
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      dateFilter = { date: { $gte: startDate, $lte: endDate } };
    }
    // If no date filter provided, return all meals for the mess

    const userFilter = userId && userId !== 'all' ? { userId } : {};

    const meals = await Meal.find({
      messId,
      ...dateFilter,
      ...userFilter,
    }).populate('userId', 'name email role');

    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update meal - Only managers can update meals
router.put('/:mealId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { breakfast, lunch, dinner, date } = req.body;
    const mealId = req.params.mealId;

    const meal = await Meal.findById(mealId).populate('userId', 'name email');
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Get mess to check permissions
    const mess = await Mess.findById(meal.messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === req.userId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only mess managers can edit meals' });
    }

    // Update meal
    meal.breakfast = breakfast;
    meal.lunch = lunch;
    meal.dinner = dinner;
    meal.date = new Date(date);

    await meal.save();

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete meal - Only managers can delete meals
router.delete('/:mealId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const mealId = req.params.mealId;

    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Get mess to check permissions
    const mess = await Mess.findById(meal.messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === req.userId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only mess managers can delete meals' });
    }

    await Meal.findByIdAndDelete(mealId);

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
