import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  phone: { type: String },
  dateOfBirth: { type: Date },
  profileImage: { type: String },
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  // Google OAuth fields
  googleId: { type: String, sparse: true },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  preferences: {
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model('User', userSchema);
