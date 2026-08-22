import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middlewares/errorMiddleware';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

export default app;
