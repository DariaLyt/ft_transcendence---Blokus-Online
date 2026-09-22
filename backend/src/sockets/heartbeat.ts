import { WebSocketServer } from 'ws';
import type { AuthenticatedSocket } from '../types/gatewayTypes.js';
import { removeConnection } from './connectionManager.js';
import { unsubscribeFromAllGames } from './gameSubscriptions.js';

export function setupHeartbeat(wss: WebSocketServer) {
	const interval = setInterval(() => {
		console.log(`[Heartbeat] Running sweep across ${wss.clients.size} clients...`);
    	wss.clients.forEach((ws) => {
			const socket = ws as AuthenticatedSocket;

			if (socket.isAlive === false) {
				console.log(`[Heartbeat] Terminating dead socket for User ${socket.userId}`);
				if (socket.userId) {
					unsubscribeFromAllGames(socket.userId);
					removeConnection(socket.userId);
				}
					return socket.terminate(); 
			}

			socket.isAlive = false;
			socket.ping(); 
		});
	}, 30000); // Run every 30 seconds

	wss.on('close', () => clearInterval(interval));
}
