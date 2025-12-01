import Meal from '../models/Meal';
import Mess from '../models/Mess';

export class MealService {
  static async createMeal(
    messId: string,
    userId: string,
    mealData: { userId: string; breakfast: number; lunch: number; dinner: number; date: string },
    requestingUserId: string
  ) {
    // Verify that the mess exists
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if the requesting user is the manager
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can add meals');
    }

    // Verify that the target user belongs to the mess
    const targetUserIsInMess = mess.members.some((memberId) => memberId.toString() === userId);
    if (!targetUserIsInMess) {
      throw new Error('User does not belong to this mess');
    }

    const meal = new Meal({
      messId,
      userId,
      breakfast: mealData.breakfast,
      lunch: mealData.lunch,
      dinner: mealData.dinner,
      date: new Date(mealData.date),
    });

    await meal.save();

    // Populate user info in response
    await meal.populate('userId', 'name email role');

    return meal;
  }

  static async getMeals(
    messId: string,
    filters: {
      year?: string;
      month?: string;
      startDate?: string;
      endDate?: string;
      userId?: string;
    }
  ) {
    let dateFilter: any = {};

    if (filters.startDate && filters.endDate) {
      // Custom date range
      dateFilter = {
        date: {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        },
      };
    } else if (filters.year && filters.month) {
      // Specific month
      const startDate = new Date(Number(filters.year), Number(filters.month) - 1, 1);
      const endDate = new Date(Number(filters.year), Number(filters.month), 0);
      dateFilter = { date: { $gte: startDate, $lte: endDate } };
    }
    // If no date filter provided, return all meals for the mess

    const userFilter = filters.userId && filters.userId !== 'all' ? { userId: filters.userId } : {};

    const meals = await Meal.find({
      messId,
      ...dateFilter,
      ...userFilter,
    }).populate('userId', 'name email role');

    return meals;
  }

  static async updateMeal(
    mealId: string,
    updateData: { breakfast: number; lunch: number; dinner: number; date: string },
    requestingUserId: string
  ) {
    const meal = await Meal.findById(mealId).populate('userId', 'name email');
    if (!meal) {
      throw new Error('Meal not found');
    }

    // Get mess to check permissions
    const mess = await Mess.findById(meal.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can edit meals');
    }

    // Update meal
    meal.breakfast = updateData.breakfast;
    meal.lunch = updateData.lunch;
    meal.dinner = updateData.dinner;
    meal.date = new Date(updateData.date);

    await meal.save();

    return meal;
  }

  static async deleteMeal(mealId: string, requestingUserId: string) {
    const meal = await Meal.findById(mealId);
    if (!meal) {
      throw new Error('Meal not found');
    }

    // Get mess to check permissions
    const mess = await Mess.findById(meal.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Check if user is the manager
    const isManager = mess.managerId.toString() === requestingUserId;
    if (!isManager) {
      throw new Error('Only mess managers can delete meals');
    }

    await Meal.findByIdAndDelete(mealId);
  }
}
