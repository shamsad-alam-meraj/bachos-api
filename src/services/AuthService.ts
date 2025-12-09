import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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

    if (!user.password) {
      throw new Error('Please use Google login for this account');
    }

    if (!user.password) {
      throw new Error('Please use Google login for this account');
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

  static async findOrCreateGoogleUser(profile: any) {
    const { id: googleId, displayName: name, emails } = profile;
    const email = emails[0].value;

    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email });
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.provider = 'google';
        await user.save();
      } else {
        // Create new user
        user = new User({
          name,
          email,
          googleId,
          provider: 'google',
        });
        await user.save();
      }
    }

    const token = (jwt.sign as any)({ userId: user._id.toString() }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: { id: user._id, name: user.name, email: user.email },
    };
  }

  static initializeGoogleStrategy() {
    if (!config.google?.clientId || !config.google?.clientSecret) {
      console.warn('Google OAuth credentials not configured');
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientId,
          clientSecret: config.google.clientSecret,
          callbackURL: config.google.redirectUri || '/api/auth/google/callback',
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const result = await this.findOrCreateGoogleUser(profile);
            done(null, result);
          } catch (error) {
            done(error as Error, null);
          }
        }
      )
    );

    passport.serializeUser((user: any, done: any) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done: any) => {
      done(null, user);
    });
  }
}

// Initialize Google strategy
AuthService.initializeGoogleStrategy();

