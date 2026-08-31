import type { Request, Response } from 'express';
import { findUserById, getUserPasswordHash, updateUserPassword } from '../db/userQueries.js';
import bcrypt from 'bcrypt';

export async function getProfile(req: Request, res: Response) {
	if (!req.user) {
		return res.status(401).json({ error: 'Unauthorized'});
	}

	const user = await findUserById(req.user.userId);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	return res.status(200).json({ user });
}

export async function changePassword(req: Request, res: Response) {
	if (!req.user) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const validated = req.body;

	const currentHash = await getUserPasswordHash(req.user.userId);
	if (!currentHash) {
		return res.status(404).json({ error: 'User not found' });
	}

	const isValidPassword = await bcrypt.compare(validated.currentPassword, currentHash);
	if (!isValidPassword) {
		return res.status(400).json({ error: 'Incorrect current password' });
	}

	const newHash = await bcrypt.hash(validated.newPassword, 10);
	const updated = await updateUserPassword(newHash, req.user.userId);
	if (!updated) {
		return res.status(404).json({ error: 'User not found' });
	}
	return res.status(200).json({ message: 'Password updated successfully' });
}
