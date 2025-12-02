import mongoose from 'mongoose';
import Deposit from '../models/Deposit';
import Mess from '../models/Mess';

export class DepositService {
  static async createDeposit(
    messId: string,
    depositData: { userId: string; amount: number; date: string; description?: string },
    requestingUserId: string
  ) {
    // Verify the mess exists
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if user is manager of this mess
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can add deposits');
    }

    // Verify the target user belongs to the mess
    const targetUserIsInMess = mess.members.some(
      (member) => member.toString() === depositData.userId
    );
    if (!targetUserIsInMess) {
      throw new Error('User does not belong to this mess');
    }

    const deposit = new Deposit({
      messId: new mongoose.Types.ObjectId(messId),
      userId: new mongoose.Types.ObjectId(depositData.userId),
      amount: depositData.amount,
      date: new Date(depositData.date),
      description: depositData.description,
    });

    await deposit.save();

    // Populate user info in response
    await deposit.populate('userId', 'name email');

    return deposit;
  }

  static async getDeposits(
    messId: string,
    filters: { startDate?: string; endDate?: string; userId?: string },
    requestingUserId: string
  ) {
    // Verify user has access to this mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const isMember = mess.members.some((member) => member.toString() === requestingUserId);
    if (!isMember) {
      throw new Error('Access denied to this mess');
    }

    let dateFilter: any = {};
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

    // User filter
    if (filters.userId && filters.userId !== 'all') {
      userFilter = { userId: filters.userId };
    }

    const deposits = await Deposit.find({
      messId,
      ...dateFilter,
      ...userFilter,
    })
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    return deposits;
  }

  static async getAllDeposits(
    requestingUserId: string,
    filters: {
      messId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    }
  ) {
    // Build query
    const query: any = {};

    if (filters.messId) {
      query.messId = filters.messId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    // Pagination
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const skip = (page - 1) * limit;

    const deposits = await Deposit.find(query)
      .populate('userId', 'name email')
      .populate('messId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Deposit.countDocuments(query);

    return {
      deposits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserDeposits(messId: string, userId: string, requestingUserId: string) {
    // Verify user has access to this mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const isMember = mess.members.some((member) => member.toString() === requestingUserId);
    if (!isMember) {
      throw new Error('Access denied to this mess');
    }

    const deposits = await Deposit.find({
      messId,
      userId,
    })
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .limit(50);

    return deposits;
  }

  static async getDepositStats(messId: string, requestingUserId: string) {
    // Verify user has access to this mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const isMember = mess.members.some((member) => member.toString() === requestingUserId);
    if (!isMember) {
      throw new Error('Access denied to this mess');
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

    return {
      monthly: monthlyStats.length > 0 ? monthlyStats[0] : { totalAmount: 0, depositCount: 0 },
      memberStats,
      period: {
        start: startOfMonth,
        end: endOfMonth,
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    };
  }

  static async updateDeposit(
    depositId: string,
    updateData: { amount: number; description?: string; date: string; userId: string },
    requestingUserId: string
  ) {
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      throw new Error('Deposit not found');
    }

    // Check if user is manager of this mess
    const mess = await Mess.findById(deposit.messId);
    if (!mess || mess.managerId.toString() !== requestingUserId) {
      throw new Error('Only mess manager can update deposits');
    }

    // Verify the target user belongs to the mess
    const targetUserIsInMess = mess.members.some(
      (member) => member.toString() === updateData.userId
    );
    if (!targetUserIsInMess) {
      throw new Error('User does not belong to this mess');
    }

    // Update deposit
    deposit.amount = updateData.amount;
    deposit.description = updateData.description;
    deposit.date = new Date(updateData.date);
    deposit.userId = new mongoose.Types.ObjectId(updateData.userId);

    await deposit.save();

    // Populate user info in response
    await deposit.populate('userId', 'name email');

    return deposit;
  }

  static async deleteDeposit(depositId: string, requestingUserId: string) {
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      throw new Error('Deposit not found');
    }

    // Check if user is manager of this mess
    const mess = await Mess.findById(deposit.messId);
    if (!mess || mess.managerId.toString() !== requestingUserId) {
      throw new Error('Only mess manager can delete deposits');
    }

    await Deposit.findByIdAndDelete(depositId);
  }
}
