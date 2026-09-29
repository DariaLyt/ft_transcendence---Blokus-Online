import { db } from '../conn.js';
import { achievements, userAchievements } from '../schema.js';
import { eq } from "drizzle-orm";

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

export async function insertAchievement(userId: number, achievementId: number) {
	const result = await db
		.insert(userAchievements)
		.values({
			userId,
			achievementId,
		})
		.onConflictDoNothing()
		.returning();
	const inserted = result[0];

	if (!inserted) {
		return null;
	}

	const achievement = await db.query.achievements.findFirst({
		where: (achievements, { eq }) =>
		eq(achievements.id, inserted.achievementId),
	});

	return achievement;
}