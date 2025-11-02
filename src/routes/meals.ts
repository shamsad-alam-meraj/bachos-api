import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Meal from '../models/Meal';
import Mess from '../models/Mess';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, userId, breakfast, lunch, dinner, date } = req.body;

    // Verify that the user belongs to the mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if the user is adding meal for themselves or if they're the manager
    const isManager = mess.managerId.toString() === req.userId;
    const isAddingForSelf = userId === req.userId;

    if (!isAddingForSelf && !isManager) {
      return res.status(403).json({ error: 'You can only add meals for yourself' });
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
    await meal.populate('userId', 'name email');

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/mess/:messId/month', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const meals = await Meal.find({
      messId: req.params.messId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('userId', 'name email');

    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
