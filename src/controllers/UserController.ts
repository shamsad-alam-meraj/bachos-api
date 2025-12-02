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
    const user = await UserService.updateUser(id, {
      name,
      email,
      phone,
      role,
      dateOfBirth,
      profileImage,
    }, req.userId!);
    sendSuccess(res, user, 'User updated successfully');
  });

  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await UserService.deleteUser(id, req.userId!);
    sendSuccess(res, result, 'User deleted successfully');
  });
}
