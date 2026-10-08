import type { Request, Response } from 'express';
import { findUserById, getUserPasswordHash, updateUserPassword, getAvatar, updateNewAvatar, updateUserProfileQuery, findUserByEmail, findUserByUsername, } from '../db/queries/users.js';
import bcrypt from 'bcrypt';
import path from 'node:path';
import fs from 'node:fs/promises';
import { findGamesByUserId } from "../db/queries/game.js";
import { unlockAchievementForUser } from '../controllers/achievementController.js';
import { getUserStats } from '../db/queries/statistics.js';
import { checkExistingFriendship } from '../db/queries/friendships.js';
import { isUserOnline } from '../sockets/connectionManager.js';
import { findAchievementsById } from '../db/queries/achievements.js';

export async function getProfile(req: Request, res: Response) {
    if (!req.user) {
        return res.status(200).json({ user: null });
    }

	const user = await findUserById(req.user!.userId);
	if (!user) {
		res.clearCookie('auth_token', {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
		});
		return res.status(200).json({ user: null });
	}

	return res.status(200).json({ user });
}

export async function updateUserProfile(req: Request, res: Response) {
	const validated = req.body;
	const userId = req.user!.userId;

	const [existingEmail, existingUsername] = await Promise.all([
		findUserByEmail(validated.email),
		findUserByUsername(validated.username),
	]);

	if (existingUsername && existingUsername.id !== userId) {
		return res.status(400).json({ error: 'Username already in use' });
	}

	if (existingEmail && existingEmail.id !== userId) {
		return res.status(400).json({ error: 'Email already in use' });
	}

	const updated = await updateUserProfileQuery(
		userId,
		validated.username,
		validated.email
	);

	if (!updated) {
		return res.status(404).json({ error: 'User not found' });
	}
	return res.status(200).json({ user: updated });
}
export async function getPublicProfile(req: Request, res: Response) {
	const id = Number(req.params.id);
	if (!Number.isInteger(id) || id <= 0) {
		return res.status(400).json({ error: 'Invalid user id' });
	}

	const user = await findUserById(id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const viewerId = req.user!.userId;
	const friendship =
		viewerId === id
			? 'self'
			: (await checkExistingFriendship(viewerId, id)) ?? 'none';
	const stats = await getUserStats(id);
	const unlocked = await findAchievementsById(id);

	return res.status(200).json({
		id: user.id,
		username: user.username,
		avatarUrl: user.avatar_url ?? null,
		createdAt: user.created_at,
		online: isUserOnline(id),
		gamesPlayed: Number(stats?.gamesPlayed ?? 0),
		friendship,
		achievements: (unlocked ?? []).map((item) => ({
			id: item.id,
			code: item.code,
			title: item.title,
			description: item.description,
			iconUrl: item.iconUrl,
			unlockedAt: item.unlockedAt,
		})),
	});
}

export async function changePassword(req: Request, res: Response) {
	const validated = req.body;

	const currentHash = await getUserPasswordHash(req.user!.userId);
	if (!currentHash) {
		return res.status(404).json({ error: 'User not found' });
	}

	const isValidPassword = await bcrypt.compare(validated.currentPassword, currentHash);
	if (!isValidPassword) {
		return res.status(400).json({ error: 'Incorrect current password' });
	}

	const newHash = await bcrypt.hash(validated.newPassword, 10);
	const updated = await updateUserPassword(newHash, req.user!.userId);
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
		const id = req.user!.userId;

		const oldAvatarUrl = await getAvatar(id);

		await updateNewAvatar(id, avatarUrl);

		if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
			const oldPath = path.join(process.cwd(), oldAvatarUrl);
			await fs.unlink(oldPath).catch(() => null);
		}

		await unlockAchievementForUser(id, 'AVATAR_UPLOADED').catch(() => null);

		res.json({ message: 'Avatar updated successfully', avatarUrl });
	} catch (err) {
		res.status(500).json({ error: 'Failed to update avatar record' });
    }
}

export async function getMatchHistory(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const matches = await findGamesByUserId(req.user.userId);
    return res.json(matches);
}