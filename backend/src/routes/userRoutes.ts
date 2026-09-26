import { Router } from 'express';
import { getProfile, changePassword, updateAvatar } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { changePasswordSchema } from '../schemas/userSchemas.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import { getMatchHistory } from '../controllers/userController.js';


const router = Router();

router.get('/me', authenticateToken, getProfile);
router.put('/me/password', authenticateToken, validate(changePasswordSchema), changePassword);
router.post('/me/avatar', authenticateToken, uploadAvatar.single('avatar'), updateAvatar);
router.get("/me/history", authenticateToken, getMatchHistory);

export default router;
