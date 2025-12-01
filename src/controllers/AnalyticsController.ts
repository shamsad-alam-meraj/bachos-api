import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/AnalyticsService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class AnalyticsController {
  static getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const analyticsData = await AnalyticsService.getAnalyticsData(req.params.messId, req.userId!);
    sendSuccess(res, analyticsData);
  });
}
