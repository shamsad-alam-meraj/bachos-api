import express, { type Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

const router = express.Router();

// Get comprehensive reports data
router.get('/:messId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messId = req.params.messId;

    // Verify user has access to this mess
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.messId?.toString() !== messId) {
      return res.status(403).json({ error: 'Access denied to this mess' });
    }

    // Get mess details
    const mess = await Mess.findById(messId).populate('members', 'name email');
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    // Calculate current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total expenses for the current month
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
        },
      },
    ]);

    // Get total meals for the current month
    const monthlyMeals = await Meal.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMeals: {
            $sum: {
              $add: ['$breakfast', '$lunch', '$dinner'],
            },
          },
          mealEntries: { $sum: 1 },
        },
      },
    ]);

    // Get total deposits for the current month
    const monthlyDeposits = await Deposit.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: '$amount' },
          depositCount: { $sum: 1 },
        },
      },
    ]);

    // Get member reports with meals, costs, and deposits
    const memberReports = await Meal.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalMeals: {
            $sum: {
              $add: ['$breakfast', '$lunch', '$dinner'],
            },
          },
          mealDays: { $sum: 1 },
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
        $lookup: {
          from: 'deposits',
          localField: '_id',
          foreignField: 'userId',
          as: 'deposits',
        },
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalMeals: 1,
          mealCost: { $multiply: ['$totalMeals', mess.mealRate] },
          totalDeposit: {
            $sum: {
              $map: {
                input: '$deposits',
                as: 'deposit',
                in: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$$deposit.date', startOfMonth] },
                        { $lte: ['$$deposit.date', endOfMonth] },
                      ],
                    },
                    '$$deposit.amount',
                    0,
                  ],
                },
              },
            },
          },
          mealDays: 1,
        },
      },
      {
        $sort: { totalMeals: -1 },
      },
    ]);

    // Calculate expense share per member
    const totalExpenses = monthlyExpenses.length > 0 ? monthlyExpenses[0].totalExpenses : 0;
    const expensePerMember = mess.members.length > 0 ? totalExpenses / mess.members.length : 0;

    // CORRECTED: Add balance calculation to member reports
    // Balance = Total Deposit - (Meal Cost + Expense Share)
    const memberReportsWithBalance = memberReports.map((report) => ({
      ...report,
      expenseShare: expensePerMember,
      balance: (report.totalDeposit || 0) - (report.mealCost + expensePerMember),
    }));

    // Get detailed expenses with expensedBy information
    const detailedExpenses = await Expense.find({
      messId: messId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email')
      .sort({ date: -1 })
      .lean();

    // Get detailed deposits
    const detailedDeposits = await Deposit.find({
      messId: messId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .lean();

    // Compile reports data
    const reportsData = {
      summary: {
        totalMembers: mess.members.length,
        totalMeals: monthlyMeals.length > 0 ? monthlyMeals[0].totalMeals : 0,
        totalExpenses,
        totalDeposits: monthlyDeposits.length > 0 ? monthlyDeposits[0].totalDeposits : 0,
        mealRate: mess.mealRate,
        expenseCount: monthlyExpenses.length > 0 ? monthlyExpenses[0].expenseCount : 0,
        mealEntries: monthlyMeals.length > 0 ? monthlyMeals[0].mealEntries : 0,
        depositCount: monthlyDeposits.length > 0 ? monthlyDeposits[0].depositCount : 0,
        period: {
          start: startOfMonth,
          end: endOfMonth,
          month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
      },
      memberReports: memberReportsWithBalance,
      detailedExpenses,
      detailedDeposits,
      calculations: {
        expensePerMember: expensePerMember.toFixed(2),
        netBalance:
          (monthlyDeposits.length > 0 ? monthlyDeposits[0].totalDeposits : 0) - totalExpenses,
      },
    };

    res.json(reportsData);
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to load reports data' });
  }
});

export default router;
