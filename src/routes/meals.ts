import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Meal from '../models/Meal';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, userId, breakfast, lunch, dinner, date } = req.body;

    const meal = new Meal({
      messId,
      userId,
      breakfast,
      lunch,
      dinner,
      date: new Date(date),
    });

    await meal.save();
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
