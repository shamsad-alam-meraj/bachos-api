# BachOS API Documentation

## Base URL

```
http://localhost:4000
```

## Root Endpoint

#### GET /

Get API information.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "name": "bachOS API",
    "version": "1.0.0",
    "description": "bachOS meal management system API",
    "documentation": "/api/docs"
  }
}
```

---

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles & Permissions

The API uses a role-based access control system with three user roles:

- **user**: Regular users with basic access
- **manager**: Mess managers who can manage their assigned mess (add/remove members, manage expenses/deposits/meals)
- **admin**: System administrators with full access to all features

### Role Management Rules

- When an admin creates a mess, the selected manager automatically gets the 'manager' role
- Managers retain their 'manager' role for lifetime, even if reassigned to different messes
- Only admins can change mess managers through the mess update endpoint
- Managers can only manage members of their assigned mess
- Admins have access to all system features

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) for web applications. The following origins are allowed:

- **Development**: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`, `http://127.0.0.1:*`
- **Production**: `https://bach-os.vercel.app`

### Frontend Integration

When making requests from your frontend application, ensure you:

1. Include credentials in your requests:
```javascript
fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies/auth
  body: JSON.stringify({ email, password })
});
```

2. Handle CORS preflight requests (automatically handled by browsers for simple requests)

3. If you encounter CORS issues, check that your frontend is running on an allowed port

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-01T00:00:00.000Z",
    "uptime": 123.45,
    "environment": "development"
  }
}
```

---

### Authentication

#### POST /api/auth/signup

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### POST /api/auth/login

Login user.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

---

### Users

#### GET /api/users/search

Search and filter users (requires authentication, admin only).

**Query Parameters:**

- `search` (optional): Search term for name, email, or phone
- `role` (optional): Filter by role (`user`, `manager`, `admin`, or `all`)
- `messId` (optional): Filter by mess ID or `all`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: `createdAt`)
- `sortOrder` (optional): Sort order (`asc` or `desc`, default: `desc`)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "phone": "+1234567890",
        "messId": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Bachelor's Mess"
        },
        "isDeleted": false,
        "preferences": {
          "notifications": true,
          "language": "en",
          "theme": "light"
        },
        "createdAt": "2025-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### GET /api/users/stats/overview

Get user statistics (requires authentication, admin only).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 145,
    "adminUsers": 3,
    "managerUsers": 12,
    "usersWithMess": 130,
    "usersWithoutMess": 15,
    "recentRegistrations": 8
  }
}
```

#### GET /api/users/all

Get all non-admin users (requires authentication, admin only).

**Response:** `200 OK`

#### GET /api/users/all-users

Get all users including admins (requires authentication, admin only).

**Response:** `200 OK`

#### GET /api/users/admins

Get all admin users (requires authentication, admin only).

**Response:** `200 OK`

#### GET /api/users/profile

Get current user profile (requires authentication).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "profileImage": "https://example.com/image.jpg",
    "messId": "507f1f77bcf86cd799439012",
    "preferences": {
      "notifications": true,
      "language": "en",
      "theme": "light"
    },
    "isDeleted": false
  }
}
```

#### PUT /api/users/profile

Update current user profile (requires authentication).

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "profileImage": "https://example.com/image.jpg"
}
```

**Response:** `200 OK`

#### PUT /api/users/preferences

Update user preferences (requires authentication).

**Request Body:**

```json
{
  "notifications": true,
  "language": "en",
  "theme": "dark"
}
```

**Response:** `200 OK`

#### GET /api/users/:id

Get user by ID (requires authentication, admin or self).

**Response:** `200 OK`

#### PUT /api/users/:id

Update user by ID (requires authentication, admin only).

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "role": "user",
  "dateOfBirth": "1990-01-01",
  "profileImage": "https://example.com/image.jpg"
}
```

**Response:** `200 OK`

#### DELETE /api/users/:id

Delete user by ID (requires authentication, admin only, cannot delete self).

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### DELETE /api/users/:id/soft

Soft delete user by ID (requires authentication, admin only).

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### PUT /api/users/:id/restore

Restore soft deleted user (requires authentication, admin only).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "isDeleted": false
  },
  "message": "User restored successfully"
}
```

---

### Mess Management

#### POST /api/mess

Create a new mess (requires authentication, admin only). The selected manager will have their role automatically changed to 'manager'.

**Request Body:**

```json
{
  "name": "Bachelor's Mess",
  "description": "A mess for bachelors",
  "address": "123 Main St",
  "managerId": "507f1f77bcf86cd799439011"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Bachelor's Mess",
    "description": "A mess for bachelors",
    "address": "123 Main St",
    "managerId": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "mealRate": 50,
    "currency": "৳",
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2025-12-01T00:00:00.000Z"
  },
  "message": "Mess created successfully"
}
```

#### GET /api/mess/:messId

Get mess details (requires authentication).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Bachelor's Mess",
    "description": "A mess for bachelors",
    "managerId": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      }
    ],
    "mealRate": 50,
    "currency": "৳"
  }
}
```

#### PUT /api/mess/:messId

Update mess (requires authentication, manager or admin). If managerId is changed, the new manager's role will be set to 'manager' and they will be added to the mess members.

**Request Body:**

```json
{
  "name": "Updated Mess Name",
  "description": "Updated description",
  "address": "456 New St",
  "mealRate": 55,
  "currency": "$",
  "managerId": "507f1f77bcf86cd799439013"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Updated Mess Name",
    "description": "Updated description",
    "address": "456 New St",
    "managerId": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "members": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ],
    "mealRate": 55,
    "currency": "$"
  },
  "message": "Mess updated successfully"
}
```

#### DELETE /api/mess/:messId

Delete mess and all related data (requires authentication, manager or admin).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Mess and all related data deleted successfully"
  }
}
```

#### GET /api/mess/:messId/meal-rate

Get current meal rate for mess (requires authentication).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "mealRate": 33.33
  }
}
```

#### POST /api/mess/:messId/members

Add member to mess (requires authentication, manager only).

**Request Body:**

```json
{
  "email": "newmember@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Member added successfully"
}
```

#### DELETE /api/mess/:messId/members/:userId

Remove member from mess (requires authentication, manager only, cannot remove manager).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Member removed successfully"
}
```

#### GET /api/mess

Get all messes (requires authentication, admin only).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Bachelor's Mess",
      "managerId": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [...],
      "mealRate": 50
    }
  ]
}
```

#### POST /api/mess/admin/cleanup

Cleanup mess data (requires authentication, admin only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "type": "meals" // or "expenses", "deposits", "all"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Data cleanup completed successfully",
    "deletedCount": 25
  }
}
```

---

### Meals

#### POST /api/meals

Add single meal entry (requires authentication, manager only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "breakfast": 1,
  "lunch": 1,
  "dinner": 1,
  "date": "2025-12-01",
  "status": "taken",
  "mealType": "regular",
  "preferences": {
    "vegetarian": false,
    "spicy": true,
    "notes": "Extra spicy"
  }
}
```

**Meal Status Options:** `taken`, `skipped`, `guest`, `offday`

**Meal Type Options:** `regular`, `offday`, `holiday`

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "messId": "507f1f77bcf86cd799439012",
    "userId": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "breakfast": 1,
    "lunch": 1,
    "dinner": 1,
    "date": "2025-12-01T00:00:00.000Z",
    "status": "taken",
    "mealType": "regular",
    "preferences": {
      "vegetarian": false,
      "spicy": true,
      "notes": "Extra spicy"
    },
    "cost": 0,
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "message": "Meal created successfully"
}
```

#### POST /api/meals/bulk

Add meals for multiple members at once (requires authentication, manager only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "meals": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "breakfast": 1,
      "lunch": 1,
      "dinner": 1,
      "date": "2025-12-01",
      "status": "taken",
      "mealType": "regular"
    },
    {
      "userId": "507f1f77bcf86cd799439013",
      "breakfast": 1,
      "lunch": 0,
      "dinner": 1,
      "date": "2025-12-01",
      "status": "taken",
      "mealType": "regular"
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439014",
      "messId": "507f1f77bcf86cd799439012",
      "userId": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "breakfast": 1,
      "lunch": 1,
      "dinner": 1,
      "date": "2025-12-01T00:00:00.000Z",
      "status": "taken",
      "mealType": "regular"
    }
  ],
  "message": "Meals created successfully"
}
```

#### GET /api/meals

Get meals with flexible filtering (requires authentication).

**Query Parameters:**

- `messId` (optional): Filter by mess ID
- `userId` (optional): Filter by user ID
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "meals": [
      {
        "id": "507f1f77bcf86cd799439013",
        "messId": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Bachelor's Mess"
        },
        "userId": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "user"
        },
        "breakfast": 1,
        "lunch": 1,
        "dinner": 1,
        "date": "2025-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### GET /api/meals/mess/:messId

Get meals for a specific mess with filtering (requires authentication).

**Query Parameters:**

- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `userId` (optional): Filter by user ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "userId": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "breakfast": 1,
      "lunch": 1,
      "dinner": 1,
      "date": "2025-12-01T00:00:00.000Z"
    }
  ]
}
```

#### PUT /api/meals/:mealId

Update meal entry (requires authentication, manager only).

**Request Body:**

```json
{
  "breakfast": 0,
  "lunch": 1,
  "dinner": 1,
  "date": "2025-12-01"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Meal updated successfully"
}
```

#### DELETE /api/meals/:mealId

Delete meal entry (requires authentication, manager only).

**Response:** `204 No Content`

---

### Expenses

#### POST /api/expenses

Add expense (requires authentication, manager only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "description": "Grocery shopping",
  "amount": 500,
  "category": "food",
  "expensedBy": "507f1f77bcf86cd799439011",
  "date": "2025-12-01"
}
```

**Categories:** `food`, `utilities`, `maintenance`, `other`

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "messId": "507f1f77bcf86cd799439012",
    "description": "Grocery shopping",
    "amount": 500,
    "category": "food",
    "addedBy": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "expensedBy": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "date": "2025-12-01T00:00:00.000Z",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "message": "Expense created successfully"
}
```

#### GET /api/expenses

Get expenses with flexible filtering (requires authentication).

**Query Parameters:**

- `messId` (optional): Filter by mess ID
- `category` (optional): Filter by category (`food`, `utilities`, `maintenance`, `other`, or `all`)
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "507f1f77bcf86cd799439013",
        "messId": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Bachelor's Mess"
        },
        "description": "Grocery shopping",
        "amount": 500,
        "category": "food",
        "addedBy": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "expensedBy": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "date": "2025-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### GET /api/expenses/mess/:messId

Get expenses for a specific mess with filtering (requires authentication).

**Query Parameters:**

- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `category` (optional): Filter by category
- `userId` (optional): Filter by user ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "description": "Grocery shopping",
      "amount": 500,
      "category": "food",
      "addedBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "expensedBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "date": "2025-12-01T00:00:00.000Z"
    }
  ]
}
```

#### PUT /api/expenses/:expenseId

Update expense (requires authentication, manager only).

**Request Body:**

```json
{
  "description": "Updated grocery shopping",
  "amount": 550,
  "category": "food",
  "expensedBy": "507f1f77bcf86cd799439011",
  "date": "2025-12-01"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Expense updated successfully"
}
```

#### DELETE /api/expenses/:expenseId

Delete expense (requires authentication, manager only).

**Response:** `204 No Content`

---

### Deposits

#### POST /api/deposits

Add deposit (requires authentication, manager only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 1000,
  "date": "2025-12-01",
  "description": "Monthly deposit"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "messId": "507f1f77bcf86cd799439012",
    "userId": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "amount": 1000,
    "date": "2025-12-01T00:00:00.000Z",
    "description": "Monthly deposit",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "message": "Deposit created successfully"
}
```

#### GET /api/deposits

Get deposits with flexible filtering (requires authentication).

**Query Parameters:**

- `messId` (optional): Filter by mess ID
- `userId` (optional): Filter by user ID
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "deposits": [
      {
        "id": "507f1f77bcf86cd799439013",
        "messId": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Bachelor's Mess"
        },
        "userId": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "amount": 1000,
        "date": "2025-12-01T00:00:00.000Z",
        "description": "Monthly deposit"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### GET /api/deposits/mess/:messId

Get deposits for a specific mess with filtering (requires authentication).

**Query Parameters:**

- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `userId` (optional): Filter by user ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "userId": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 1000,
      "date": "2025-12-01T00:00:00.000Z",
      "description": "Monthly deposit"
    }
  ]
}
```

#### GET /api/deposits/mess/:messId/user/:userId

Get deposits for a specific user in a mess (requires authentication).

**Response:** `200 OK`

#### GET /api/deposits/mess/:messId/stats

Get deposit statistics for a mess (requires authentication).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "monthly": {
      "totalAmount": 5000,
      "depositCount": 5
    },
    "memberStats": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "userName": "John Doe",
        "totalAmount": 1000,
        "depositCount": 1
      }
    ],
    "period": {
      "start": "2025-12-01T00:00:00.000Z",
      "end": "2025-12-31T23:59:59.999Z",
      "month": "December 2025"
    }
  }
}
```

#### PUT /api/deposits/:depositId

Update deposit (requires authentication, manager only).

**Request Body:**

```json
{
  "amount": 1100,
  "description": "Updated monthly deposit",
  "date": "2025-12-01",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Deposit updated successfully"
}
```

#### DELETE /api/deposits/:depositId

Delete deposit (requires authentication, manager only).

**Response:** `204 No Content`

---

### Dashboard

#### GET /api/dashboard/:messId

Get comprehensive dashboard data for a mess (requires authentication).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "mess": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Bachelor's Mess",
      "description": "A mess for bachelors",
      "mealRate": 33.33,
      "currency": "৳",
      "members": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        }
      ]
    },
    "monthlyExpenses": 5000,
    "monthlyMeals": 150,
    "mealRate": 33.33,
    "members": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "totalMeals": 45,
        "totalDeposits": 1500,
        "balance": 500
      }
    ],
    "recentExpenses": [
      {
        "id": "507f1f77bcf86cd799439013",
        "description": "Grocery shopping",
        "amount": 500,
        "category": "food",
        "date": "2025-12-01T00:00:00.000Z"
      }
    ],
    "memberBalances": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "userName": "John Doe",
        "totalDeposits": 1500,
        "totalExpenses": 1000,
        "balance": 500
      }
    ]
  }
}
```

---

### Analytics

#### GET /api/analytics/:messId

Get analytics data for a mess (requires authentication).

**Query Parameters:**

- `startDate` (optional): Start date for analytics (YYYY-MM-DD)
- `endDate` (optional): End date for analytics (YYYY-MM-DD)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-12-01T00:00:00.000Z",
      "end": "2025-12-31T23:59:59.999Z"
    },
    "expenses": {
      "total": 5000,
      "byCategory": {
        "food": 3000,
        "utilities": 1500,
        "maintenance": 300,
        "other": 200
      },
      "trend": [
        {
          "date": "2025-12-01",
          "amount": 500
        }
      ]
    },
    "meals": {
      "total": 150,
      "byUser": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "userName": "John Doe",
          "totalMeals": 45
        }
      ],
      "trend": [
        {
          "date": "2025-12-01",
          "count": 15
        }
      ]
    },
    "deposits": {
      "total": 5000,
      "byUser": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "userName": "John Doe",
          "totalAmount": 1500
        }
      ],
      "trend": [
        {
          "date": "2025-12-01",
          "amount": 1000
        }
      ]
    },
    "mealRate": {
      "current": 33.33,
      "trend": [
        {
          "date": "2025-12-01",
          "rate": 33.33
        }
      ]
    }
  }
}
```

---

### Reports

#### GET /api/reports/:messId

Generate reports for a mess (requires authentication).

**Query Parameters:**

- `type`: Report type (`monthly`, `custom`)
- `month` (optional): Month for monthly report (1-12)
- `year` (optional): Year for monthly report
- `startDate` (optional): Start date for custom report (YYYY-MM-DD)
- `endDate` (optional): End date for custom report (YYYY-MM-DD)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "reportType": "monthly",
    "period": {
      "month": 12,
      "year": 2025,
      "start": "2025-12-01T00:00:00.000Z",
      "end": "2025-12-31T23:59:59.999Z"
    },
    "summary": {
      "totalExpenses": 5000,
      "totalMeals": 150,
      "totalDeposits": 5000,
      "mealRate": 33.33,
      "netBalance": 0
    },
    "expenses": {
      "total": 5000,
      "byCategory": {
        "food": 3000,
        "utilities": 1500,
        "maintenance": 300,
        "other": 200
      },
      "details": [
        {
          "id": "507f1f77bcf86cd799439013",
          "description": "Grocery shopping",
          "amount": 500,
          "category": "food",
          "date": "2025-12-01T00:00:00.000Z",
          "addedBy": "John Doe",
          "expensedBy": "John Doe"
        }
      ]
    },
    "meals": {
      "total": 150,
      "byUser": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "userName": "John Doe",
          "breakfast": 15,
          "lunch": 15,
          "dinner": 15,
          "total": 45
        }
      ]
    },
    "deposits": {
      "total": 5000,
      "byUser": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "userName": "John Doe",
          "amount": 1500,
          "count": 1
        }
      ]
    },
    "memberBalances": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "userName": "John Doe",
        "totalDeposits": 1500,
        "totalExpenses": 1000,
        "balance": 500
      }
    ]
  }
}
```

---

### Subscriptions

#### GET /api/subscriptions/plans

Get all subscription plans (requires authentication).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439015",
      "name": "Basic Plan",
      "description": "Perfect for small messes",
      "maxMembers": 5,
      "planType": "monthly",
      "duration": 1,
      "price": 500,
      "currency": "BDT",
      "features": ["Basic meal tracking", "Expense management"],
      "isActive": true
    }
  ]
}
```

#### POST /api/subscriptions/plans

Create new subscription plan (requires authentication, admin only).

**Request Body:**

```json
{
  "name": "Premium Plan",
  "description": "For large messes",
  "maxMembers": 50,
  "planType": "monthly",
  "duration": 1,
  "price": 2000,
  "currency": "BDT",
  "features": ["All features", "Priority support"]
}
```

**Response:** `201 Created`

#### PUT /api/subscriptions/plans/:id

Update subscription plan (requires authentication, admin only).

**Response:** `200 OK`

#### DELETE /api/subscriptions/plans/:id

Deactivate subscription plan (requires authentication, admin only).

**Response:** `200 OK`

#### GET /api/subscriptions/coupons

Get all coupons (requires authentication, admin only).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439016",
      "code": "WELCOME10",
      "description": "10% off for new customers",
      "discountType": "percentage",
      "discountValue": 10,
      "maxUses": 100,
      "usedCount": 5,
      "validFrom": "2025-01-01T00:00:00.000Z",
      "validUntil": "2025-12-31T23:59:59.999Z",
      "isActive": true
    }
  ]
}
```

#### POST /api/subscriptions/coupons

Create new coupon (requires authentication, admin only).

**Request Body:**

```json
{
  "code": "SAVE500",
  "description": "Fixed discount",
  "discountType": "fixed",
  "discountValue": 500,
  "maxUses": 50,
  "validFrom": "2025-01-01",
  "validUntil": "2025-12-31",
  "applicablePlans": []
}
```

**Response:** `201 Created`

#### POST /api/subscriptions

Create subscription (requires authentication, manager only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "planId": "507f1f77bcf86cd799439015",
  "couponCode": "WELCOME10",
  "paymentMethod": "sslcommerz",
  "autoRenew": true
}
```

**Payment Methods:** `sslcommerz`, `stripe`, `bank_transfer`, `cash`

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439017",
    "messId": "507f1f77bcf86cd799439012",
    "planId": {
      "id": "507f1f77bcf86cd799439015",
      "name": "Basic Plan",
      "price": 500
    },
    "couponId": {
      "id": "507f1f77bcf86cd799439016",
      "code": "WELCOME10",
      "discountValue": 10
    },
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2026-01-01T00:00:00.000Z",
    "status": "pending",
    "paymentMethod": "sslcommerz",
    "paymentStatus": "pending",
    "amount": 500,
    "discountAmount": 50,
    "finalAmount": 450,
    "transactionId": "ssl_1733011200000"
  },
  "message": "Subscription created successfully"
}
```

#### GET /api/subscriptions/mess/:messId

Get mess subscriptions (requires authentication, manager only).

**Response:** `200 OK`

#### GET /api/subscriptions/:id

Get subscription details (requires authentication).

**Response:** `200 OK`

#### PUT /api/subscriptions/:id/cancel

Cancel subscription (requires authentication, manager only).

**Response:** `200 OK`

#### PUT /api/subscriptions/:id/renew

Renew subscription (requires authentication, manager only).

**Response:** `200 OK`

---

### AI Features

#### POST /api/ai/market-schedule

Generate market/rest day schedule using AI (requires authentication, manager only).

**Request Body:**

```json
{
  "messId": "507f1f77bcf86cd799439012",
  "prompt": "Create a fair schedule where each member gets 4 rest days per month, avoiding weekends when possible",
  "month": 12,
  "year": 2025
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "schedule": [
      "05/12/2025",
      "12/12/2025",
      "19/12/2025",
      "26/12/2025"
    ],
    "explanation": "Generated schedule distributes 4 rest days per member throughout December 2025, avoiding weekends",
    "confidence": 85
  },
  "message": "Market schedule generated successfully"
}
```

#### POST /api/ai/meal-plan

Generate meal plan suggestions using AI (requires authentication).

**Request Body:**

```json
{
  "prompt": "Create a weekly meal plan for 5 people with vegetarian options and budget under 2000 BDT per day"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "mealPlan": "Here's a suggested weekly meal plan..."
  },
  "message": "Meal plan generated successfully"
}
```

---

## Error Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 400  | Bad Request - Validation error          |
| 401  | Unauthorized - Authentication required  |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 409  | Conflict - Duplicate entry              |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per window
- **Response:** 429 with retry-after header

## Pagination

Paginated endpoints accept:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```
