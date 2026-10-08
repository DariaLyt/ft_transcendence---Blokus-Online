import { Router } from 'express';
import { handleFriendRequest, handleFriendResponse, getFriendsList, getPendingList, removeFriend, searchFriends } from '../controllers/friendController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { friendRequestSchema, friendResponseSchema } from '../schemas/friendSchemas.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

router.post('/request', authenticateToken, validate(friendRequestSchema), handleFriendRequest);
router.patch('/response/:id', authenticateToken, validate(friendResponseSchema), handleFriendResponse);
router.get('/', authenticateToken, getFriendsList);
router.get('/pending', authenticateToken, getPendingList);
router.get('/search', authenticateToken, searchFriends);
router.delete('/:friendId', authenticateToken, removeFriend);

export default router;