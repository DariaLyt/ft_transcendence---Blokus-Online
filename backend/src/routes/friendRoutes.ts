import { Router } from 'express';
import { handleFriendRequest, handleFriendResponse, getFriendsList, getPendingList } from '../controllers/friendController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { friendRequestSchema, friendResponseSchema } from '../schemas/friendSchemas.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

router.post('/request', authenticateToken, validate(friendRequestSchema), handleFriendRequest);
router.patch('/respond', authenticateToken, validate(friendResponseSchema), handleFriendResponse);
router.get('/', authenticateToken, getFriendsList);
router.get('/pending', authenticateToken, getPendingList);

export default router;