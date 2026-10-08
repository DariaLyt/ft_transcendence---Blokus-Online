import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticateToken, logout);

export default router;
