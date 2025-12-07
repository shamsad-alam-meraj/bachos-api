import Plan from '../models/Plan';
import Coupon from '../models/Coupon';
import Subscription from '../models/Subscription';
import Mess from '../models/Mess';
import { PaymentService, PaymentData } from './PaymentService';
import { ApiError } from '../utils/errors';

export interface CreateSubscriptionData {
  messId: string;
  planId: string;
  couponCode?: string;
  paymentMethod: 'sslcommerz' | 'stripe' | 'bank_transfer' | 'cash';
  autoRenew?: boolean;
}

export interface SubscriptionWithDetails {
  _id: string;
  messId: any;
  planId: any;
  couponId?: any;
  startDate: Date;
  endDate: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  autoRenew: boolean;
  paymentData?: any;
  createdAt: Date;
  updatedAt: Date;
  plan: any;
  coupon?: any;
  mess: any;
}

export class SubscriptionService {
  static async createSubscription(
    userId: string,
    data: CreateSubscriptionData
  ): Promise<SubscriptionWithDetails> {
    // Validate mess exists and user is manager
    const mess = await Mess.findById(data.messId);
    if (!mess) {
      throw new ApiError('Mess not found', 404);
    }

    if (mess.managerId.toString() !== userId) {
      throw new ApiError('Only mess manager can create subscriptions', 403);
    }

    // Get plan details
    const plan = await Plan.findById(data.planId);
    if (!plan || !plan.isActive) {
      throw new ApiError('Plan not found or inactive', 404);
    }

    // Check if mess already has active subscription
    const existingSubscription = await Subscription.findOne({
      messId: data.messId,
      status: 'active',
    });

    if (existingSubscription) {
      throw new ApiError('Mess already has an active subscription', 400);
    }

    let discountAmount = 0;
    let coupon: InstanceType<typeof Coupon> | null = null;

    // Validate and apply coupon if provided
    if (data.couponCode) {
      coupon = await Coupon.findOne({
        code: data.couponCode.toUpperCase(),
        isActive: true,
      });

      if (!coupon) {
        throw new ApiError('Invalid or expired coupon', 400);
      }

      // Check if coupon is applicable to this plan
      if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(plan._id)) {
        throw new ApiError('Coupon not applicable to this plan', 400);
      }

      // Check usage limits
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new ApiError('Coupon usage limit exceeded', 400);
      }

      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discountAmount = (plan.price * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }

      discountAmount = Math.min(discountAmount, plan.price);
    }

    const finalAmount = Math.max(0, plan.price - discountAmount);

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    // Create subscription
    const subscription = new Subscription({
      messId: data.messId,
      planId: data.planId,
      couponId: coupon?._id,
      startDate,
      endDate,
      paymentMethod: data.paymentMethod,
      amount: plan.price,
      discountAmount,
      finalAmount,
      currency: plan.currency,
      autoRenew: data.autoRenew || false,
    });

    await subscription.save();

    // Update coupon usage
    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save();
    }

    // Process payment if amount > 0
    if (finalAmount > 0) {
      const paymentData: PaymentData = {
        amount: finalAmount,
        currency: plan.currency,
        description: `Subscription for ${plan.name} plan`,
        customerEmail: '', // Would need to get from user
        customerName: mess.name,
        metadata: {
          subscriptionId: subscription._id,
          planId: plan._id,
          messId: mess._id,
        },
      };

      let paymentResult;
      if (data.paymentMethod === 'sslcommerz') {
        paymentResult = await PaymentService.processSSLCommerzPayment(paymentData);
      } else if (data.paymentMethod === 'stripe') {
        paymentResult = await PaymentService.processStripePayment(paymentData);
      } else {
        // For bank_transfer and cash, mark as pending
        paymentResult = { success: true, transactionId: `manual_${Date.now()}` };
      }

      if (!paymentResult.success) {
        // Delete subscription if payment failed
        await Subscription.findByIdAndDelete(subscription._id);
        throw new ApiError('Payment processing failed', 400);
      }

      subscription.transactionId = paymentResult.transactionId;
      subscription.paymentData = paymentResult.data;
      await subscription.save();
    } else {
      // Free subscription
      subscription.status = 'active';
      subscription.paymentStatus = 'completed';
      await subscription.save();
    }

    return await this.getSubscriptionWithDetails(subscription._id.toString());
  }

  static async getSubscriptionWithDetails(
    subscriptionId: string
  ): Promise<SubscriptionWithDetails> {
    const subscription = await Subscription.findById(subscriptionId)
      .populate('planId')
      .populate('couponId')
      .populate('messId');

    if (!subscription) {
      throw new ApiError('Subscription not found', 404);
    }

    return subscription as any;
  }

  static async getMessSubscriptions(messId: string): Promise<SubscriptionWithDetails[]> {
    const subscriptions = await Subscription.find({ messId })
      .populate('planId')
      .populate('couponId')
      .populate('messId')
      .sort({ createdAt: -1 });

    return subscriptions as any;
  }

  static async cancelSubscription(subscriptionId: string, userId: string): Promise<void> {
    const subscription = await Subscription.findById(subscriptionId).populate('messId');
    if (!subscription) {
      throw new ApiError('Subscription not found', 404);
    }

    const mess = subscription.messId as any;
    if (mess.managerId.toString() !== userId) {
      throw new ApiError('Only mess manager can cancel subscriptions', 403);
    }

    subscription.status = 'cancelled';
    await subscription.save();
  }

  static async renewSubscription(
    subscriptionId: string,
    userId: string
  ): Promise<SubscriptionWithDetails> {
    const subscription = await Subscription.findById(subscriptionId).populate('planId');
    if (!subscription) {
      throw new ApiError('Subscription not found', 404);
    }

    const mess = await Mess.findById(subscription.messId);
    if (mess?.managerId.toString() !== userId) {
      throw new ApiError('Only mess manager can renew subscriptions', 403);
    }

    const plan = subscription.planId as any;
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + plan.duration);

    subscription.endDate = newEndDate;
    subscription.status = 'active';
    await subscription.save();

    return await this.getSubscriptionWithDetails(subscriptionId);
  }
}
