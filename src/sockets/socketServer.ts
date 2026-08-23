import { Server as HttpsServer } from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import { parseCookie } from 'cookie';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';

export interface AuthenticatedSocket extends WebSocket {
	userId?: number;
	isAlive?: boolean;
}

export function initWebSocketServer(server: HttpsServer) {
	const wss = new WebSocketServer({ noServer: true });

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
		console.log(`Client connected via WSS (User ID: ${ws.userId})`);

		ws.on('message', (data) => {
			console.log(`Received from user ${ws.userId}:`, data.toString());
		});

		ws.on('close', () => {
			console.log(`Client disconnected (User ID: ${ws.userId})`);
		});
	});

	return wss;
}