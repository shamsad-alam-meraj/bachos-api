import express, { type Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Deposit from '../models/Deposit';
import Mess from '../models/Mess';

const router = express.Router();

// Create a new deposit
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId, userId, amount, date, description } = req.body;

    // Verify the mess exists and user has access
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Check if user is manager or admin of this mess
    const isManager = mess.managerId.toString() === req.userId;
    const isMember = mess.members.some((member) => member.toString() === req.userId);

    if (!isManager && !isMember) {
      return res.status(403).json({ error: 'Access denied to this mess' });
    }

    // Verify the target user belongs to the mess
    const targetUserIsInMess = mess.members.some((member) => member.toString() === userId);
    if (!targetUserIsInMess) {
      return res.status(403).json({ error: 'User does not belong to this mess' });
    }

    const deposit = new Deposit({
      messId,
      userId,
      amount,
      date: new Date(date),
      description,
    });

    await deposit.save();

    // Populate user info in response
    await deposit.populate('userId', 'name email');

    res.json(deposit);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all deposits for a mess
router.get('/mess/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId } = req.params;

    // Verify user has access to this mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    const isMember = mess.members.some((member) => member.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this mess' });
    }

    const deposits = await Deposit.find({ messId })
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(50);

    res.json(deposits);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get deposits for a specific user in a mess
router.get(
  '/mess/:messId/user/:userId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { messId, userId } = req.params;

      // Verify user has access to this mess
      const mess = await Mess.findById(messId);
      if (!mess) {
        return res.status(404).json({ error: 'Mess not found' });
      }

      const isMember = mess.members.some((member) => member.toString() === req.userId);
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this mess' });
      }

      const deposits = await Deposit.find({
        messId,
        userId,
      })
        .populate('userId', 'name email')
        .sort({ date: -1 })
        .limit(50);

      res.json(deposits);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get deposit statistics for a mess
router.get('/mess/:messId/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messId } = req.params;

    // Verify user has access to this mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    const isMember = mess.members.some((member) => member.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this mess' });
    }

    // Get current month stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyStats = await Deposit.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          depositCount: { $sum: 1 },
        },
      },
    ]);

    // Get member-wise deposit totals
    const memberStats = await Deposit.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalAmount: { $sum: '$amount' },
          depositCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          totalAmount: 1,
          depositCount: 1,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    const stats = {
      monthly: monthlyStats.length > 0 ? monthlyStats[0] : { totalAmount: 0, depositCount: 0 },
      memberStats,
      period: {
        start: startOfMonth,
        end: endOfMonth,
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a deposit (manager only)
router.delete('/:depositId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { depositId } = req.params;

    const deposit = await Deposit.findById(depositId).populate('messId');
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check if user is manager of this mess
    const mess = await Mess.findById(deposit.messId);
    if (!mess || mess.managerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only mess manager can delete deposits' });
    }

    await Deposit.findByIdAndDelete(depositId);
    res.json({ message: 'Deposit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
