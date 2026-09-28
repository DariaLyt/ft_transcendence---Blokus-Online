import { addGamePlayer, updatePlayerScore } from '../db/queries/gamePlayers.js';
import { createGame, findGameByEngineId, finishGame } from '../db/queries/game.js';

export async function recordFinishedGame(snapshot: any) {
	const game = snapshot?.game;
	if (!game || game.status !== 'finished' || !game.id) {
		return;
	}

	try {
		const engineId = String(game.id);
		if (await findGameByEngineId(engineId)) {
			return;
		}

		const row = await createGame(engineId);
		if (!row) {
			return;
		}

		for (const seat of game.seats ?? []) {
			const userId = Number(seat.userId);
			if (!Number.isFinite(userId) || seat.kind === 'bot') {
				continue;
			}
			await addGamePlayer(row.id, userId, String(seat.color ?? ''));
			const score = Number(game.scores?.[seat.color] ?? 0);
			await updatePlayerScore(row.id, userId, Number.isFinite(score) ? score : 0);
		}

		await finishGame(row.id);
	} catch (err) {
		console.error('[gameResults] failed to persist finished game:', err);
	}
}
