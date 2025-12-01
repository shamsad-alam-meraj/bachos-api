# BachOS API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

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

#### GET /api/users
Get all users (requires authentication).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "messId": "507f1f77bcf86cd799439012"
    }
  ]
}
```

#### GET /api/users/:id
Get user by ID.

**Response:** `200 OK`

#### PUT /api/users/:id
Update user.

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

**Response:** `200 OK`

#### DELETE /api/users/:id
Delete user.

**Response:** `204 No Content`

---

### Mess Management

#### POST /api/mess
Create a new mess (requires authentication).

**Request Body:**
```json
{
  "name": "Bachelor's Mess",
  "description": "A mess for bachelors",
  "address": "123 Main St",
  "mealRate": 50,
  "currency": "৳"
}
```

**Response:** `201 Created`

#### GET /api/mess/:id
Get mess details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Bachelor's Mess",
    "description": "A mess for bachelors",
    "managerId": "507f1f77bcf86cd799439011",
    "members": [...],
    "mealRate": 50,
    "currency": "৳"
  }
}
```

#### PUT /api/mess/:id
Update mess (requires manager/admin role).

#### DELETE /api/mess/:id
Delete mess (requires manager/admin role).

#### POST /api/mess/:id/members
Add member to mess.

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439013"
}
```

#### DELETE /api/mess/:id/members/:userId
Remove member from mess.

---

### Meals

#### POST /api/meals
Add meal entry.

**Request Body:**
```json
{
  "messId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "breakfast": 1,
  "lunch": 1,
  "dinner": 1,
  "date": "2025-12-01"
}
```

**Response:** `201 Created`

#### GET /api/meals
Get meals.

**Query Parameters:**
- `messId`: Filter by mess ID
- `userId`: Filter by user ID
- `startDate`: Start date filter
- `endDate`: End date filter
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

#### PUT /api/meals/:id
Update meal entry.

#### DELETE /api/meals/:id
Delete meal entry.

---

### Expenses

#### POST /api/expenses
Add expense.

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

#### GET /api/expenses
Get expenses.

**Query Parameters:**
- `messId`: Filter by mess ID
- `category`: Filter by category
- `startDate`: Start date filter
- `endDate`: End date filter
- `page`: Page number
- `limit`: Items per page

#### PUT /api/expenses/:id
Update expense.

#### DELETE /api/expenses/:id
Delete expense.

---

### Deposits

#### POST /api/deposits
Add deposit.

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

#### GET /api/deposits
Get deposits.

**Query Parameters:**
- `messId`: Filter by mess ID
- `userId`: Filter by user ID
- `startDate`: Start date filter
- `endDate`: End date filter

#### PUT /api/deposits/:id
Update deposit.

#### DELETE /api/deposits/:id
Delete deposit.

---

### Dashboard

#### GET /api/dashboard/:messId
Get comprehensive dashboard data for a mess.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "mess": { ... },
    "monthlyExpenses": 5000,
    "monthlyMeals": 150,
    "mealRate": 33.33,
    "members": [ ... ],
    "recentExpenses": [ ... ],
    "memberBalances": [ ... ]
  }
}
```

---

### Analytics

#### GET /api/analytics/:messId
Get analytics data.

**Query Parameters:**
- `startDate`: Start date for analytics
- `endDate`: End date for analytics

**Response:** `200 OK`

---

### Reports

#### GET /api/reports/:messId
Generate reports.

**Query Parameters:**
- `type`: Report type (monthly, custom)
- `month`: Month for monthly report
- `year`: Year for monthly report
- `startDate`: Start date for custom report
- `endDate`: End date for custom report

**Response:** `200 OK`

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate entry |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

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