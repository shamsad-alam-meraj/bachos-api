import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { MealService } from '../services/MealService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendNoContent, sendSuccess } from '../utils/response';

export class MealController {
  static createMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, userId, breakfast, lunch, dinner, date } = req.body;
    const meal = await MealService.createMeal(
      messId,
      userId,
      { userId, breakfast, lunch, dinner, date },
      req.userId!
    );
    sendSuccess(res, meal, 'Meal created successfully', 201);
  });

  static getMeals = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { year, month, startDate, endDate, userId } = req.query as any;
    const messId = req.params.messId;
    const meals = await MealService.getMeals(messId, { year, month, startDate, endDate, userId });
    sendSuccess(res, meals);
  });

  static getAllMeals = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, userId, startDate, endDate, page, limit } = req.query as any;
    const result = await MealService.getAllMeals(req.userId!, {
      messId,
      userId,
      startDate,
      endDate,
      page,
      limit,
    });
    sendSuccess(res, result);
  });

  static updateMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { breakfast, lunch, dinner, date } = req.body;
    const mealId = req.params.mealId;
    const meal = await MealService.updateMeal(
      mealId,
      { breakfast, lunch, dinner, date },
      req.userId!
    );
    sendSuccess(res, meal, 'Meal updated successfully');
  });

  static deleteMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const mealId = req.params.mealId;
    await MealService.deleteMeal(mealId, req.userId!);
    sendNoContent(res);
  });
}
