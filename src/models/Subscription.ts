import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['sslcommerz', 'stripe', 'bank_transfer', 'cash'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: { type: String },
  amount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  currency: { type: String, default: 'BDT' },
  autoRenew: { type: Boolean, default: false },
  paymentData: { type: mongoose.Schema.Types.Mixed }, // Store payment gateway response
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for efficient queries
subscriptionSchema.index({ messId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
