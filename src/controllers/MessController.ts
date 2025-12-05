import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { MessService } from '../services/MessService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class MessController {
  static createMess = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, address, managerId } = req.body;
    const mess = await MessService.createMess(
      { name, description, address, managerId },
      req.userId!
    );
    sendSuccess(res, mess, 'Mess created successfully', 201);
  });

  static getMess = asyncHandler(async (req: AuthRequest, res: Response) => {
    const mess = await MessService.getMess(req.params.messId);
    sendSuccess(res, mess);
  });

  static getMealRate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await MessService.getMealRate(req.params.messId);
    sendSuccess(res, result);
  });

  static addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;
    const mess = await MessService.addMember(req.params.messId, email, req.userId!);
    sendSuccess(res, mess, 'Member added successfully');
  });

  static getAllMesses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const messes = await MessService.getAllMesses(req.userId!);
    sendSuccess(res, messes);
  });

  static deleteMess = asyncHandler(async (req: AuthRequest, res: Response) => {
    await MessService.deleteMess(req.params.messId, req.userId!);
    sendSuccess(res, { message: 'Mess and all related data deleted successfully' });
  });

  static cleanupData = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, startDate, endDate, type } = req.body;
    const result = await MessService.cleanupData(messId, startDate, endDate, type, req.userId!);
    sendSuccess(res, { message: 'Data cleanup completed successfully', ...result });
  });

  static updateMess = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId } = req.params;
    const { name, description, address, mealRate, currency, managerId } = req.body;
    const mess = await MessService.updateMess(
      messId,
      {
        name,
        description,
        address,
        mealRate,
        currency,
        managerId,
      },
      req.userId!
    );
    sendSuccess(res, mess, 'Mess updated successfully');
  });

  static removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, userId } = req.params;
    const mess = await MessService.removeMember(messId, userId, req.userId!);
    sendSuccess(res, mess, 'Member removed successfully');
  });
}
