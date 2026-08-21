import { Router } from 'express';
import { register, login, logout } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);

export default router;
