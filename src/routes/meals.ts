import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { MealController } from '../controllers/MealController';

const router = express.Router();

// Create meal - Only managers can create meals
router.post('/', authMiddleware, MealController.createMeal);

// Bulk create meals - Only managers can create meals
router.post('/bulk', authMiddleware, MealController.bulkCreateMeals);

// Get meal statistics
router.get('/stats/:messId', authMiddleware, MealController.getMealStatistics);

// Calculate meal costs
router.post('/calculate-costs/:messId', authMiddleware, MealController.calculateMealCosts);

// Get user meal summary
router.get('/summary/:messId/:userId', authMiddleware, MealController.getUserMealSummary);

// Get meals with flexible filtering
router.get('/', authMiddleware, MealController.getAllMeals);

// Get meals with flexible filtering (by mess)
router.get('/mess/:messId', authMiddleware, MealController.getMeals);

// Update meal - Only managers can update meals
router.put('/:mealId', authMiddleware, MealController.updateMeal);

// Delete meal - Only managers can delete meals
router.delete('/:mealId', authMiddleware, MealController.deleteMeal);

export default router;
