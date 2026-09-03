import type { AuthenticatedSocket } from './socketServer.js';
import { IncomingFrameSchema, type GameModules } from '../types/gatewayTypes.js';
import { sendToUser } from './broadcaster.js';
import { z } from 'zod';
import { sendMoveToGoEngine } from '../grpc/gameClient.js';

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

		const userId = ws.userId;
		if (!userId) {
			console.error('[WS Error]: User ID is missing.');
			return;
		}

		switch (frame.category) {
			case 'LOBBY': {
				// if (frame.payload.type == 'CREATE_LOBBY') {
				// 	sendLobbyCreation({
						
				// 	})
				// }
				break;
			}

			case 'GAME': {
				if (frame.action === 'MAKE_MOVE') {
					// const userId = ws.userId;
					// if (!userId) {
					// 	console.error('[WS Error]: User ID is missing.');
					// 	break;
					// }

					sendMoveToGoEngine({
						userId: userId,
						color: frame.payload.color,
						pieceId: frame.payload.pieceId,
						originX: frame.payload.originX,
						originY: frame.payload.originY,
						rotation: frame.payload.rotation || 0,
						flip: frame.payload.flip || false,
					})
					.then((goResponse) => {
						console.log('[gRPC Success from Go]:', goResponse);
						sendToUser(userId, 'MOVE_RESULT', goResponse);
					})
					.catch((err) => {
						console.error('[gRPC Error from Go]:', err.message);
						sendToUser(userId, 'ERROR', {
							message: 'Game engine communication failed',
						});
					});
				}
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