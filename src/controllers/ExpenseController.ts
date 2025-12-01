import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { ExpenseService } from '../services/ExpenseService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendNoContent, sendSuccess } from '../utils/response';

export class ExpenseController {
  static createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, description, amount, category, expensedBy, date } = req.body;
    const expense = await ExpenseService.createExpense(
      messId,
      { description, amount, category, expensedBy, date },
      req.userId!
    );
    sendSuccess(res, expense, 'Expense created successfully', 201);
  });

  static getExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId } = req.params;
    const { startDate, endDate, category, userId } = req.query as any;
    const expenses = await ExpenseService.getExpenses(messId, {
      startDate,
      endDate,
      category,
      userId,
    });
    sendSuccess(res, expenses);
  });

  static updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { expenseId } = req.params;
    const { description, amount, category, expensedBy, date } = req.body;
    const expense = await ExpenseService.updateExpense(
      expenseId,
      { description, amount, category, expensedBy, date },
      req.userId!
    );
    sendSuccess(res, expense, 'Expense updated successfully');
  });

  static deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { expenseId } = req.params;
    await ExpenseService.deleteExpense(expenseId, req.userId!);
    sendNoContent(res);
  });
}
