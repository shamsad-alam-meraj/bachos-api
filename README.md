# BachOS API

A professional mess management system backend built with Express.js, TypeScript, and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Complete user CRUD operations
- 🏠 **Mess Management** - Create and manage mess groups
- 🍽️ **Meal Tracking** - Track daily meals (breakfast, lunch, dinner)
- 💰 **Expense Management** - Record and categorize expenses
- 💳 **Deposit Tracking** - Monitor member deposits
- 📊 **Analytics & Reports** - Comprehensive dashboard and reporting
- ⚡ **Rate Limiting** - Protection against abuse
- 📝 **Request Logging** - Detailed request/response logging
- 🛡️ **Security** - Helmet.js, CORS, input validation
- ✅ **Validation** - Zod schema validation
- 🎯 **Error Handling** - Centralized error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, bcryptjs
- **Environment**: dotenv

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bachos-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/bachos
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   LOG_LEVEL=info
   ```

4. **Start the server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
bachos-api/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── env.ts       # Environment validation
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   ├── requestLogger.ts
│   │   └── validation.ts
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── Mess.ts
│   │   ├── Meal.ts
│   │   ├── Expense.ts
│   │   └── Deposit.ts
│   ├── routes/          # API routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── mess.ts
│   │   ├── meals.ts
│   │   ├── expenses.ts
│   │   ├── deposits.ts
│   │   ├── dashboard.ts
│   │   ├── analytics.ts
│   │   └── reports.ts
│   ├── utils/           # Utility functions
│   │   ├── asyncHandler.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   └── index.ts         # Application entry point
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (auth required)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Mess
- `POST /api/mess` - Create mess
- `GET /api/mess/:id` - Get mess details
- `PUT /api/mess/:id` - Update mess
- `DELETE /api/mess/:id` - Delete mess
- `POST /api/mess/:id/members` - Add member
- `DELETE /api/mess/:id/members/:userId` - Remove member

### Meals
- `POST /api/meals` - Add meal entry
- `GET /api/meals` - Get meals
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal

### Expenses
- `POST /api/expenses` - Add expense
- `GET /api/expenses` - Get expenses
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Deposits
- `POST /api/deposits` - Add deposit
- `GET /api/deposits` - Get deposits
- `PUT /api/deposits/:id` - Update deposit
- `DELETE /api/deposits/:id` - Delete deposit

### Dashboard & Analytics
- `GET /api/dashboard/:messId` - Get dashboard data
- `GET /api/analytics/:messId` - Get analytics
- `GET /api/reports/:messId` - Generate reports

### Health
- `GET /health` - Health check endpoint

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

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Security Features

1. **Helmet.js** - Sets security HTTP headers
2. **CORS** - Configurable cross-origin resource sharing
3. **Rate Limiting** - Prevents abuse and DDoS attacks
4. **JWT Authentication** - Secure token-based auth
5. **Password Hashing** - bcrypt for password security
6. **Input Validation** - Zod schema validation
7. **Environment Validation** - Ensures required env vars are set

## Development

### Running in development mode
```bash
npm run dev
```

### Building for production
```bash
npm run build
```

### Running production build
```bash
npm start
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production/test) | development | No |
| `PORT` | Server port | 4000 | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d | No |
| `CORS_ORIGIN` | Allowed CORS origins | * | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | No |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info | No |

## Logging

The application uses a custom logger with different log levels:

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages

Set `LOG_LEVEL` environment variable to control verbosity.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@bachos.com or create an issue in the repository.