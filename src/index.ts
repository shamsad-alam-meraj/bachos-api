import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import expenseRoutes from './routes/expenses';
import mealRoutes from './routes/meals';
import messRoutes from './routes/mess';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      `mongodb+srv://shamsadalammeraj_db_user:20H96fjzRxTkhRU3@cluster0.vkygcft.mongodb.net/?appName=Cluster0`
  )
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Main Route
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: `Welcome to the bachOS Server!` });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
