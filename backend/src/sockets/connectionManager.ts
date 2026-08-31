import type { AuthenticatedSocket } from './socketServer.js';

const activeConnections = new Map<number, AuthenticatedSocket>();

export function addConnection(userId: number, socket: AuthenticatedSocket) {
	activeConnections.set(userId, socket);
	console.log(`[Registry] Added User ${userId}. Total Active: ${activeConnections.size}`);
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