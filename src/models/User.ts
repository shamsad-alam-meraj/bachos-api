import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  profileImage: { type: String },
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model('User', userSchema);
