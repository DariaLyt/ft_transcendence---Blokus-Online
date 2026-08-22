import { Router } from 'express';
import { register, login, logout } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { registerSchema, loginSchema } from '../schemas/authSchemas';
import { validate } from '../middlewares/validateMiddleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticateToken, logout);

export default router;
