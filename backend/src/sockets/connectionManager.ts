import type { AuthenticatedSocket } from '../types/gatewayTypes.js';

const activeConnections = new Map<number, AuthenticatedSocket>();
const disconnectTimers = new Map<number, NodeJS.Timeout>();

const DISCONNECT_GRACE_PERIOD_MS = 30000; // 30 seconds

export function addConnection(userId: number, socket: AuthenticatedSocket) {
	if (disconnectTimers.has(userId)) {
		clearTimeout(disconnectTimers.get(userId));
		disconnectTimers.delete(userId);
		console.log(`[Grace Period] User ${userId} reconnected within 30s. Timer cleared.`);
	}
	const previous = activeConnections.get(userId);
	activeConnections.set(userId, socket);
	console.log(`[Registry] Added User ${userId}. Total Active: ${activeConnections.size}`);
	if (previous && previous !== socket) {
		if (previous.readyState === previous.OPEN) {
			previous.send(JSON.stringify({
				event: 'SIGNED_IN_ELSEWHERE',
				payload: { message: 'You signed in somewhere else.' },
			}));
		}
		previous.close(4000, 'SIGNED_IN_ELSEWHERE');
	}
}

export function removeConnection(userId: number) {
	activeConnections.delete(userId);
	console.log(`[Registry] Removed User ${userId}. Total Active: ${activeConnections.size}`);
}

export function getSocketByUserId(userId: number): AuthenticatedSocket | undefined {
	return activeConnections.get(userId);
}

export function isUserOnline(userId: number): boolean {
  	return activeConnections.has(userId);
}

export function getAllActiveUserIds(): number[] {
  	return Array.from(activeConnections.keys());
}

export function forEachConnection(callback: (socket: AuthenticatedSocket, userId: number) => void) {
  	activeConnections.forEach((socket, userId) => callback(socket, userId));
}

export function handlePlayerDisconnect(
	userId: number,
  	onFinalDisconnect: (userId: number) => void
): void {
	removeConnection(userId);

	if (disconnectTimers.has(userId)) {
		clearTimeout(disconnectTimers.get(userId));
	}

	const timer = setTimeout(() => {
		disconnectTimers.delete(userId);
		console.log(`[Grace Period Expired] User ${userId} did not reconnect in 30s.`);
		onFinalDisconnect(userId);
	}, DISCONNECT_GRACE_PERIOD_MS);

	disconnectTimers.set(userId, timer);
}