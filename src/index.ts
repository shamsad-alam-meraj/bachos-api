import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import mealRoutes from './routes/meals';
import messRoutes from './routes/mess';

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
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vkygcft.mongodb.net/?appName=Cluster0`
  )
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/meals', mealRoutes);

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
