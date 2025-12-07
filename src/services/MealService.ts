import Meal from '../models/Meal';
import Mess from '../models/Mess';

export class MealService {
  static async createMeal(
    messId: string,
    userId: string,
    mealData: {
      userId: string;
      breakfast: number;
      lunch: number;
      dinner: number;
      date: string;
      status?: string;
      isGuest?: boolean;
      guestName?: string;
      mealType?: string;
      preferences?: any;
    },
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
      status: mealData.status || 'taken',
      isGuest: mealData.isGuest || false,
      guestName: mealData.guestName,
      mealType: mealData.mealType || 'regular',
      preferences: mealData.preferences,
    });

    await meal.save();

    // Populate user info in response
    await meal.populate('userId', 'name email role');

    return meal;
  }

  static async bulkCreateMeals(
    messId: string,
    mealsData: Array<{
      userId: string;
      breakfast: number;
      lunch: number;
      dinner: number;
      date: string;
      status?: string;
      isGuest?: boolean;
      guestName?: string;
      mealType?: string;
      preferences?: any;
    }>,
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

    // Validate all users belong to the mess
    const messMemberIds = mess.members.map((id) => id.toString());
    const invalidUsers = mealsData.filter((meal) => !messMemberIds.includes(meal.userId));

    if (invalidUsers.length > 0) {
      throw new Error(
        `Users do not belong to this mess: ${invalidUsers.map((u) => u.userId).join(', ')}`
      );
    }

    // Check for existing meals on the same date for the same users to avoid duplicates
    const mealDate = new Date(mealsData[0].date);
    const existingMeals = await Meal.find({
      messId,
      userId: { $in: mealsData.map((m) => m.userId) },
      date: {
        $gte: new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate()),
        $lt: new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate() + 1),
      },
    });

    if (existingMeals.length > 0) {
      const existingUserIds = existingMeals.map((m) => m.userId.toString());
      throw new Error(`Meals already exist for users on this date: ${existingUserIds.join(', ')}`);
    }

    // Create meal documents
    const mealDocuments = mealsData.map((mealData) => ({
      messId,
      userId: mealData.userId,
      breakfast: mealData.breakfast,
      lunch: mealData.lunch,
      dinner: mealData.dinner,
      date: new Date(mealData.date),
      status: mealData.status || 'taken',
      isGuest: mealData.isGuest || false,
      guestName: mealData.guestName,
      mealType: mealData.mealType || 'regular',
      preferences: mealData.preferences,
    }));

    // Insert all meals at once
    const insertedMeals = await Meal.insertMany(mealDocuments);

    // Populate user info for all meals
    const populatedMeals = await Meal.find({
      _id: { $in: insertedMeals.map((m) => m._id) },
    }).populate('userId', 'name email role');

    return populatedMeals;
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

  static async getAllMeals(
    requestingUserId: string,
    filters: {
      messId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    }
  ) {
    // Build query
    const query: any = {};

    if (filters.messId) {
      query.messId = filters.messId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    // Pagination
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const skip = (page - 1) * limit;

    const meals = await Meal.find(query)
      .populate('userId', 'name email role')
      .populate('messId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Meal.countDocuments(query);

    return {
      meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  static async getMealStatistics(
    messId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      userId?: string;
    }
  ) {
    const query: any = { messId };

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    if (filters.userId && filters.userId !== 'all') {
      query.userId = filters.userId;
    }

    const meals = await Meal.find(query);

    const stats = {
      totalMeals: meals.length,
      breakfastCount: meals.reduce((sum, meal) => sum + meal.breakfast, 0),
      lunchCount: meals.reduce((sum, meal) => sum + meal.lunch, 0),
      dinnerCount: meals.reduce((sum, meal) => sum + meal.dinner, 0),
      totalMealCount: meals.reduce(
        (sum, meal) => sum + meal.breakfast + meal.lunch + meal.dinner,
        0
      ),
      guestMeals: meals.filter((meal) => meal.isGuest).length,
      skippedMeals: meals.filter((meal) => meal.status === 'skipped').length,
      offdayMeals: meals.filter((meal) => meal.mealType === 'offday').length,
      regularMeals: meals.filter((meal) => meal.mealType === 'regular').length,
      vegetarianMeals: meals.filter((meal) => meal.preferences?.vegetarian).length,
      totalCost: meals.reduce((sum, meal) => sum + (meal.cost || 0), 0),
    };

    return stats;
  }

  static async calculateMealCosts(messId: string, mealRate: number) {
    // Update all meals without cost calculation
    const mealsWithoutCost = await Meal.find({
      messId,
      cost: { $exists: false },
    });

    for (const meal of mealsWithoutCost) {
      const totalMeals = meal.breakfast + meal.lunch + meal.dinner;
      meal.cost = totalMeals * mealRate;
      await meal.save();
    }

    return { updated: mealsWithoutCost.length };
  }

  static async getUserMealSummary(
    messId: string,
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
    }
  ) {
    const query: any = { messId, userId };

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    const meals = await Meal.find(query);

    const summary = {
      totalDays: meals.length,
      totalBreakfast: meals.reduce((sum, meal) => sum + meal.breakfast, 0),
      totalLunch: meals.reduce((sum, meal) => sum + meal.lunch, 0),
      totalDinner: meals.reduce((sum, meal) => sum + meal.dinner, 0),
      totalMeals: meals.reduce((sum, meal) => sum + meal.breakfast + meal.lunch + meal.dinner, 0),
      totalCost: meals.reduce((sum, meal) => sum + (meal.cost || 0), 0),
      skippedDays: meals.filter((meal) => meal.status === 'skipped').length,
      guestMeals: meals.filter((meal) => meal.isGuest).length,
      offDays: meals.filter((meal) => meal.mealType === 'offday').length,
    };

    return summary;
  }
}
