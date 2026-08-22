import { Router } from 'express';
import { getProfile, changePassword } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { changePasswordSchema } from '../schemas/userSchemas';
import { validate } from '../middlewares/validateMiddleware';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.put('/me/password', authenticateToken, validate(changePasswordSchema), changePassword);

export default router;
