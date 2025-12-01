import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || 'unknown';
  const now = Date.now();

  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + config.rateLimit.windowMs,
    };
    next();
    return;
  }

  if (store[key].count >= config.rateLimit.max) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
    });
    return;
  }

  store[key].count++;
  next();
};

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}, 3600000);
