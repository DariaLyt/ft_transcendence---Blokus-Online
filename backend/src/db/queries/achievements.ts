import { db } from '../conn.js';
import { achievements, userAchievements } from '../schema.js';
import { eq, and } from "drizzle-orm";

export async function findAchievementsById(id: number) {
	const result = await db
		.select({
			id: achievements.id,
			code: achievements.code,
			title: achievements.title,
			description: achievements.description,
			iconUrl: achievements.iconUrl,
			unlockedAt: userAchievements.unlockedAt
		})
		.from(userAchievements)
		.innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
		.where(eq(userAchievements.userId, id));
	return result || null;
}

export async function grantAchievement(userId: number, achievementCode: string, isVeteran: boolean) {
	const [achievement] = await db
		.select()
		.from(achievements)
		.where(eq(achievements.code, achievementCode))
		.limit(1);

	if (!achievement) {
		console.warn(`[Achievements] Attempted to grant non-existent code: ${achievementCode}`);
		return ({ success: false, reason: 'NOT_FOUND' });
	}

	if (isVeteran) {
		const [firstWin] = await db
			.select()
			.from(userAchievements)
			.innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
			.where(
				and(
					eq(achievements.code, 'FIRST_WIN'),
					eq(userAchievements.userId, userId)
				)
			)
			.limit(1);

		if (!firstWin) {
			return ({ success: false, reason: 'NOT_MATCH_VETERAN' });
		}
	}

	const [inserted] = await db
		.insert(userAchievements)
		.values({
			userId,
			achievementId: achievement.id,
		})
		.onConflictDoNothing()
		.returning();

	if (!inserted) {
		return ({ success: false, reason: 'ALREADY_UNLOCKED'});
	}

	return ({ success: true, achievement, inserted });
}

