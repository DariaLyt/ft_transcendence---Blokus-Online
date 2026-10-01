import { finishGame, type FinishedParticipant } from '../db/queries/game.js';
import { unlockAchievementForUser } from '../controllers/achievementController.js';

const COLORS = ['blue', 'yellow', 'red', 'green'] as const;

type Color = (typeof COLORS)[number];

function isColor(value: unknown): value is Color {
	return COLORS.includes(value as Color);
}

function seatUserId(seat: any): number | null {
	if (seat?.kind === 'bot') {
		return null;
	}
	const n = Number(seat?.userId);
	if (!Number.isInteger(n) || n <= 0) {
		return null;
	}
	return n;
}

function participantsFromSnapshot(game: any): FinishedParticipant[] {
	const gameLastMove = game.lastMove ?? null;
	return (game.seats ?? [])
		.map((seat: any) => {
			if (!isColor(seat?.color)) {
				return null;
			}
			const score = Number(game.scores?.[seat.color] ?? 0);
			return {
				userId: seatUserId(seat),
				color: seat.color,
				score: Number.isFinite(score) ? score : 0,
			} satisfies FinishedParticipant;
		})
		.filter((row: FinishedParticipant | null): row is FinishedParticipant => row != null);
}

export async function recordFinishedGame(snapshot: any) {
	const game = snapshot?.game;
	if (!game || game.status !== 'finished' || !game.id) {
		return;
	}

	const participants = participantsFromSnapshot(game);
	if (participants.length === 0) {
		return;
	}

	try {
		await finishGame(String(game.id), participants);

		for (const player of participants) {
            await unlockAchievementForUser(player.userId!, 'FIRST_GAME').catch(() => null);
        }

		const highestScore = Math.max(...participants.map(p => p.score ?? 0));
		const winners = participants.filter(p => (p.score ?? 0) === highestScore);
		for (const winner of winners) {
			await unlockAchievementForUser(winner.userId!, 'FIRST_WIN').catch(() => null);
			await unlockAchievementForUser(winner.userId!, 'MATCH_VETERAN', true).catch(() => null);
		}
	} catch (err) {
		console.error('[gameResults] failed to persist finished game:', err);
	}
}
