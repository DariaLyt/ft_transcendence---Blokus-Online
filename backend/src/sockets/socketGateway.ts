import type { AuthenticatedSocket } from './socketServer.js';
import { IncomingFrameSchema, type GameModules } from '../types/gatewayTypes.js';
import { sendToUser } from './broadcaster.js';
import { z } from 'zod';

//temp
const gameModules: GameModules = {
	handleLobbyAction: (userId, action, payload) => {
		console.log(`[Lobby Module Mock] User ${userId} -> Action: ${action}`, payload);
	},
	handleGameAction: (userId, action, payload) => {
		console.log(`[Game Module Mock] User ${userId} -> Action: ${action}`, payload);
	},
	getGameStateSnapshot: (userId) => {
		console.log(`[Game Snapshot Mock] Fetching state for User ${userId}`);
		return { status: 'NO_ACTIVE_GAME' };
	},
};

export function handleIncomingSocketMessage(
	ws: AuthenticatedSocket,
	rawData: string,
	modules: GameModules = gameModules
) {
	if (!ws.userId) return;

	try {
		const json = JSON.parse(rawData);
		const parseResult = IncomingFrameSchema.safeParse(json);

		if (!parseResult.success) {
			return sendToUser(ws.userId, 'ERROR', {
				message: 'Invalid message payload structure',
				details: z.treeifyError(parseResult.error),
			});
		}

		const frame = parseResult.data;

		switch (frame.category) {
			case 'LOBBY': {
				const action = frame.payload.type;
				modules.handleLobbyAction(ws.userId, action, frame.payload);
				break;
			}

			case 'GAME': {
				modules.handleGameAction(ws.userId, frame.action, frame.payload);
				break;
			}

			case 'RESYNC': {
				const snapshot = modules.getGameStateSnapshot(ws.userId);
				sendToUser(ws.userId, 'GAME_STATE_SNAPSHOT', snapshot);
				break;
			}
		}
	} catch (err) {
		sendToUser(ws.userId, 'ERROR', {
			message: 'Malformed JSON payload',
		});
	}
}