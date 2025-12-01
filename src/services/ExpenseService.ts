import mongoose from 'mongoose';
import Expense from '../models/Expense';
import Mess from '../models/Mess';

export class ExpenseService {
  static async createExpense(
    messId: string,
    expenseData: {
      description: string;
      amount: number;
      category: string;
      expensedBy: string;
      date?: string;
    },
    requestingUserId: string
  ) {
    // Verify the mess exists
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if the user is the manager
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can add expenses');
    }

    // Verify the expensedBy user belongs to the mess
    const expensedUserIsInMess = mess.members.some(
      (member) => member.toString() === expenseData.expensedBy
    );
    if (!expensedUserIsInMess) {
      throw new Error('Expensed user does not belong to this mess');
    }

    const expense = new Expense({
      messId: new mongoose.Types.ObjectId(messId),
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category as 'food' | 'utilities' | 'maintenance' | 'other',
      addedBy: new mongoose.Types.ObjectId(requestingUserId),
      expensedBy: new mongoose.Types.ObjectId(expenseData.expensedBy),
      date: expenseData.date ? new Date(expenseData.date) : new Date(),
    });

    await expense.save();

    // Populate user info in response
    await expense.populate('addedBy', 'name email');
    await expense.populate('expensedBy', 'name email');

    return expense;
  }

  static async getExpenses(
    messId: string,
    filters: { startDate?: string; endDate?: string; category?: string; userId?: string }
  ) {
    let dateFilter: any = {};
    let categoryFilter: any = {};
    let userFilter: any = {};

    // Date filter
    if (filters.startDate && filters.endDate) {
      dateFilter = {
        date: {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        },
      };
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      categoryFilter = { category: filters.category };
    }

    // User filter
    if (filters.userId && filters.userId !== 'all') {
      userFilter = { expensedBy: filters.userId };
    }

    const expenses = await Expense.find({
      messId,
      ...dateFilter,
      ...categoryFilter,
      ...userFilter,
    })
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    return expenses;
  }

  static async updateExpense(
    expenseId: string,
    updateData: {
      description: string;
      amount: number;
      category: string;
      expensedBy: string;
      date: string;
    },
    requestingUserId: string
  ) {
    const expense = await Expense.findById(expenseId)
      .populate('addedBy', 'name email')
      .populate('expensedBy', 'name email');

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Get mess to check permissions
    const mess = await Mess.findById(expense.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can edit expenses');
    }

    // Verify the expensedBy user belongs to the mess
    const expensedUserIsInMess = mess.members.some(
      (member) => member.toString() === updateData.expensedBy
    );
    if (!expensedUserIsInMess) {
      throw new Error('Expensed user does not belong to this mess');
    }

    // Update expense
    expense.description = updateData.description;
    expense.amount = updateData.amount;
    expense.category = updateData.category as 'food' | 'utilities' | 'maintenance' | 'other';
    expense.expensedBy = new mongoose.Types.ObjectId(updateData.expensedBy);
    expense.date = new Date(updateData.date);

    await expense.save();

    return expense;
  }

  static async deleteExpense(expenseId: string, requestingUserId: string) {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Get mess to check permissions
    const mess = await Mess.findById(expense.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can delete expenses');
    }

    await Expense.findByIdAndDelete(expenseId);
  }
}
