import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  breakfast: { type: Number, default: 0 },
  lunch: { type: Number, default: 0 },
  dinner: { type: Number, default: 0 },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['taken', 'skipped', 'guest', 'offday'],
    default: 'taken',
  },
  isGuest: { type: Boolean, default: false },
  guestName: { type: String },
  mealType: {
    type: String,
    enum: ['regular', 'offday', 'holiday'],
    default: 'regular',
  },
  preferences: {
    vegetarian: { type: Boolean, default: false },
    spicy: { type: Boolean, default: false },
    notes: { type: String },
  },
  cost: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Meal', mealSchema);
