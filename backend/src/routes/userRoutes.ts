import { Router } from 'express';
import { getProfile, changePassword } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { changePasswordSchema } from '../schemas/userSchemas.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.put('/me/password', authenticateToken, validate(changePasswordSchema), changePassword);

export default router;
