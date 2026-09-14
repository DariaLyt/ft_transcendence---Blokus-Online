import type { Request, Response } from 'express';
import { findUserById, getUserPasswordHash, updateUserPassword } from '../db/userQueries.js';
import bcrypt from 'bcrypt';
import { pool } from '../db/conn.js';
import path from 'node:path';
import fs from 'node:fs/promises';

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

export async function updateAvatar(req: Request, res: Response) {
	if (!req.file) {
      	return res.status(400).json({ error: 'No image file provided' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    try {
		if (!req.user) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		const id = req.user.userId;

		const { rows } = await pool.query(
			'SELECT avatar_url FROM users WHERE id = $1',
			[id]
		);
		const oldAvatarUrl = rows[0]?.avatar_url;

		await pool.query(
			'UPDATE users SET avatar_url = $1 WHERE id = $2',
			[avatarUrl, id]
		);

		if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
			const oldPath = path.join(process.cwd(), oldAvatarUrl);
			await fs.unlink(oldPath).catch(() => null);
		}

		res.json({ message: 'Avatar updated successfully', avatarUrl });
	} catch (err) {
		res.status(500).json({ error: 'Failed to update avatar record' });
    }
}
