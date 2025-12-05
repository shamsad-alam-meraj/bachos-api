import { Response } from 'express';
import Coupon from '../models/Coupon';
import Plan from '../models/Plan';
import { CreateSubscriptionData, SubscriptionService } from '../services/SubscriptionService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class SubscriptionController {
  // Get all plans
  static getPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
    const plans = await Plan.find({ isActive: true }).sort({ createdAt: -1 });
    sendSuccess(res, plans, 'Plans retrieved successfully');
  });

  // Create a new plan (Admin only)
  static createPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, maxMembers, planType, duration, price, currency, features } =
      req.body;

    // Validate plan type and set appropriate duration
    let actualDuration = duration;
    if (planType === 'monthly') {
      actualDuration = 1;
    } else if (planType === 'yearly') {
      actualDuration = 12;
    }

    const plan = new Plan({
      name,
      description,
      maxMembers,
      planType,
      duration: actualDuration,
      price,
      currency: currency || 'BDT',
      features: features || [],
      createdBy: req.user?.id,
    });

    await plan.save();
    sendSuccess(res, plan, 'Plan created successfully', 201);
  });

  // Update plan (Admin only)
  static updatePlan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const plan = await Plan.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) {
      return sendSuccess(res, null, 'Plan not found', 404);
    }

    sendSuccess(res, plan, 'Plan updated successfully');
  });

  // Delete plan (Admin only)
  static deletePlan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const plan = await Plan.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!plan) {
      return sendSuccess(res, null, 'Plan not found', 404);
    }

    sendSuccess(res, null, 'Plan deactivated successfully');
  });

  // Get all coupons
  static getCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
    const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
    sendSuccess(res, coupons, 'Coupons retrieved successfully');
  });

  // Create coupon (Admin only)
  static createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      applicablePlans,
    } = req.body;

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      applicablePlans: applicablePlans || [],
      createdBy: req.user?.id,
    });

    await coupon.save();
    sendSuccess(res, coupon, 'Coupon created successfully', 201);
  });

  // Update coupon (Admin only)
  static updateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) {
      return sendSuccess(res, null, 'Coupon not found', 404);
    }

    sendSuccess(res, coupon, 'Coupon updated successfully');
  });

  // Delete coupon (Admin only)
  static deleteCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!coupon) {
      return sendSuccess(res, null, 'Coupon not found', 404);
    }

    sendSuccess(res, null, 'Coupon deactivated successfully');
  });

  // Create subscription
  static createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const subscriptionData: CreateSubscriptionData = req.body;
    const subscription = await SubscriptionService.createSubscription(
      req.user!.id,
      subscriptionData
    );
    sendSuccess(res, subscription, 'Subscription created successfully', 201);
  });

  // Get mess subscriptions
  static getMessSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messId } = req.params;
    const subscriptions = await SubscriptionService.getMessSubscriptions(messId);
    sendSuccess(res, subscriptions, 'Subscriptions retrieved successfully');
  });

  // Get subscription details
  static getSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const subscription = await SubscriptionService.getSubscriptionWithDetails(id);
    sendSuccess(res, subscription, 'Subscription retrieved successfully');
  });

  // Cancel subscription
  static cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await SubscriptionService.cancelSubscription(id, req.user!.id);
    sendSuccess(res, null, 'Subscription cancelled successfully');
  });

  // Renew subscription
  static renewSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const subscription = await SubscriptionService.renewSubscription(id, req.user!.id);
    sendSuccess(res, subscription, 'Subscription renewed successfully');
  });
}
