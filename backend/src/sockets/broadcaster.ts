import { getSocketByUserId, forEachConnection } from './connectionManager.js';

export function sendToUser(userId: number, event: string, payload: any): boolean {
	const ws = getSocketByUserId(userId);
	if (!ws || ws.readyState !== ws.OPEN) return false;

	ws.send(JSON.stringify({ event, payload }));
	return true;
}

export function sendToUsers(userIds: number[], event: string, payload: any): void {
	const serialized = JSON.stringify({ event, payload });

	userIds.forEach((userId) => {
		const ws = getSocketByUserId(userId);
		if (ws && ws.readyState === ws.OPEN) {
			ws.send(serialized);
		}
	});
}

export function broadcastAll(event: string, payload: any, excludeUserId?: number): void {
	const serialized = JSON.stringify({ event, payload });

	forEachConnection((ws, userId) => {
		if (excludeUserId && userId === excludeUserId) return;
		if (ws.readyState === ws.OPEN) {
			ws.send(serialized);
		}
	});
}
