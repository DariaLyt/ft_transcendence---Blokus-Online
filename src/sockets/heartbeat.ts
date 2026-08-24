import { WebSocketServer } from 'ws';
import { AuthenticatedSocket } from './socketServer';
import { removeConnection } from './connectionManager';

export function setupHeartbeat(wss: WebSocketServer) {
	const interval = setInterval(() => {
		console.log(`[Heartbeat] Running sweep across ${wss.clients.size} clients...`);
    	wss.clients.forEach((ws) => {
			const socket = ws as AuthenticatedSocket;

			if (socket.isAlive === false) {
				console.log(`[Heartbeat] Terminating dead socket for User ${socket.userId}`);
				if (socket.userId) removeConnection(socket.userId);
					return socket.terminate(); 
			}

			socket.isAlive = false;
			socket.ping(); 
		});
	}, 30000); // Run every 30 seconds

	wss.on('close', () => clearInterval(interval));
}