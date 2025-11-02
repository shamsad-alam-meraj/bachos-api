import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, dateOfBirth, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, dateOfBirth, profileImage, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
