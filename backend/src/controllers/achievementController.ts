import type { Request, Response } from 'express';
import { findAchievementsById, grantAchievement } from '../db/queries/achievements.js';
import { sendToUser } from '../sockets/broadcaster.js';

export async function getAchievements(req: Request, res: Response) {
	const achievements = await findAchievementsById(req.user!.userId);
	return res.status(200).json({ achievements });
}

export async function unlockAchievementForUser(userId: number, code: string, isVeteran: boolean = false) {
	try {
		const result = await grantAchievement(userId, code, isVeteran);

		if (result.success) {
			sendToUser(userId, 'ACHIEVEMENT_UNLOCKED', {
				code: result.achievement!.code,
				title: result.achievement!.title,
				description: result.achievement!.description,
				iconUrl: result.achievement!.iconUrl,
				unlockedAt: result.inserted!.unlockedAt.toISOString(),
			});
		}
	} catch (err) {
		console.error(`[Achievements Error] Failed to process unlock for user ${userId}:`, err);
    }
}
