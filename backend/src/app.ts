import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';


import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'https://localhost', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('/app/uploads'));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friend', friendRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

export default app;
