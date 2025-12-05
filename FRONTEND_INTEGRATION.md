# BachOS Frontend Integration Guide (Next.js)

## Overview

This guide provides comprehensive information for Next.js developers to integrate with the BachOS API. It includes API endpoints, data models, authentication flows, and best practices for building a modern mess management application using Next.js 14+ with App Router.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Integration Patterns](#integration-patterns)
- [Frontend Architecture](#frontend-architecture)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)

## Quick Start

### 1. Next.js Project Setup

```bash
npx create-next-app@latest bachos-frontend --typescript --tailwind --app
cd bachos-frontend
npm install axios zustand @tanstack/react-query
```

### 2. Environment Setup

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=BachOS
```

### 3. API Client Setup

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

class ApiClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login if on client side
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Initialize token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  // HTTP methods
  get<T = any>(endpoint: string, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(endpoint, config);
  }

  post<T = any>(endpoint: string, data = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(endpoint, data, config);
  }

  put<T = any>(endpoint: string, data = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(endpoint, data, config);
  }

  delete<T = any>(endpoint: string, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(endpoint, config);
  }
}

export const apiClient = new ApiClient();
```

### 3. Authentication Flow

```typescript
// lib/hooks/useAuth.ts
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  messId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiClient.setToken(token);
        const response = await apiClient.get('/api/users/profile');
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      apiClient.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user: userData } = response.data;
      apiClient.setToken(token);
      setUser(userData);

      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Authentication

### JWT Token Management

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Storage

```javascript
// Store token securely
localStorage.setItem('authToken', token);

// Retrieve token
const token = localStorage.getItem('authToken');

// Remove token on logout
localStorage.removeItem('authToken');
```

### Role-Based Access

```javascript
const canManageMess = (user, mess) => {
  return user.role === 'admin' ||
         (user.role === 'manager' && mess.managerId === user.id);
};

const canViewAllUsers = (user) => {
  return user.role === 'admin';
};
```

## API Endpoints

### Authentication Endpoints

```javascript
// Login
const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  });
  return response.data;
};

// Signup
const signup = async (userData) => {
  const response = await apiClient.post('/api/auth/signup', userData);
  return response.data;
};
```

### User Management

```javascript
// Get current user profile
const getProfile = () => apiClient.get('/api/users/profile');

// Update profile
const updateProfile = (data) => apiClient.put('/api/users/profile', data);

// Update preferences
const updatePreferences = (preferences) =>
  apiClient.put('/api/users/preferences', preferences);

// Admin: Search users
const searchUsers = (params) =>
  apiClient.get('/api/users/search', { params });

// Admin: Get user statistics
const getUserStats = () => apiClient.get('/api/users/stats/overview');
```

### Mess Management

```javascript
// Get user's mess
const getMyMess = () => apiClient.get('/api/mess/:messId');

// Update mess
const updateMess = (messId, data) =>
  apiClient.put(`/api/mess/${messId}`, data);

// Add member
const addMember = (messId, email) =>
  apiClient.post(`/api/mess/${messId}/members`, { email });

// Remove member
const removeMember = (messId, userId) =>
  apiClient.delete(`/api/mess/${messId}/members/${userId}`);
```

### Meal Management

```javascript
// Add single meal
const addMeal = (mealData) => apiClient.post('/api/meals', mealData);

// Bulk add meals
const bulkAddMeals = (messId, meals) =>
  apiClient.post('/api/meals/bulk', { messId, meals });

// Get meals with filtering
const getMeals = (params) => apiClient.get('/api/meals', { params });

// Update meal
const updateMeal = (mealId, data) =>
  apiClient.put(`/api/meals/${mealId}`, data);

// Delete meal
const deleteMeal = (mealId) => apiClient.delete(`/api/meals/${mealId}`);
```

### Subscription Management

```javascript
// Get all plans
const getPlans = () => apiClient.get('/api/subscriptions/plans');

// Create subscription
const createSubscription = (data) =>
  apiClient.post('/api/subscriptions', data);

// Get mess subscriptions
const getMessSubscriptions = (messId) =>
  apiClient.get(`/api/subscriptions/mess/${messId}`);

// Cancel subscription
const cancelSubscription = (subscriptionId) =>
  apiClient.put(`/api/subscriptions/${subscriptionId}/cancel`);
```

### AI Features

```javascript
// Generate market schedule
const generateMarketSchedule = (data) =>
  apiClient.post('/api/ai/market-schedule', data);

// Generate meal plan
const generateMealPlan = (prompt) =>
  apiClient.post('/api/ai/meal-plan', { prompt });
```

### Dashboard & Analytics

```javascript
// Get dashboard data
const getDashboard = (messId) =>
  apiClient.get(`/api/dashboard/${messId}`);

// Get analytics
const getAnalytics = (messId, params) =>
  apiClient.get(`/api/analytics/${messId}`, { params });

// Generate reports
const generateReport = (messId, params) =>
  apiClient.get(`/api/reports/${messId}`, { params });
```

## Data Models

### User Model

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  phone?: string;
  dateOfBirth?: Date;
  profileImage?: string;
  messId?: string;
  isDeleted: boolean;
  preferences: {
    notifications: boolean;
    language: string;
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Mess Model

```typescript
interface Mess {
  id: string;
  name: string;
  description?: string;
  address?: string;
  managerId: string;
  members: User[];
  mealRate: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Meal Model

```typescript
interface Meal {
  id: string;
  messId: string;
  userId: User;
  breakfast: number;
  lunch: number;
  dinner: number;
  date: Date;
  status: 'taken' | 'skipped' | 'guest' | 'offday';
  isGuest?: boolean;
  guestName?: string;
  mealType: 'regular' | 'offday' | 'holiday';
  preferences?: {
    vegetarian: boolean;
    spicy: boolean;
    notes?: string;
  };
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription Model

```typescript
interface Subscription {
  id: string;
  messId: string;
  planId: Plan;
  couponId?: Coupon;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  paymentMethod: 'sslcommerz' | 'stripe' | 'bank_transfer' | 'cash';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration Patterns

### State Management with Zustand

```typescript
// lib/stores/mess.ts
import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

interface MessState {
  currentMess: any;
  members: any[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchMess: (messId: string) => Promise<void>;
  addMember: (email: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
}

export const useMessStore = create<MessState>((set, get) => ({
  currentMess: null,
  members: [],
  loading: false,
  error: null,

  fetchMess: async (messId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/api/mess/${messId}`);
      set({
        currentMess: response.data,
        members: response.data.members,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || 'Failed to fetch mess'
      });
      throw error;
    }
  },

  addMember: async (email: string) => {
    const { currentMess } = get();
    if (!currentMess) return;

    try {
      await apiClient.post(`/api/mess/${currentMess.id}/members`, { email });
      // Refetch mess data to get updated members
      await get().fetchMess(currentMess.id);
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to add member' });
      throw error;
    }
  },

  removeMember: async (userId: string) => {
    const { currentMess } = get();
    if (!currentMess) return;

    try {
      await apiClient.delete(`/api/mess/${currentMess.id}/members/${userId}`);
      // Refetch mess data to get updated members
      await get().fetchMess(currentMess.id);
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to remove member' });
      throw error;
    }
  }
}));
```

### Custom Hooks with TanStack Query

```typescript
// lib/hooks/useMeals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface MealFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Fetch meals with React Query
export const useMeals = (messId: string, filters: MealFilters = {}) => {
  return useQuery({
    queryKey: ['meals', messId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        messId,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        )
      });

      const response = await apiClient.get(`/api/meals?${params}`);
      return response.data;
    },
    enabled: !!messId,
  });
};

// Add single meal mutation
export const useAddMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealData: any) => {
      const response = await apiClient.post('/api/meals', mealData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch meals
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};

// Bulk add meals mutation
export const useBulkAddMeals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messId, meals }: { messId: string; meals: any[] }) => {
      const response = await apiClient.post('/api/meals/bulk', { messId, meals });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};

// Update meal mutation
export const useUpdateMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, data }: { mealId: string; data: any }) => {
      const response = await apiClient.put(`/api/meals/${mealId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};

// Delete meal mutation
export const useDeleteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string) => {
      await apiClient.delete(`/api/meals/${mealId}`);
      return mealId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};
```

### Form Handling

```javascript
// src/components/AddMealForm.js
import { useState } from 'react';
import { apiClient } from '../api/client';

export const AddMealForm = ({ messId, members, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meals: members.map(member => ({
      userId: member.id,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      status: 'taken',
      mealType: 'regular'
    }))
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/api/meals/bulk', {
        messId,
        meals: formData.meals.filter(meal =>
          meal.breakfast > 0 || meal.lunch > 0 || meal.dinner > 0
        )
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to add meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (userId, field, value) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map(meal =>
        meal.userId === userId
          ? { ...meal, [field]: value }
          : meal
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form implementation */}
    </form>
  );
};
```

## Frontend Architecture

### Next.js Component Structure

```
app/                                    # Next.js App Router
├── globals.css                        # Global styles
├── layout.tsx                         # Root layout
├── loading.tsx                        # Global loading UI
├── page.tsx                           # Landing page
├── auth/
│   ├── login/
│   │   └── page.tsx                   # Login page
│   └── signup/
│       └── page.tsx                   # Signup page
└── dashboard/
    ├── layout.tsx                     # Dashboard layout
    ├── page.tsx                       # Dashboard home
    ├── meals/
    │   └── page.tsx                   # Meals page
    ├── expenses/
    │   └── page.tsx                   # Expenses page
    ├── members/
    │   └── page.tsx                   # Members page
    ├── analytics/
    │   └── page.tsx                   # Analytics page
    ├── reports/
    │   └── page.tsx                   # Reports page
    ├── profile/
    │   └── page.tsx                   # Profile page
    └── settings/
        └── page.tsx                   # Settings page

components/                             # Reusable components
├── ui/                                # UI components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── form.tsx
├── forms/                             # Form components
│   ├── MealForm.tsx
│   ├── ExpenseForm.tsx
│   ├── MemberForm.tsx
│   └── ProfileForm.tsx
├── dashboard/                         # Dashboard-specific components
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── StatsCard.tsx
│   └── DataTable.tsx
├── charts/                            # Chart components
│   ├── MealChart.tsx
│   ├── ExpenseChart.tsx
│   └── AnalyticsChart.tsx
└── layout/                            # Layout components
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── EmptyState.tsx

lib/                                   # Utility libraries
├── hooks/                             # Custom hooks
│   ├── useAuth.ts
│   ├── useMeals.ts
│   ├── useExpenses.ts
│   ├── useMembers.ts
│   ├── useAnalytics.ts
│   └── useSubscription.ts
├── stores/                            # State management (Zustand)
│   ├── auth.ts
│   ├── mess.ts
│   ├── ui.ts
│   └── subscription.ts
├── api/                               # API utilities
│   ├── client.ts
│   └── endpoints.ts
├── utils/                             # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── dateUtils.ts
├── validations/                       # Form validations (Zod)
│   ├── meal.ts
│   ├── expense.ts
│   └── user.ts
└── types/                             # TypeScript types
    ├── api.ts
    ├── user.ts
    ├── mess.ts
    └── meal.ts
```

### Next.js App Router Structure

```
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Landing page (/)
├── auth/
│   ├── login/
│   │   └── page.tsx             # Login page (/auth/login)
│   └── signup/
│       └── page.tsx             # Signup page (/auth/signup)
├── dashboard/
│   ├── layout.tsx               # Dashboard layout with sidebar
│   ├── page.tsx                 # Dashboard home (/dashboard)
│   ├── meals/
│   │   └── page.tsx             # Meals page (/dashboard/meals)
│   ├── expenses/
│   │   └── page.tsx             # Expenses page (/dashboard/expenses)
│   ├── members/
│   │   └── page.tsx             # Members page (/dashboard/members)
│   ├── analytics/
│   │   └── page.tsx             # Analytics page (/dashboard/analytics)
│   ├── reports/
│   │   └── page.tsx             # Reports page (/dashboard/reports)
│   ├── profile/
│   │   └── page.tsx             # Profile page (/dashboard/profile)
│   └── settings/
│       └── page.tsx             # Settings page (/dashboard/settings)
└── loading.tsx                   # Global loading UI
```

```typescript
// app/layout.tsx
import { AuthProvider } from '@/lib/hooks/useAuth';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

```typescript
// app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

```typescript
// components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  RestaurantIcon,
  ReceiptIcon,
  PeopleIcon,
  AnalyticsIcon,
  ReportIcon,
  PersonIcon,
  SettingsIcon
} from '@/components/icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Meals', href: '/dashboard/meals', icon: RestaurantIcon },
  { name: 'Expenses', href: '/dashboard/expenses', icon: ReceiptIcon },
  { name: 'Members', href: '/dashboard/members', icon: PeopleIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: AnalyticsIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ReportIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: PersonIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-gray-800 text-white">
      <div className="p-4">
        <h2 className="text-xl font-bold">BachOS</h2>
      </div>
      <ul className="space-y-2 p-4">
        {navigation.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                pathname === item.href
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

## Error Handling

### Global Error Handler

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return 'Invalid request data';
      case 401:
        // Token expired, redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'Resource not found';
      case 409:
        return 'This action conflicts with existing data';
      case 429:
        return 'Too many requests. Please try again later.';
      default:
        return data.error || 'An unexpected error occurred';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return 'An unexpected error occurred';
  }
};
```

### Error Boundary

```javascript
// src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Performance Optimization

### API Response Caching

```javascript
// src/hooks/useApiCache.js
import { useState, useEffect } from 'react';

const cache = new Map();

export const useApiCache = (key, fetcher, ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    fetcher()
      .then(result => {
        setData(result);
        cache.set(key, { data: result, timestamp: Date.now() });
        setError(null);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key, fetcher, ttl]);

  const invalidate = () => {
    cache.delete(key);
  };

  return { data, loading, error, invalidate };
};
```

### Infinite Scroll for Lists

```javascript
// src/hooks/useInfiniteScroll.js
import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (fetcher, initialParams = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetcher({
        ...initialParams,
        page,
        limit: 20
      });

      const newItems = response.data;
      const pagination = response.pagination;

      setItems(prev => [...prev, ...newItems]);
      setHasMore(page < pagination.totalPages);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, initialParams, page, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    reset
  };
};
```

### Real-time Updates

```javascript
// src/hooks/useRealtime.js
import { useEffect, useRef } from 'react';

export const useRealtime = (endpoint, onMessage) => {
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const wsUrl = `ws://localhost:4000${endpoint}?token=${token}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    wsRef.current.onclose = () => {
      // Reconnect logic
      setTimeout(() => {
        // Reconnect
      }, 5000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [endpoint, onMessage]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage };
};
```

## Page Specifications

### Public Pages

#### Landing Page (/)
- **Hero section** with app overview and key features
- **Feature highlights** (meal tracking, expense management, analytics)
- **Pricing plans** display
- **Call-to-action** buttons for signup/login
- **Testimonials** or social proof
- **Footer** with links and contact info

#### Login (/auth/login)
- **Email/password** form fields
- **Remember me** checkbox
- **Forgot password** link
- **Social login** options (optional)
- **Link to signup** page

#### Signup (/auth/signup)
- **Registration form** (name, email, password, confirm password)
- **Terms and conditions** checkbox
- **Link to login** page
- **Email verification** notice after signup

### Protected Pages (/dashboard/*)

#### Dashboard (/dashboard)
- **Key metrics cards** (total meals, expenses, members, balance)
- **Recent activities** feed
- **Quick actions** (add meal, add expense, view reports)
- **Charts overview** (meal trends, expense breakdown)
- **Notifications/alerts** (low balance, pending approvals)

#### Meals (/dashboard/meals)
- **Meal calendar view** with date picker
- **Bulk meal entry** form for multiple members
- **Individual meal entry** for single member
- **Meal history** with filtering and search
- **Meal statistics** (taken vs skipped, guest meals)
- **Export functionality** for meal reports

#### Expenses (/dashboard/expenses)
- **Expense entry form** with categories
- **Expense list** with filtering and pagination
- **Receipt upload** functionality
- **Expense approval workflow** (if applicable)
- **Category-wise breakdown** charts
- **Monthly expense trends**

#### Members (/dashboard/members)
- **Member list** with search and filtering
- **Add new member** functionality
- **Member roles management** (user/manager)
- **Member activity tracking**
- **Bulk member operations** (import/export)
- **Member statistics** and contributions

#### Analytics (/dashboard/analytics)
- **Interactive charts** (meal trends, expense analysis)
- **Financial insights** and forecasting
- **Member contribution analysis**
- **Cost per meal calculations**
- **Custom date range** selection
- **Export analytics** reports

#### Reports (/dashboard/reports)
- **Monthly settlement** reports
- **Member-wise** contribution reports
- **Expense categorization** reports
- **Meal attendance** reports
- **Custom report builder**
- **PDF/Excel export** functionality

#### Profile (/dashboard/profile)
- **Personal information** editing
- **Profile picture** upload
- **Password change** functionality
- **Notification preferences**
- **Account settings** (language, theme)

#### Settings (/dashboard/settings)
- **Mess configuration** (name, meal rate, currency)
- **Subscription management** (view current plan, upgrade/downgrade)
- **AI settings** (market schedule preferences)
- **Data management** (export, backup)
- **Danger zone** (delete mess, transfer ownership)

## UI/UX Design Suggestions

### Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ Header (Logo, User Menu, Notifications)         │
├─────────────────────────────────────────────────┤
│ Sidebar (Navigation) │ Main Content Area         │
│                      │                           │
│ • Dashboard          │ ┌─────────────────────┐ │
│ • Meals              │ │ Today's Meals       │ │
│ • Expenses           │ │ ├─────────┬─────────┤ │
│ • Members            │ │ │Taken    │Skipped  │ │
│ • Analytics          │ │ ├─────────┼─────────┤ │
│ • Reports            │ │ │15/20    │5/20     │ │
│ • Profile            │ └─────────────────────┘ │
│ • Settings           │                           │
│                      │ ┌─────────────────────┐ │
│                      │ │ Recent Expenses     │ │
│                      │ │ • Grocery - ৳500   │ │
│                      │ │ • Utilities - ৳300 │ │
│                      │ │ • Maintenance-৳200 │ │
│                      │ └─────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Navigation Structure

```javascript
// src/components/layout/Sidebar.js
const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Meals', href: '/dashboard/meals', icon: RestaurantIcon },
    { name: 'Expenses', href: '/dashboard/expenses', icon: ReceiptIcon },
    { name: 'Members', href: '/dashboard/members', icon: PeopleIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: AnalyticsIcon },
    { name: 'Reports', href: '/dashboard/reports', icon: ReportIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: PersonIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <nav className="sidebar">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''}`
          }
        >
          <item.icon className="nav-icon" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
};
```

### Meal Entry Interface

```javascript
// Bulk meal entry component
const BulkMealEntry = ({ members, date }) => {
  const [meals, setMeals] = useState(
    members.map(member => ({
      userId: member.id,
      name: member.name,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      status: 'taken'
    }))
  );

  return (
    <div className="bulk-meal-entry">
      <h3>Add Meals for {date}</h3>
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Breakfast</th>
            <th>Lunch</th>
            <th>Dinner</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal, index) => (
            <tr key={meal.userId}>
              <td>{meal.name}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={meal.breakfast}
                  onChange={(e) => updateMeal(index, 'breakfast', e.target.value)}
                />
              </td>
              {/* Similar inputs for lunch, dinner */}
              <td>
                <select
                  value={meal.status}
                  onChange={(e) => updateMeal(index, 'status', e.target.value)}
                >
                  <option value="taken">Taken</option>
                  <option value="skipped">Skipped</option>
                  <option value="guest">Guest</option>
                  <option value="offday">Off Day</option>
                </select>
              </td>
              <td>{meal.breakfast + meal.lunch + meal.dinner}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={saveMeals}>Save All Meals</button>
    </div>
  );
};
```

### Subscription Management UI

```javascript
const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    apiClient.get('/api/subscriptions/plans')
      .then(response => setPlans(response.data));
  }, []);

  const handleSubscribe = async (planId, couponCode) => {
    try {
      const response = await apiClient.post('/api/subscriptions', {
        messId: currentMess.id,
        planId,
        couponCode,
        paymentMethod: 'sslcommerz'
      });

      // Redirect to payment gateway
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  return (
    <div className="subscription-plans">
      {plans.map(plan => (
        <div key={plan.id} className="plan-card">
          <h3>{plan.name}</h3>
          <p>{plan.description}</p>
          <ul>
            {plan.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <div className="price">
            ৳{plan.price}/{plan.planType}
          </div>
          <button onClick={() => setSelectedPlan(plan)}>
            Subscribe
          </button>
        </div>
      ))}

      {selectedPlan && (
        <SubscriptionModal
          plan={selectedPlan}
          onSubscribe={handleSubscribe}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
};
```

## Page-Specific API Integration

### Dashboard Page (/dashboard)

```javascript
// Load dashboard data
const loadDashboard = async () => {
  const [dashboardData, recentMeals, recentExpenses] = await Promise.all([
    apiClient.get('/api/dashboard/:messId'),
    apiClient.get('/api/meals', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } }),
    apiClient.get('/api/expenses', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } })
  ]);

  return {
    stats: dashboardData.data,
    recentMeals: recentMeals.data.meals,
    recentExpenses: recentExpenses.data.expenses
  };
};
```

### Meals Page (/dashboard/meals)

```javascript
// Load meals for current month
const loadMeals = async (date = new Date()) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return await apiClient.get('/api/meals', {
    params: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 100
    }
  });
};

// Bulk add meals
const bulkAddMeals = async (meals) => {
  return await apiClient.post('/api/meals/bulk', {
    messId: currentMess.id,
    meals
  });
};
```

### Expenses Page (/dashboard/expenses)

```javascript
// Load expenses with filtering
const loadExpenses = async (filters = {}) => {
  return await apiClient.get('/api/expenses', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 20,
      category: filters.category || 'all',
      startDate: filters.startDate,
      endDate: filters.endDate
    }
  });
};

// Add new expense
const addExpense = async (expenseData) => {
  return await apiClient.post('/api/expenses', {
    ...expenseData,
    messId: currentMess.id
  });
};
```

### Members Page (/dashboard/members)

```javascript
// Load mess members
const loadMembers = async () => {
  const messData = await apiClient.get(`/api/mess/${currentMess.id}`);
  return messData.data.members;
};

// Add new member
const addMember = async (email) => {
  return await apiClient.post(`/api/mess/${currentMess.id}/members`, { email });
};

// Remove member
const removeMember = async (userId) => {
  return await apiClient.delete(`/api/mess/${currentMess.id}/members/${userId}`);
};
```

### Analytics Page (/dashboard/analytics)

```javascript
// Load analytics data
const loadAnalytics = async (dateRange = {}) => {
  return await apiClient.get(`/api/analytics/${currentMess.id}`, {
    params: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }
  });
};
```

### Reports Page (/dashboard/reports)

```javascript
// Generate monthly report
const generateMonthlyReport = async (month, year) => {
  return await apiClient.get(`/api/reports/${currentMess.id}`, {
    params: {
      type: 'monthly',
      month,
      year
    }
  });
};
```

### Settings Page (/dashboard/settings)

```javascript
// Load current subscription
const loadSubscription = async () => {
  const subscriptions = await apiClient.get(`/api/subscriptions/mess/${currentMess.id}`);
  return subscriptions.data[0]; // Get active subscription
};

// Update mess settings
const updateMessSettings = async (settings) => {
  return await apiClient.put(`/api/mess/${currentMess.id}`, settings);
};

// Load available plans
const loadPlans = async () => {
  return await apiClient.get('/api/subscriptions/plans');
};
```

## Data Flow Patterns

### Real-time Updates

```javascript
// WebSocket connection for real-time updates
const useRealtimeUpdates = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:4000?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_expense') {
        setNotifications(prev => [...prev, data]);
      }
    };

    return () => ws.close();
  }, [token]);

  return notifications;
};
```

### Optimistic Updates

```javascript
// Optimistic UI updates for better UX
const addMealOptimistic = async (mealData) => {
  const tempId = Date.now().toString();

  // Add to UI immediately
  setMeals(prev => [...prev, { ...mealData, id: tempId, isPending: true }]);

  try {
    const response = await apiClient.post('/api/meals', mealData);
    // Replace temp item with real data
    setMeals(prev =>
      prev.map(meal =>
        meal.id === tempId ? { ...response.data, isPending: false } : meal
      )
    );
  } catch (error) {
    // Remove temp item on error
    setMeals(prev => prev.filter(meal => meal.id !== tempId));
    throw error;
  }
};
```

This comprehensive integration guide provides everything a Next.js developer needs to build a modern, efficient mess management application with the BachOS API. The patterns and examples shown here leverage Next.js 14+ App Router, TypeScript, TanStack Query, Zustand, and modern React patterns to provide a solid foundation for building scalable applications.

## Next.js-Specific Benefits

- **Server-Side Rendering**: Optimized initial page loads and SEO
- **App Router**: File-based routing with nested layouts
- **Server Components**: Efficient data fetching and rendering
- **Client Components**: Interactive features where needed
- **TypeScript**: Full type safety across the application
- **Middleware**: Route protection and authentication
- **API Routes**: Backend functionality within the Next.js app (optional)

## Recommended Tech Stack

```json
{
  "framework": "Next.js 14+ (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "ui": "shadcn/ui + Radix UI",
  "state": "Zustand",
  "data": "TanStack Query (React Query)",
  "forms": "React Hook Form + Zod",
  "http": "Axios",
  "charts": "Recharts",
  "icons": "Lucide React"
}
```

Your Next.js frontend developer can now implement the complete BachOS mess management system using these modern patterns and the comprehensive API integration examples provided! 🚀