import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Get all non-admin users
router.get('/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access all users' });
    }

    // Get all users except admins
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all users (including admins) - if you need this separately
router.get('/all-users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access all users' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get only admin users - if needed
router.get('/admins', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access this information' });
    }

    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

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
