import { Router } from 'express';
import { leaderboard } from '../controllers/leaderboardController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, leaderboard);

export default router;