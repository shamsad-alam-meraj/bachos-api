import express, { type Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

const router = express.Router();

// Get comprehensive analytics data
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
    const mess = await Mess.findById(messId);
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

    // Get member statistics with meals, costs, and deposits
    const memberStats = await Meal.aggregate([
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
          meals: '$totalMeals',
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
        $sort: { meals: -1 },
      },
    ]);

    // Get financial overview for pie chart (Total Expenses vs Total Deposits)
    const financialOverview = [
      {
        name: 'Total Expenses',
        value: monthlyExpenses.length > 0 ? monthlyExpenses[0].totalExpenses : 0,
      },
      {
        name: 'Total Deposits',
        value: monthlyDeposits.length > 0 ? monthlyDeposits[0].totalDeposits : 0,
      },
    ];

    // Get expense breakdown by category
    const categoryStats = await Expense.aggregate([
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
          _id: '$category',
          value: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: {
            $concat: [
              { $toUpper: { $substr: ['$_id', 0, 1] } },
              { $substr: ['$_id', 1, { $subtract: [{ $strLenBytes: '$_id' }, 1] }] },
            ],
          },
          value: 1,
          count: 1,
        },
      },
      {
        $sort: { value: -1 },
      },
    ]);

    // Get daily meal trends
    const dailyTrends = await Meal.aggregate([
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
          _id: '$date',
          meals: {
            $sum: {
              $add: ['$breakfast', '$lunch', '$dinner'],
            },
          },
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%b %d',
              date: '$_id',
            },
          },
          meals: 1,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate statistics
    const totalExpenses = monthlyExpenses.length > 0 ? monthlyExpenses[0].totalExpenses : 0;
    const totalMeals = monthlyMeals.length > 0 ? monthlyMeals[0].totalMeals : 0;
    const totalDeposits = monthlyDeposits.length > 0 ? monthlyDeposits[0].totalDeposits : 0;
    const totalMembers = memberStats.length;
    const totalExpenseCount = monthlyExpenses.length > 0 ? monthlyExpenses[0].expenseCount : 0;
    const totalMealEntries = monthlyMeals.length > 0 ? monthlyMeals[0].mealEntries : 0;
    const totalDepositCount = monthlyDeposits.length > 0 ? monthlyDeposits[0].depositCount : 0;

    // Compile analytics data
    const analyticsData = {
      summary: {
        totalMembers,
        totalMeals,
        totalExpenses,
        totalDeposits,
        mealRate: mess.mealRate,
        expenseCount: totalExpenseCount,
        mealEntries: totalMealEntries,
        depositCount: totalDepositCount,
        period: {
          start: startOfMonth,
          end: endOfMonth,
          month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
      },
      memberStats,
      financialOverview,
      categoryStats,
      dailyTrends,
      calculations: {
        avgMealsPerMember: totalMembers > 0 ? (totalMeals / totalMembers).toFixed(1) : '0',
        avgExpensePerMember: totalMembers > 0 ? (totalExpenses / totalMembers).toFixed(0) : '0',
        netBalance: totalDeposits - totalExpenses,
        mealCostPercentage:
          totalExpenses > 0
            ? (((totalMeals * mess.mealRate) / totalExpenses) * 100).toFixed(1)
            : '0',
      },
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics data' });
  }
});

export default router;
