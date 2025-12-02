import mongoose from 'mongoose';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

export class ReportService {
  static async getReportsData(messId: string, requestingUserId: string) {
    // Verify user has access to this mess
    const user = await User.findById(requestingUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.messId?.toString() !== messId) {
      throw new Error('Access denied to this mess');
    }

    // Get mess details
    const mess = await Mess.findById(messId).populate('members', 'name email');
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

    // Get member reports
    const memberReports = await User.aggregate([
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
          email: 1,
          totalMeals: { $ifNull: [{ $arrayElemAt: ['$mealData.totalMeals', 0] }, 0] },
          totalDeposit: { $ifNull: [{ $arrayElemAt: ['$depositData.totalDeposit', 0] }, 0] },
          mealCost: {
            $multiply: [
              { $ifNull: [{ $arrayElemAt: ['$mealData.totalMeals', 0] }, 0] },
              mess.mealRate,
            ],
          },
          expenseShare: totalMembers > 0 ? { $divide: [totalExpenses, totalMembers] } : 0,
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalMeals: 1,
          mealCost: 1,
          totalDeposit: 1,
          expenseShare: 1,
          balance: { $subtract: ['$totalDeposit', '$mealCost'] },
        },
      },
    ]);

    // Get detailed expenses
    const detailedExpenses = await Expense.find({
      messId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email')
      .sort({ date: -1 });

    // Get detailed deposits
    const detailedDeposits = await Deposit.find({
      messId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('userId', 'name email')
      .sort({ date: -1 });

    // Calculations
    const expensePerMember = totalMembers > 0 ? (totalExpenses / totalMembers).toFixed(2) : '0';
    const netBalance = totalDeposits - totalExpenses;

    return {
      summary: {
        totalMembers,
        totalMeals,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalDeposits: parseFloat(totalDeposits.toFixed(2)),
        mealRate: parseFloat(mess.mealRate.toFixed(2)),
        expenseCount: monthlyExpenses.length > 0 ? monthlyExpenses[0].expenseCount : 0,
        mealEntries: monthlyMeals.length > 0 ? monthlyMeals[0].mealEntries : 0,
        depositCount: monthlyDeposits.length > 0 ? monthlyDeposits[0].depositCount : 0,
        period: {
          start: startOfMonth,
          end: endOfMonth,
          month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
      },
      memberReports,
      detailedExpenses,
      detailedDeposits,
      calculations: {
        expensePerMember,
        netBalance,
      },
    };
  }
}
