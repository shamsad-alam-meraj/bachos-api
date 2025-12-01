export const USER_ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export const EXPENSE_CATEGORIES = {
  FOOD: 'food',
  UTILITIES: 'utilities',
  MAINTENANCE: 'maintenance',
  OTHER: 'other',
} as const;

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden - insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  DUPLICATE_ENTRY: 'Duplicate entry exists',
  INVALID_TOKEN: 'Invalid or expired token',
  NO_TOKEN: 'No authentication token provided',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  SIGNUP_SUCCESS: 'Signup successful',
} as const;