import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class UserController {
  static getAllNonAdminUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await UserService.getAllNonAdminUsers(req.userId!);
    sendSuccess(res, users);
  });

  static getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await UserService.getAllUsers(req.userId!);
    sendSuccess(res, users);
  });

  static getAdmins = asyncHandler(async (req: AuthRequest, res: Response) => {
    const admins = await UserService.getAdmins(req.userId!);
    sendSuccess(res, admins);
  });

  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserService.getProfile(req.userId!);
    sendSuccess(res, user);
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, phone, dateOfBirth, profileImage } = req.body;
    const user = await UserService.updateProfile(req.userId!, {
      name,
      phone,
      dateOfBirth,
      profileImage,
    });
    sendSuccess(res, user, 'Profile updated successfully');
  });

  static getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id, req.userId!);
    sendSuccess(res, user);
  });

  static updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, phone, role, dateOfBirth, profileImage } = req.body;
    const user = await UserService.updateUser(
      id,
      {
        name,
        email,
        phone,
        role,
        dateOfBirth,
        profileImage,
      },
      req.userId!
    );
    sendSuccess(res, user, 'User updated successfully');
  });

  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await UserService.deleteUser(id, req.userId!);
    sendSuccess(res, result, 'User deleted successfully');
  });

  static searchAndFilterUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, role, messId, page, limit, sortBy, sortOrder } = req.query as any;
    const result = await UserService.searchAndFilterUsers(req.userId!, {
      search,
      role,
      messId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    });
    sendSuccess(res, result);
  });

  static getUserStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const statistics = await UserService.getUserStatistics(req.userId!);
    sendSuccess(res, statistics);
  });

  static softDeleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await UserService.softDeleteUser(id, req.userId!);
    sendSuccess(res, result, 'User deleted successfully');
  });

  static restoreUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = await UserService.restoreUser(id, req.userId!);
    sendSuccess(res, user, 'User restored successfully');
  });

  static updateUserPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { notifications, language, theme } = req.body;
    const user = await UserService.updateUserPreferences(req.userId!, {
      notifications,
      language,
      theme,
    });
    sendSuccess(res, user, 'Preferences updated successfully');
  });
}
