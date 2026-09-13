import { sendToUser } from './broadcaster.js';

const watchersByGame = new Map<string, Set<number>>();
const gamesByWatcher = new Map<number, Set<string>>();

export function subscribeToGame(userId: number, gameId: string) {
	const watchers = watchersByGame.get(gameId) ?? new Set<number>();
	watchers.add(userId);
	watchersByGame.set(gameId, watchers);

	const games = gamesByWatcher.get(userId) ?? new Set<string>();
	games.add(gameId);
	gamesByWatcher.set(userId, games);
}

export function unsubscribeFromGame(userId: number, gameId: string) {
	const watchers = watchersByGame.get(gameId);
	if (watchers) {
		watchers.delete(userId);
		if (watchers.size === 0) {
			watchersByGame.delete(gameId);
		}
	}

	const games = gamesByWatcher.get(userId);
	if (games) {
		games.delete(gameId);
		if (games.size === 0) {
			gamesByWatcher.delete(userId);
		}
	}
}

export function unsubscribeFromAllGames(userId: number) {
	const games = gamesByWatcher.get(userId);
	if (!games) return;

	for (const gameId of games) {
		const watchers = watchersByGame.get(gameId);
		watchers?.delete(userId);
		if (watchers?.size === 0) {
			watchersByGame.delete(gameId);
		}
	}

	gamesByWatcher.delete(userId);
}

export function broadcastToGameWatchers(gameId: string, event: string, payload: any) {
	const watchers = watchersByGame.get(gameId);
	if (!watchers) return;

	for (const userId of watchers) {
		sendToUser(userId, event, payload);
	}
}
