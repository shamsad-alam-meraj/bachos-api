import mongoose from 'mongoose';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

export class AnalyticsService {
  static async getAnalyticsData(messId: string, requestingUserId: string) {
    // Verify user has access to this mess
    const user = await User.findById(requestingUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.messId?.toString() !== messId) {
      throw new Error('Access denied to this mess');
    }

    // Get mess details
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
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
          date: { $gte: startOfMonth, $lte: endOfMonth },
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
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: { $add: ['$breakfast', '$lunch', '$dinner'] } },
          mealEntries: { $sum: 1 },
        },
      },
    ]);

    // Get total deposits for the current month
    const monthlyDeposits = await Deposit.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
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

    // Calculate statistics
    const totalExpenses = monthlyExpenses.length > 0 ? monthlyExpenses[0].totalExpenses : 0;
    const totalMeals = monthlyMeals.length > 0 ? monthlyMeals[0].totalMeals : 0;
    const totalDeposits = monthlyDeposits.length > 0 ? monthlyDeposits[0].totalDeposits : 0;

    // Get total members
    const totalMembers = mess.members.length;

    // Get member statistics
    const memberStats = await User.aggregate([
      {
        $match: {
          _id: { $in: mess.members },
        },
      },
      {
        $lookup: {
          from: 'meals',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$messId', new mongoose.Types.ObjectId(messId)] },
                    { $gte: ['$date', startOfMonth] },
                    { $lte: ['$date', endOfMonth] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalMeals: { $sum: { $add: ['$breakfast', '$lunch', '$dinner'] } },
                mealDays: { $sum: 1 },
              },
            },
          ],
          as: 'mealData',
        },
      },
      {
        $lookup: {
          from: 'deposits',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$messId', new mongoose.Types.ObjectId(messId)] },
                    { $gte: ['$date', startOfMonth] },
                    { $lte: ['$date', endOfMonth] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalDeposit: { $sum: '$amount' },
              },
            },
          ],
          as: 'depositData',
        },
      },
      {
        $project: {
          name: 1,
          meals: { $ifNull: [{ $arrayElemAt: ['$mealData.totalMeals', 0] }, 0] },
          mealDays: { $ifNull: [{ $arrayElemAt: ['$mealData.mealDays', 0] }, 0] },
          totalDeposit: { $ifNull: [{ $arrayElemAt: ['$depositData.totalDeposit', 0] }, 0] },
          mealCost: {
            $multiply: [
              { $ifNull: [{ $arrayElemAt: ['$mealData.totalMeals', 0] }, 0] },
              mess.mealRate,
            ],
          },
        },
      },
    ]);

    // Financial overview
    const financialOverview = [
      { name: 'Expenses', value: totalExpenses },
      { name: 'Deposits', value: totalDeposits },
    ];

    // Expense categories
    const categoryStats = await Expense.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
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
          name: '$_id',
          value: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Daily meal trends
    const dailyTrends = await Meal.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          meals: { $sum: { $add: ['$breakfast', '$lunch', '$dinner'] } },
        },
      },
      {
        $project: {
          date: '$_id',
          meals: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    // Calculations
    const avgMealsPerMember = totalMembers > 0 ? (totalMeals / totalMembers).toFixed(1) : '0';
    const avgExpensePerMember = totalMembers > 0 ? (totalExpenses / totalMembers).toFixed(2) : '0';
    const netBalance = totalDeposits - totalExpenses;
    const mealCostTotal = totalMeals * mess.mealRate;
    const mealCostPercentage =
      totalExpenses > 0 ? ((mealCostTotal / totalExpenses) * 100).toFixed(1) : '0';

    return {
      summary: {
        totalMembers,
        totalMeals,
        totalExpenses,
        totalDeposits,
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
      memberStats,
      financialOverview,
      categoryStats,
      dailyTrends,
      calculations: {
        avgMealsPerMember,
        avgExpensePerMember,
        netBalance,
        mealCostPercentage,
      },
    };
  }
}
