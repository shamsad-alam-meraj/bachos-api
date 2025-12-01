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

    return {
      summary: {
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
    };
  }
}
