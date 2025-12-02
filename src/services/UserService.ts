import User from '../models/User';

export class UserService {
  static async getAllNonAdminUsers(requestingUserId: string) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access all users');
    }

    // Get all users except admins
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    return users;
  }

  static async getAllUsers(requestingUserId: string) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access all users');
    }

    const users = await User.find().select('-password');
    return users;
  }

  static async getAdmins(requestingUserId: string) {
    // Check if user is admin
    const user = await User.findById(requestingUserId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access this information');
    }

    const admins = await User.find({ role: 'admin' }).select('-password');
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
    updateData: Partial<{ name: string; email: string; phone: string; role: string; dateOfBirth: Date; profileImage: string }>,
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
}
