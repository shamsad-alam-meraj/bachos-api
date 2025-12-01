import mongoose from 'mongoose';
import Deposit from '../models/Deposit';
import Expense from '../models/Expense';
import Meal from '../models/Meal';
import Mess from '../models/Mess';
import User from '../models/User';

// Admin-only email domains or specific emails
const ADMIN_EMAILS = ['admin@bachos.com'];
const ADMIN_DOMAINS = ['@admin.'];

const isAdminEmail = (email: string): boolean => {
  return (
    ADMIN_EMAILS.includes(email.toLowerCase()) ||
    ADMIN_DOMAINS.some((domain) => email.toLowerCase().includes(domain))
  );
};

// Calculate dynamic meal rate based on expenses and meals
const calculateMealRate = async (messId: string): Promise<number> => {
  try {
    // Get current month's expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Get current month's total meals
    const totalMeals = await Meal.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $add: ['$breakfast', '$lunch', '$dinner'] },
          },
        },
      },
    ]);

    const expenses = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
    const meals = totalMeals.length > 0 ? totalMeals[0].total : 0;

    // Calculate meal rate (default to 50 if no meals)
    const rate = expenses / meals;
    const mealRate = parseFloat(Number(rate).toFixed(2)); // Convert back to number

    return mealRate;
  } catch (error) {
    console.error('Error calculating meal rate:', error);
    return 50; // Default fallback
  }
};

export class MessService {
  static async createMess(
    messData: { name: string; description?: string; address?: string; managerId: string },
    requestingUserId: string
  ) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'admin') {
      throw new Error(
        'Only admins can create messes. Please ask an existing mess manager to add you.'
      );
    }

    // Verify manager exists
    const manager = await User.findById(messData.managerId);
    if (!manager) {
      throw new Error('Selected manager not found');
    }

    const mess = new Mess({
      name: messData.name,
      description: messData.description,
      address: messData.address,
      managerId: messData.managerId,
      members: [messData.managerId],
      mealRate: 50, // Initial default rate
    });

    await mess.save();

    // Update manager's messId
    await User.findByIdAndUpdate(messData.managerId, { messId: mess._id });

    return mess;
  }

  static async getMess(messId: string) {
    const mess = await Mess.findById(messId)
      .populate('managerId', 'name email')
      .populate('members', 'name email phone');

    if (mess) {
      // Calculate current meal rate
      const currentMealRate = await calculateMealRate(mess._id.toString());
      mess.mealRate = currentMealRate;
      await mess.save();
    }

    return mess;
  }

  static async getMealRate(messId: string) {
    const mealRate = await calculateMealRate(messId);
    return { mealRate };
  }

  static async addMember(messId: string, email: string, requestingUserId: string) {
    // Check if current user is the manager of this mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    if (mess.managerId.toString() !== requestingUserId) {
      throw new Error('Only mess manager can add members');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.messId) {
      throw new Error('User is already in a mess');
    }

    // Add user to mess
    await Mess.findByIdAndUpdate(messId, { $addToSet: { members: user._id } }, { new: true });

    await User.findByIdAndUpdate(user._id, { messId });

    const updatedMess = await Mess.findById(messId)
      .populate('managerId', 'name email')
      .populate('members', 'name email phone');

    return updatedMess;
  }

  static async getAllMesses(requestingUserId: string) {
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const messes = await Mess.find()
      .populate('managerId', 'name email')
      .populate('members', 'name email');

    return messes;
  }

  static async deleteMess(messId: string, requestingUserId: string) {
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Delete all related data in transaction
    await Promise.all([
      Meal.deleteMany({ messId }),
      Expense.deleteMany({ messId }),
      Deposit.deleteMany({ messId }),
      User.updateMany({ messId }, { $unset: { messId: 1 } }),
      Mess.findByIdAndDelete(messId),
    ]);
  }

  static async cleanupData(
    messId: string,
    startDate: string,
    endDate: string,
    type: string,
    requestingUserId: string
  ) {
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let deletedCount = 0;

    if (type === 'meals' || type === 'all') {
      const mealResult = await Meal.deleteMany({
        messId,
        date: { $gte: start, $lte: end },
      });
      deletedCount += mealResult.deletedCount;
    }

    if (type === 'expenses' || type === 'all') {
      const expenseResult = await Expense.deleteMany({
        messId,
        date: { $gte: start, $lte: end },
      });
      deletedCount += expenseResult.deletedCount;
    }

    if (type === 'deposits' || type === 'all') {
      const depositResult = await Deposit.deleteMany({
        messId,
        date: { $gte: start, $lte: end },
      });
      deletedCount += depositResult.deletedCount;
    }

    return { deletedCount };
  }
}
