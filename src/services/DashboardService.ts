import mongoose from 'mongoose';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

export class DashboardService {
  static async getDashboardData(messId: string, requestingUserId: string) {
    // Verify user has access to this mess
    const user = await User.findById(requestingUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.messId?.toString() !== messId) {
      throw new Error('Access denied to this mess');
    }

    // Get mess details with populated data
    const mess = await Mess.findById(messId)
      .populate('managerId', 'name email role')
      .populate('members', 'name email phone role');

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
    const totalMembers = mess.members.length;

    // Calculate meal rate
    const mealRate = totalMeals > 0 ? parseFloat((totalExpenses / totalMeals).toFixed(2)) : 0;

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
                _id: '$date',
                dailyMeals: { $sum: { $add: ['$breakfast', '$lunch', '$dinner'] } },
              },
            },
            {
              $group: {
                _id: null,
                totalMeals: { $sum: '$dailyMeals' },
                daysWithMeals: { $sum: 1 },
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
          userId: '$_id',
          userName: '$name',
          totalMeals: { $ifNull: [{ $arrayElemAt: ['$mealData.totalMeals', 0] }, 0] },
          daysWithMeals: { $ifNull: [{ $arrayElemAt: ['$mealData.daysWithMeals', 0] }, 0] },
          avgMealsPerDay: {
            $toString: {
              $round: [
                {
                  $cond: {
                    if: {
                      $gt: [{ $ifNull: [{ $arrayElemAt: ['$mealData.daysWithMeals', 0] }, 0] }, 0],
                    },
                    then: {
                      $divide: [
                        { $ifNull: [{ $arrayElemAt: ['$mealData.totalMeals', 0] }, 0] },
                        { $ifNull: [{ $arrayElemAt: ['$mealData.daysWithMeals', 0] }, 0] },
                      ],
                    },
                    else: 0,
                  },
                },
                2,
              ],
            },
          },
          _id: 0,
        },
      },
    ]);

    // Get expense breakdown by category
    const expenseBreakdown = await Expense.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
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
        $project: {
          category: '$_id',
          totalAmount: 1,
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Get recent meals (last 10)
    const recentMeals = await Meal.find({
      messId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    // Get recent expenses (last 10)
    const recentExpenses = await Expense.find({
      messId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    // Calculation breakdown for meal rate
    const calculationBreakdown = {
      totalExpenses,
      totalMeals,
      mealRate,
      calculation:
        totalMeals > 0 ? `${totalExpenses} / ${totalMeals} = ${mealRate}` : 'No meals recorded',
      period: {
        start: startOfMonth,
        end: endOfMonth,
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    };

    return {
      mess: {
        _id: mess._id,
        name: mess.name,
        description: mess.description,
        address: mess.address,
        managerId: mess.managerId,
        members: mess.members,
        mealRate: mealRate,
        totalExpenses,
        totalMeals,
        totalDeposits,
        currency: '৳',
        createdAt: mess.createdAt,
        updatedAt: new Date(),
      },
      monthlyStats: {
        totalMembers,
        totalMeals,
        totalExpenses,
        totalDeposits,
        mealRate,
        expenseCount: monthlyExpenses.length > 0 ? monthlyExpenses[0].expenseCount : 0,
        mealEntries: monthlyMeals.length > 0 ? monthlyMeals[0].mealEntries : 0,
        depositCount: monthlyDeposits.length > 0 ? monthlyDeposits[0].depositCount : 0,
      },
      memberStats,
      expenseBreakdown,
      recentMeals,
      recentExpenses,
      calculationBreakdown,
    };
  }
}
