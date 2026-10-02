import type { Request, Response } from 'express';
import { checkExistingFriendship, createFriendRequest, findUserFriends, findPendingFriendRequests, removeFriendship, respondToFriendRequest } from '../db/queries/friendships.js';
import { findUserIdByUsernameInsensitive, searchUsersByUsername } from '../db/queries/users.js';
import { unlockAchievementForUser } from '../controllers/achievementController.js';
import { isUserOnline } from '../sockets/connectionManager.js';

export async function handleFriendRequest(req: Request, res: Response) {
	const userId = req.user!.userId;
	const { friendId, username } = req.body as { friendId?: number; username?: string };

	let targetId = friendId;
	if (targetId == null && username) {
		const found = await findUserIdByUsernameInsensitive(username);
		if (!found) {
			return res.status(404).json({ error: 'User not found' });
		}
		targetId = found.id;
	}

	if (!targetId || userId === targetId) {
		return res.status(400).json({ error: 'Invalid friend ID' });
	}

	const status = await checkExistingFriendship(userId, targetId);
	if (status === 'accepted' || status === 'pending') {
		return res.status(409).json({
			error: `A friend request or friendship already exists (Status: ${status}).`,
		});
	}
	if (status === 'declined') {
		await removeFriendship(userId, targetId);
	}

	await createFriendRequest(userId, targetId);
	return res.status(201).json({ message: 'Friend request sent successfully' });
}

export async function handleFriendResponse(req: Request, res: Response) {
	const requestId = Number(req.params.id);
	const { status } = req.body as { status: 'accepted' | 'declined' };

	if (!Number.isInteger(requestId) || requestId <= 0) {
		return res.status(400).json({ error: 'Invalid request id' });
	}

	const result = await respondToFriendRequest(requestId, req.user!.userId, status);
	if (!result.ok && result.reason === 'FORBIDDEN') {
		return res.status(403).json({ error: 'You cannot respond to this request' });
	}
	if (!result.ok) {
		return res.status(404).json({ error: 'Friend request not found' });
	}

	if (status === 'accepted' && result.request) {
		await unlockAchievementForUser(result.request.userId, 'SOCIAL_BUTTERFLY').catch(() => null);
		await unlockAchievementForUser(result.request.friendId, 'SOCIAL_BUTTERFLY').catch(() => null);
	}

	return res.status(200).json({
		message:
			status === 'accepted'
				? 'Friend request accepted'
				: 'Friend request declined',
	});
}

export async function getFriendsList(req: Request, res: Response) {
	const result = await findUserFriends(req.user!.userId);
	return res.json(
		result.map((friend) => ({
			...friend,
			online: isUserOnline(friend.id),
		})),
	);
}

export async function getPendingList(req: Request, res: Response) {
	const result = await findPendingFriendRequests(req.user!.userId);
	return res.json(
		result.map((row) => ({
			requestId: row.id,
			requesterId: row.userId,
			username: row.username,
			avatarUrl: row.avatarUrl,
			createdAt: row.createdAt,
		})),
	);
}

export async function searchFriends(req: Request, res: Response) {
	const username = String(req.query.username ?? '').trim();
	if (username.length < 1) {
		return res.json([]);
	}

	const userId = req.user!.userId;
	const matches = await searchUsersByUsername(username, userId);
	const withStatus = await Promise.all(
		matches.map(async (user) => ({
			...user,
			status: await checkExistingFriendship(userId, user.id),
		})),
	);
	return res.json(withStatus);
}

export async function removeFriend(req: Request, res: Response) {
	const userId = req.user!.userId;
	const friendId = Number(req.params.friendId);
	if (!Number.isInteger(friendId) || friendId <= 0) {
		return res.status(400).json({ error: 'Invalid friend ID' });
	}

	await removeFriendship(userId, friendId);
	return res.json({ message: 'Friend removed successfully' });
}
