import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  maxMembers: { type: Number, required: true },
  planType: { type: String, enum: ['monthly', 'yearly'], required: true },
  duration: { type: Number, required: true }, // in months (1 for monthly, 12 for yearly)
  price: { type: Number, required: true },
  currency: { type: String, default: 'BDT' },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Plan', planSchema);
