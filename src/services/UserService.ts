import User from '../models/User';

export class UserService {
  static async getAllNonAdminUsers(requestingUserId: string) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access all users');
    }

    // Get all users except admins and deleted users
    const users = await User.find({ role: { $ne: 'admin' }, isDeleted: false }).select('-password');
    return users;
  }

  static async getAllUsers(requestingUserId: string) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access all users');
    }

    const users = await User.find({ isDeleted: false }).select('-password');
    return users;
  }

  static async getAdmins(requestingUserId: string) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access this information');
    }

    const admins = await User.find({ role: 'admin', isDeleted: false }).select('-password');
    return admins;
  }

  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async updateProfile(
    userId: string,
    updateData: Partial<{ name: string; phone: string; dateOfBirth: Date; profileImage: string }>
  ) {
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async getUserById(userId: string, requestingUserId: string) {
    // Check if user is admin or requesting their own profile
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || (requestingUser.role !== 'admin' && requestingUserId !== userId)) {
      throw new Error('Access denied');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async updateUser(
    userId: string,
    updateData: Partial<{
      name: string;
      email: string;
      phone: string;
      role: string;
      dateOfBirth: Date;
      profileImage: string;
    }>,
    requestingUserId: string
  ) {
    // Check if user is admin
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Only admins can update users');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async deleteUser(userId: string, requestingUserId: string) {
    // Check if user is admin
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    // Prevent admin from deleting themselves
    if (userId === requestingUserId) {
      throw new Error('Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  static async softDeleteUser(userId: string, requestingUserId: string) {
    // Check if user is admin
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    // Prevent admin from deleting themselves
    if (userId === requestingUserId) {
      throw new Error('Cannot delete your own account');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  static async restoreUser(userId: string, requestingUserId: string) {
    // Check if user is admin
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Only admins can restore users');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateUserPreferences(
    userId: string,
    preferences: { notifications?: boolean; language?: string; theme?: 'light' | 'dark' }
  ) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        preferences: { ...preferences },
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async searchAndFilterUsers(
    requestingUserId: string,
    filters: {
      search?: string;
      role?: string;
      messId?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    // Check if user is admin
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Only admins can search and filter users');
    }

    const query: any = {};

    // Search functionality
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      query.role = filters.role;
    }

    // Mess filter
    if (filters.messId && filters.messId !== 'all') {
      query.messId = filters.messId;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortOptions: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortBy] = sortOrder;

    const users = await User.find(query)
      .select('-password')
      .populate('messId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserStatistics(requestingUserId: string) {
    // Check if user is admin
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Only admins can access user statistics');
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const managerUsers = await User.countDocuments({ role: 'manager' });

    // Users with mess
    const usersWithMess = await User.countDocuments({
      messId: { $exists: true, $ne: null },
    });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      managerUsers,
      usersWithMess,
      usersWithoutMess: activeUsers - usersWithMess,
      recentRegistrations,
    };
  }
}
