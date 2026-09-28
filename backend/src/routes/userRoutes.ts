import { Router } from 'express';
import { getProfile, updateUserProfile, changePassword, updateAvatar } from '../controllers/userController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middlewares/authMiddleware.js';
import { changePasswordSchema, updateProfileSchema } from '../schemas/userSchemas.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import { getMatchHistory } from '../controllers/userController.js';


const router = Router();

router.get('/me', optionalAuthenticateToken, getProfile);
router.put('/me', authenticateToken, validate(updateProfileSchema), updateUserProfile);
router.put('/me/password', authenticateToken, validate(changePasswordSchema), changePassword);
router.post('/me/avatar', authenticateToken, uploadAvatar.single('avatar'), updateAvatar);
router.get("/me/history", authenticateToken, getMatchHistory);

export default router;
