import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getAchievements } from '../controllers/achievementController.js';

const router = Router();

router.get('/', authenticateToken, getAchievements);

export default router;

export const achievementRouter = Router();
