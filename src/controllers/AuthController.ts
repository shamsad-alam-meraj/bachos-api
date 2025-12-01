import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class AuthController {
  static signup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.signup(req.body);
    sendSuccess(res, result, 'User created successfully', 201);
  });

  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  });
}
