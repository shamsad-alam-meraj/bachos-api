import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import depositRoutes from './routes/deposits';
import expenseRoutes from './routes/expenses';
import mealRoutes from './routes/meals';
import messRoutes from './routes/mess';
import reportsRoutes from './routes/reports';
import userRoutes from './routes/users';
import { logger } from './utils/logger';

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: config.isProd,
    crossOriginEmbedderPolicy: config.isProd,
  })
);

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    const allowedOrigins = Array.isArray(config.cors.origin)
      ? config.cors.origin
      : [config.cors.origin];

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // In development, allow localhost origins and common dev ports
    if (config.isDev && (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    )) {
      return callback(null, true);
    }

    // Log blocked origins for debugging
    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (!config.isTest) {
  app.use(requestLogger);
}

// Rate limiting
if (config.isProd) {
  app.use('/api/', rateLimiter);
}

// Health check (before other routes)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'bachOS API',
      version: '1.0.0',
      description: 'bachOS meal management system API',
      documentation: '/api/docs',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

export default app;
