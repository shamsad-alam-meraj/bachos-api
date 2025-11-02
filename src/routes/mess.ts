import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Mess from '../models/Mess';
import User from '../models/User';

const router = express.Router();

router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, mealRate } = req.body;

    const mess = new Mess({
      name,
      description,
      mealRate,
      managerId: req.userId,
      members: [req.userId],
    });

    await mess.save();

    await User.findByIdAndUpdate(req.userId, { messId: mess._id, role: 'manager' });

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

    res.json(mess);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:messId/add-member', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mess = await Mess.findByIdAndUpdate(
      req.params.messId,
      { $addToSet: { members: user._id } },
      { new: true }
    ).populate('members', 'name email');

    await User.findByIdAndUpdate(user._id, { messId: req.params.messId });

    res.json(mess);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
