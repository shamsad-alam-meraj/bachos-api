import express, { type Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

const router = express.Router();

// Get comprehensive dashboard data
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

    // Get mess details with populated data
    const mess = await Mess.findById(messId)
      .populate('managerId', 'name email role')
      .populate('members', 'name email phone role');

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

    // Get daily meal breakdown for the current month
    const dailyMealStats = await Meal.aggregate([
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
          _id: {
            userId: '$userId',
            date: '$date',
          },
          dailyMeals: {
            $sum: { $add: ['$breakfast', '$lunch', '$dinner'] },
          },
        },
      },
      {
        $group: {
          _id: '$_id.userId',
          totalUserMeals: { $sum: '$dailyMeals' },
          daysWithMeals: { $sum: 1 },
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
          totalUserMeals: 1,
          daysWithMeals: 1,
        },
      },
    ]);

    // Get expense breakdown by category
    const expenseByCategory = await Expense.aggregate([
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
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Get recent meals (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMeals = await Meal.find({
      messId: messId,
      date: { $gte: sevenDaysAgo },
    })
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Get recent expenses (last 7 days)
    const recentExpenses = await Expense.find({
      messId: messId,
      date: { $gte: sevenDaysAgo },
    })
      .populate('addedBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate statistics
    const totalExpenses = monthlyExpenses.length > 0 ? monthlyExpenses[0].totalExpenses : 0;
    const totalMeals = monthlyMeals.length > 0 ? monthlyMeals[0].totalMeals : 0;
    const totalDeposits = monthlyDeposits.length > 0 ? monthlyDeposits[0].totalDeposits : 0;
    const totalMembers = mess.members.length;

    // Calculate meal rate (expenses per meal) - FIXED: Ensure it's always a number
    const mealRate = totalMeals > 0 ? parseFloat((totalExpenses / totalMeals).toFixed(2)) : 0;

    // Calculate member meal statistics
    const memberMealStats = dailyMealStats.map((stat) => ({
      userId: stat.userId,
      userName: stat.userName,
      totalMeals: stat.totalUserMeals,
      daysWithMeals: stat.daysWithMeals,
      avgMealsPerDay:
        stat.daysWithMeals > 0 ? (stat.totalUserMeals / stat.daysWithMeals).toFixed(1) : '0',
    }));

    // Update mess with current meal rate
    await Mess.findByIdAndUpdate(messId, {
      mealRate: mealRate,
      updatedAt: new Date(),
    });

    // Compile complete dashboard data
    const dashboardData = {
      mess: {
        _id: mess._id,
        name: mess.name,
        description: mess.description,
        address: mess.address,
        managerId: mess.managerId,
        members: mess.members,
        mealRate: mealRate,
        totalExpenses: totalExpenses,
        totalMeals: totalMeals,
        totalDeposits: totalDeposits,
        currency: '৳',
        createdAt: mess.createdAt,
        updatedAt: new Date(),
      },
      monthlyStats: {
        totalMembers: totalMembers,
        totalMeals: totalMeals,
        totalExpenses: totalExpenses,
        totalDeposits: totalDeposits,
        mealRate: mealRate,
        expenseCount: monthlyExpenses.length > 0 ? monthlyExpenses[0].expenseCount : 0,
        mealEntries: monthlyMeals.length > 0 ? monthlyMeals[0].mealEntries : 0,
        depositCount: monthlyDeposits.length > 0 ? monthlyDeposits[0].depositCount : 0,
      },
      memberStats: memberMealStats,
      expenseBreakdown: expenseByCategory,
      recentMeals: recentMeals,
      recentExpenses: recentExpenses,
      calculationBreakdown: {
        totalExpenses: totalExpenses,
        totalMeals: totalMeals,
        mealRate: mealRate,
        formula:
          totalMeals > 0
            ? `৳${totalExpenses} ÷ ${totalMeals} meals = ৳${mealRate} per meal`
            : 'No meals recorded',
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString(),
          month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
      },
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;
