import type { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  profileImage?: string;
  role: 'user' | 'manager' | 'admin';
  messId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMess extends Document {
  name: string;
  description?: string;
  address?: string;
  managerId: string;
  members: string[];
  mealRate: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMeal extends Document {
  messId: string;
  userId: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  date: Date;
  createdAt: Date;
}

export interface IExpense extends Document {
  messId: string;
  description: string;
  amount: number;
  category: 'food' | 'utilities' | 'maintenance' | 'other';
  addedBy: string;
  expensedBy: string;
  date: Date;
  createdAt: Date;
}

export interface IDeposit extends Document {
  messId: string;
  userId: string;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
