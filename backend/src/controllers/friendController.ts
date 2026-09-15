import type { Request, Response } from 'express';
import { checkExistingFriendship, createFriendRequest, updateFriendRequest, findUserFriends, findPendingFriendRequests, removeFriendship } from '../db/queries/friendships.js';

export async function handleFriendRequest(req: Request, res: Response) {
	const userId = req.user!.userId;
	const { friendId } = req.body;

	if (!friendId || userId === friendId) {
		return res.status(400).json({ error: 'Invalid friend ID' });
	}

	const status = await checkExistingFriendship(userId, friendId);
	if (status) {
		return res.status(409).json({ error: `A friend request or friendship already exists (Status: ${status}).` });
    }

	await createFriendRequest(userId, friendId);
	return res.status(201).json({ message: 'Friend request sent successfully' });
}

export async function handleFriendResponse(req: Request, res: Response) {
	const requestId = Number(req.params.id);
	const { status } = req.body;
	
	await updateFriendRequest(requestId, status);
	return res.status(200).json({ message: 'Friend request updated successfully' });
}

export async function getFriendsList(req: Request, res: Response) {
	const result = await findUserFriends(req.user!.userId);
	return res.json(result);
}

export async function getPendingList(req: Request, res: Response) {
	const result = await findPendingFriendRequests(req.user!.userId);
	return res.json(result);
}

export async function removeFriend(req: Request, res: Response) {
	const userId = req.user!.userId;
	const friendId = Number(req.params.friendId);

	await removeFriendship(userId, friendId);
	return res.json({ message: 'Friend removed successfully' });
}
