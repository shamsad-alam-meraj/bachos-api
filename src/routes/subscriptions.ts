/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription and billing management endpoints
 */

import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get all plans
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of plans
 */
router.get('/plans', SubscriptionController.getPlans);

/**
 * @swagger
 * /api/subscriptions/plans:
 *   post:
 *     summary: Create a new plan (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - maxMembers
 *               - planType
 *               - duration
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Plan name
 *               description:
 *                 type: string
 *                 description: Plan description
 *               maxMembers:
 *                 type: integer
 *                 description: Maximum number of members
 *               planType:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: Plan type
 *               duration:
 *                 type: integer
 *                 description: Duration in months
 *               price:
 *                 type: number
 *                 description: Plan price
 *               currency:
 *                 type: string
 *                 default: BDT
 *                 description: Currency
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Plan features
 *     responses:
 *       201:
 *         description: Plan created
 */
router.post('/plans', requireRole('admin'), SubscriptionController.createPlan);

/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   put:
 *     summary: Update plan (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               maxMembers:
 *                 type: integer
 *               planType:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               duration:
 *                 type: integer
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.put('/plans/:id', requireRole('admin'), SubscriptionController.updatePlan);

/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   delete:
 *     summary: Delete plan (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.delete('/plans/:id', requireRole('admin'), SubscriptionController.deletePlan);

/**
 * @swagger
 * /api/subscriptions/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.get('/coupons', SubscriptionController.getCoupons);

/**
 * @swagger
 * /api/subscriptions/coupons:
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - validFrom
 *               - validUntil
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code
 *               description:
 *                 type: string
 *                 description: Coupon description
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Discount type
 *               discountValue:
 *                 type: number
 *                 description: Discount value
 *               maxUses:
 *                 type: integer
 *                 description: Maximum uses (null for unlimited)
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Valid from date
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: Valid until date
 *               applicablePlans:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Applicable plan IDs (empty for all)
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post('/coupons', requireRole('admin'), SubscriptionController.createCoupon);

/**
 * @swagger
 * /api/subscriptions/coupons/{id}:
 *   put:
 *     summary: Update coupon (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               maxUses:
 *                 type: integer
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *               applicablePlans:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coupon updated
 */
router.put('/coupons/:id', requireRole('admin'), SubscriptionController.updateCoupon);

/**
 * @swagger
 * /api/subscriptions/coupons/{id}:
 *   delete:
 *     summary: Delete coupon (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted
 */
router.delete('/coupons/:id', requireRole('admin'), SubscriptionController.deleteCoupon);

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messId
 *               - planId
 *               - paymentMethod
 *             properties:
 *               messId:
 *                 type: string
 *                 description: Mess ID
 *               planId:
 *                 type: string
 *                 description: Plan ID
 *               couponId:
 *                 type: string
 *                 description: Coupon ID (optional)
 *               paymentMethod:
 *                 type: string
 *                 enum: [sslcommerz, stripe, bank_transfer, cash]
 *                 description: Payment method
 *               autoRenew:
 *                 type: boolean
 *                 default: false
 *                 description: Auto renew subscription
 *     responses:
 *       201:
 *         description: Subscription created
 */
router.post('/', SubscriptionController.createSubscription);

/**
 * @swagger
 * /api/subscriptions/mess/{messId}:
 *   get:
 *     summary: Get subscriptions for a mess
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mess ID
 *     responses:
 *       200:
 *         description: List of subscriptions for the mess
 */
router.get('/mess/:messId', SubscriptionController.getMessSubscriptions);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get subscription details
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/:id', SubscriptionController.getSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}/cancel:
 *   put:
 *     summary: Cancel subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.put('/:id/cancel', SubscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}/renew:
 *   put:
 *     summary: Renew subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription renewed
 */
router.put('/:id/renew', SubscriptionController.renewSubscription);

export default router;
