import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { DashboardService } from '../services/DashboardService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class DashboardController {
  static getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const dashboardData = await DashboardService.getDashboardData(req.params.messId, req.userId!);
    sendSuccess(res, dashboardData);
  });
}
