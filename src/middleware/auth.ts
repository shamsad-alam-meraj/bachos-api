import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import User from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Verify user still exists
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    req.userId = decoded.userId;
    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.userId = decoded.userId;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new UnauthorizedError('Insufficient permissions'));
      return;
    }

    next();
  };
};
