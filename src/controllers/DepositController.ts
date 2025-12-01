import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { DepositService } from '../services/DepositService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendNoContent, sendSuccess } from '../utils/response';

export class DepositController {
  static createDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, userId, amount, date, description } = req.body;
    const deposit = await DepositService.createDeposit(
      messId,
      { userId, amount, date, description },
      req.userId!
    );
    sendSuccess(res, deposit, 'Deposit created successfully', 201);
  });

  static getDeposits = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId } = req.params;
    const { startDate, endDate, userId } = req.query as any;
    const deposits = await DepositService.getDeposits(
      messId,
      { startDate, endDate, userId },
      req.userId!
    );
    sendSuccess(res, deposits);
  });

  static getUserDeposits = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, userId } = req.params;
    const deposits = await DepositService.getUserDeposits(messId, userId, req.userId!);
    sendSuccess(res, deposits);
  });

  static getDepositStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId } = req.params;
    const stats = await DepositService.getDepositStats(messId, req.userId!);
    sendSuccess(res, stats);
  });

  static updateDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { depositId } = req.params;
    const { amount, description, date, userId } = req.body;
    const deposit = await DepositService.updateDeposit(
      depositId,
      { amount, description, date, userId },
      req.userId!
    );
    sendSuccess(res, deposit, 'Deposit updated successfully');
  });

  static deleteDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { depositId } = req.params;
    await DepositService.deleteDeposit(depositId, req.userId!);
    sendNoContent(res);
  });
}
