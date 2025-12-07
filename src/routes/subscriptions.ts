import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Plan routes (Admin only)
router.get('/plans', SubscriptionController.getPlans);
router.post('/plans', requireRole('admin'), SubscriptionController.createPlan);
router.put('/plans/:id', requireRole('admin'), SubscriptionController.updatePlan);
router.delete('/plans/:id', requireRole('admin'), SubscriptionController.deletePlan);

// Coupon routes (Admin only)
router.get('/coupons', SubscriptionController.getCoupons);
router.post('/coupons', requireRole('admin'), SubscriptionController.createCoupon);
router.put('/coupons/:id', requireRole('admin'), SubscriptionController.updateCoupon);
router.delete('/coupons/:id', requireRole('admin'), SubscriptionController.deleteCoupon);

// Subscription routes
router.post('/', SubscriptionController.createSubscription);
router.get('/mess/:messId', SubscriptionController.getMessSubscriptions);
router.get('/:id', SubscriptionController.getSubscription);
router.put('/:id/cancel', SubscriptionController.cancelSubscription);
router.put('/:id/renew', SubscriptionController.renewSubscription);

export default router;
