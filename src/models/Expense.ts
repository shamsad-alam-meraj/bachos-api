import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['food', 'utilities', 'maintenance', 'other'],
    default: 'food',
  },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Expense', expenseSchema);
