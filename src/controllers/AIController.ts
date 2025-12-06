import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { AIService, MarketScheduleRequest } from '../services/AIService';
import Mess from '../models/Mess';

export class AIController {
  // Generate market schedule for rest days
  static generateMarketSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId, prompt, month, year } = req.body;

    // Validate mess exists and user is manager
    const mess = await Mess.findById(messId).populate('members', 'name');
    if (!mess) {
      return sendSuccess(res, null, 'Mess not found', 404);
    }

    if (mess.managerId.toString() !== req.user!.id) {
      return sendSuccess(res, null, 'Only mess manager can generate schedules', 403);
    }

    const memberNames = mess.members.map((member: any) => member.name);

    const scheduleRequest: MarketScheduleRequest = {
      prompt,
      month: parseInt(month),
      year: parseInt(year),
      totalMembers: mess.members.length,
      memberNames,
    };

    const result = await AIService.generateMarketSchedule(scheduleRequest);
    sendSuccess(res, result, 'Market schedule generated successfully');
  });

  // Generate meal plan
  static generateMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prompt } = req.body;

    const mealPlan = await AIService.generateMealPlan(prompt);
    sendSuccess(res, { mealPlan }, 'Meal plan generated successfully');
  });
}
