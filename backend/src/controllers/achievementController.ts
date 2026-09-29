import type { Request, Response } from 'express';
import { findAchievementsById, insertAchievement } from '../db/queries/achievements.js';
import { sendToUser } from '../sockets/broadcaster.js';

export async function getAchievements(req: Request, res: Response) {
	const achievements = await findAchievementsById(req.user!.userId);
	return res.status(200).json({ achievements });
}

export async function unlockAchievementForUser(req: Request, res: Response) {
	const userId = req.user!.userId;
	const { achievementId } = req.body;

	const achievement = await insertAchievement(userId, achievementId);

	if (!achievement) {
		return res.status(200).json({ unlocked: false, message: 'Already unlocked' });
	}

	sendToUser(userId, 'ACHIEVEMENT_UNLOCKED', {
		code: achievement.code,
		title: achievement.title,
		unlockedAt: new Date().toISOString(),
	});

	return res.status(201).json({ unlocked: true, achievement });
}