import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { ReportService } from '../services/ReportService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class ReportController {
  static getReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reportsData = await ReportService.getReportsData(req.params.messId, req.userId!);
    sendSuccess(res, reportsData);
  });
}
