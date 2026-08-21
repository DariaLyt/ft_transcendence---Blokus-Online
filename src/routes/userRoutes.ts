import { Router } from 'express';
import { getProfile, changePassword } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.put('/me/password', authenticateToken, changePassword);

export default router;
