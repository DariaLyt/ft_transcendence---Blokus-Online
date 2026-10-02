import { db } from '../conn.js';
import { achievements } from '../schema.js';

const INITIAL_ACHIEVEMENTS = [
  { code: 'FIRST_GAME', title: 'Block Party', description: 'Complete your first Blokus match.', iconUrl: '/uploads/achievements/first-game.png' },
  { code: 'FIRST_WIN', title: 'First Blood', description: 'Win your first Blokus match.', iconUrl: '/uploads/achievements/first-win.png' },
  { code: 'SOCIAL_BUTTERFLY', title: 'Social Butterfly', description: 'Add your first friend on the platform.', iconUrl: '/uploads/achievements/social.png' },
  { code: 'AVATAR_UPLOADED', title: 'Fashionista', description: 'Upload a custom profile avatar.', iconUrl: '/uploads/achievements/avatar.png' },
  { code: 'MATCH_VETERAN', title: 'Veteran', description: 'Complete 2 matches.', iconUrl: '/uploads/achievements/veteran.png' },
];

export async function seedAchievements() {
	try {
		for (const ach of INITIAL_ACHIEVEMENTS) {
			await db
				.insert(achievements)
				.values({
					code: ach.code,
					title: ach.title,
					description: ach.description,
					iconUrl: ach.iconUrl
				})
				.onConflictDoNothing()
		}
		console.log('[Seed] Achievements verified successfully.');
	} catch (err) {
		console.error('[Seed] Failed to seed achievements:', err);
	}
}
