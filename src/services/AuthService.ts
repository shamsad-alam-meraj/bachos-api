import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env';
import User from '../models/User';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthService {
  static async signup(data: z.infer<typeof signupSchema>) {
    const validatedData = signupSchema.parse(data);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = new User(validatedData);
    await user.save();

    const token = (jwt.sign as any)({ userId: user._id.toString() }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: { id: user._id, name: user.name, email: user.email },
    };
  }

  static async login(data: z.infer<typeof loginSchema>) {
    const validatedData = loginSchema.parse(data);

    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = (jwt.sign as any)({ userId: user._id.toString() }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: { id: user._id, name: user.name, email: user.email },
    };
  }
}
