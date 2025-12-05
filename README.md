 s # BachOS API

A professional mess management system backend built with Express.js, TypeScript, and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Complete user CRUD operations with search, filtering, and soft delete
- 🏠 **Mess Management** - Create and manage mess groups with member roles
- 🍽️ **Advanced Meal Tracking** - Track daily meals with status, guest management, and cost calculation
- 💰 **Expense Management** - Record and categorize expenses with approval workflow
- 💳 **Deposit Tracking** - Monitor member deposits with payment method tracking
- 📊 **Analytics & Reports** - Comprehensive dashboard and reporting with AI insights
- 💳 **Subscription System** - Monthly/yearly plans with coupon support and payment integration
- 🤖 **AI Integration** - Hugging Face API for market schedule generation and meal planning
- ⚡ **Bulk Operations** - Add meals for multiple members simultaneously
- 📝 **Request Logging** - Detailed request/response logging
- 🛡️ **Security** - Helmet.js, CORS, input validation, rate limiting
- ✅ **Validation** - Zod schema validation
- 🎯 **Error Handling** - Centralized error handling
- 🔧 **Development Tools** - Husky pre-commit hooks, TypeDoc documentation, Docker support

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
   git clone https://github.com/shamsad-alam-meraj/bachos-api.git
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
- `GET /api/users/search` - Search and filter users (admin only)
- `GET /api/users/stats/overview` - Get user statistics (admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/preferences` - Update user preferences
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `DELETE /api/users/:id/soft` - Soft delete user (admin only)
- `PUT /api/users/:id/restore` - Restore soft deleted user (admin only)

### Mess
- `POST /api/mess` - Create mess
- `GET /api/mess/:id` - Get mess details
- `PUT /api/mess/:id` - Update mess
- `DELETE /api/mess/:id` - Delete mess
- `POST /api/mess/:id/members` - Add member
- `DELETE /api/mess/:id/members/:userId` - Remove member

### Meals
- `POST /api/meals` - Add single meal entry
- `POST /api/meals/bulk` - Add meals for multiple members
- `GET /api/meals` - Get meals with filtering
- `GET /api/meals/stats/:messId` - Get meal statistics
- `POST /api/meals/calculate-costs/:messId` - Calculate meal costs
- `GET /api/meals/summary/:messId/:userId` - Get user meal summary
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

### Subscriptions (Admin & Managers)
- `GET /api/subscriptions/plans` - Get all subscription plans
- `POST /api/subscriptions/plans` - Create new plan (admin only)
- `PUT /api/subscriptions/plans/:id` - Update plan (admin only)
- `DELETE /api/subscriptions/plans/:id` - Delete plan (admin only)
- `GET /api/subscriptions/coupons` - Get all coupons (admin only)
- `POST /api/subscriptions/coupons` - Create coupon (admin only)
- `PUT /api/subscriptions/coupons/:id` - Update coupon (admin only)
- `DELETE /api/subscriptions/coupons/:id` - Delete coupon (admin only)
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/mess/:messId` - Get mess subscriptions
- `GET /api/subscriptions/:id` - Get subscription details
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription
- `PUT /api/subscriptions/:id/renew` - Renew subscription

### AI Features
- `POST /api/ai/market-schedule` - Generate market/rest day schedule
- `POST /api/ai/meal-plan` - Generate meal plan suggestions

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

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run build:watch      # Build with watch mode
npm start                # Start production server

# Quality & Testing
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking

# Database
npm run seed             # Seed database with sample data

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run with Docker Compose
npm run docker:dev       # Run development environment with Docker

# Documentation
npm run docs:generate    # Generate TypeDoc documentation

# Git Hooks
npm run pre-commit       # Run pre-commit checks (lint + format + type-check)
npm run prepare          # Setup Husky git hooks

# Release Management
npm run release          # Create new release with standard-version
```

### Development Workflow

1. **Setup development environment**
   ```bash
   npm install
   npm run prepare  # Setup git hooks
   cp .env.example .env
   npm run seed     # Populate database with sample data
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Run quality checks before committing**
   ```bash
   npm run pre-commit  # Runs automatically on git commit
   ```

### Docker Development

For containerized development:

```bash
# Start development environment
npm run docker:dev

# Or build and run manually
npm run docker:build
npm run docker:run
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
| `SSLCOMMERZ_STORE_ID` | SSLCommerz store ID | - | No |
| `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz store password | - | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | - | No |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - | No |
| `HUGGINGFACE_API_KEY` | Hugging Face API key for AI features | - | No |

## Logging

The application uses a custom logger with different log levels:

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages

Set `LOG_LEVEL` environment variable to control verbosity.

## Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Frontend Integration Guide](FRONTEND_INTEGRATION.md)** - Comprehensive guide for frontend developers

## Sample Data

The project includes a database seeding script that creates sample data for development:

```bash
npm run seed
```

**Sample Accounts Created:**
- **Admin**: `admin@bachos.com` / `admin123`
- **Manager**: `manager@bachos.com` / `manager123`
- **Members**: `alice@bachos.com`, `bob@bachos.com`, `charlie@bachos.com` / `member123`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email at shamsad.alam.meraj@gmail.com or create an issue in the repository.