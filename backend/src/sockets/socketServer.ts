import { Server as HttpsServer } from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import { parseCookie } from 'cookie';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.js';
import { setupHeartbeat } from './heartbeat.js';
import { addConnection, handlePlayerDisconnect } from './connectionManager.js';
import { handleIncomingSocketMessage } from './socketGateway.js';
import { notifyFriendsStatusChange } from '../services/presenceService.js';
import { sendGameAction } from '../grpc/gameClient.js';

export interface AuthenticatedSocket extends WebSocket {
	userId?: number;
	isAlive?: boolean;
}

export function initWebSocketServer(server: HttpsServer) {
	const wss = new WebSocketServer({ noServer: true });

	setupHeartbeat(wss);

	server.on('upgrade', (request, socket, head) => {
		const cookies = parseCookie(request.headers.cookie || '');
		const token = cookies.auth_token;

		if (!token) {
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
			socket.destroy();
			return;
		}

		try {
			const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
			
			wss.handleUpgrade(request, socket, head, (ws) => {
				const authWs = ws as AuthenticatedSocket;
				authWs.userId = decoded.userId;
				authWs.isAlive = true;
				wss.emit('connection', authWs, request);
			});
		} catch (err) {
			socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
			socket.destroy();
		}
	});

	wss.on('connection', (ws: AuthenticatedSocket) => {
		if (!ws.userId) return ws.terminate();
		const userId = ws.userId;

		addConnection(userId, ws);
		console.log(`Client connected via WSS (User ID: ${userId})`);

		notifyFriendsStatusChange(userId, true);

		ws.on('pong', () => {
			ws.isAlive = true;
		});

		ws.on('message', (data) => {
			handleIncomingSocketMessage(ws, data.toString());
		});

		ws.on('close', () => {
			console.log(`[WS] Connection closed for user ${userId}`);

			handlePlayerDisconnect(userId, async (finalUserId) => {
				console.log(`[Presence] Processing final offline state for user ${finalUserId}`);
				await notifyFriendsStatusChange(finalUserId, false);
				sendGameAction(finalUserId, {
					responseType: 'DISCONNECTED',
					data: { disconnect: {} }
				});
			});
					});
	});

	return wss;
}