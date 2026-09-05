import type { AuthenticatedSocket } from './socketServer.js';
import { IncomingFrameSchema } from '../types/gatewayTypes.js';
import { sendToUser } from './broadcaster.js';
import { z } from 'zod';
import { sendLobbyAction, sendGameAction, getGameState } from '../grpc/gameClient.js';

//temp
// const gameModules: GameModules = {
// 	handleLobbyAction: (userId, action, payload) => {
// 		console.log(`[Lobby Module Mock] User ${userId} -> Action: ${action}`, payload);
// 	},
// 	handleGameAction: (userId, action, payload) => {
// 		console.log(`[Game Module Mock] User ${userId} -> Action: ${action}`, payload);
// 	},
// 	getGameStateSnapshot: (userId) => {
// 		console.log(`[Game Snapshot Mock] Fetching state for User ${userId}`);
// 		return { status: 'NO_ACTIVE_GAME' };
// 	},
// };

function buildLobbyPayload(payload: any) {
    switch (payload.type) {
        case 'CREATE_LOBBY':
            return {
                responseType: 'LOBBY_CREATED',
                data: { createLobby: { userName: payload.userName, maxPlayers: payload.maxPlayers } }
            };
        case 'JOIN_LOBBY':
            return {
                responseType: 'LOBBY_JOINED',
                data: { joinLobby: { userName: payload.userName, lobbyId: payload.lobbyId } }
            };
        case 'TOGGLE_READY':
            return {
                responseType: 'READY_TOGGLED',
                data: { toggleReady: { lobbyId: payload.lobbyId } }
            };
        case 'LEAVE_LOBBY':
            return {
                responseType: 'LOBBY_LEFT',
                data: { leaveLobby: {} }
            };
        case 'BEGIN_READY_CHECK':
            return {
                responseType: 'READY_CHECK_BEGUN',
                data: { beginReadyCheck: { lobbyId: payload.lobbyId } }
            };
        case 'ACCEPT_READY_CHECK':
            return {
                responseType: 'READY_CHECK_ACCEPTED',
                data: { acceptReadyCheck: { lobbyId: payload.lobbyId } }
            };
        case 'DECLINE_READY_CHECK':
            return {
                responseType: 'READY_CHECK_DECLINED',
                data: { declineReadyCheck: { lobbyId: payload.lobbyId } }
            };
        default:
            return null;
    }
}

function buildGamePayload(frame: any) {
	const { action, payload } = frame;
    switch (action) {
        case 'MAKE_MOVE':
            return {
                responseType: 'MOVE_MADE',
                data: { makeMove: { 
					color: payload.color, 
					pieceId: payload.pieceId,
					originX: payload.originX,
					originY: payload.originY,
					rotation: payload.rotation,
					flip: payload.flip 
				} }
            };
        case 'PASS_TURN':
            return {
                responseType: 'TURN_PASSED',
                data: { passTurn: { color: payload.color } }
            };
        case 'DISCONNECT':
            return {
                responseType: 'DISCONNECTED',
                data: { disconnect: {} }
            };
        default:
            return null;
    }
}

export function handleIncomingSocketMessage(
	ws: AuthenticatedSocket,
	rawData: string
	// modules: GameModules = gameModules
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
				const action = buildLobbyPayload(frame.payload);

				if (!action) {
					sendToUser(userId, 'ERROR', { message: 'Unknown lobby action type' });
					break;
				}

				sendLobbyAction(userId, action.data)
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendToUser(userId, 'ERROR', {
							errorCode: goResponse.errorCode,
							message: goResponse.message,
							state: goResponse.state
						});
						return;
					}
					sendToUser(userId, action.responseType, goResponse);
				})
				.catch((err) => {
					console.error('[gRPC Error from Go]:', err.message);
					sendToUser(userId, 'ERROR', {
						message: 'Game engine communication failed',
					});
				});
				
				break;
			}

			case 'GAME': {
				const action = buildGamePayload(frame.payload);

				if (!action) {
					sendToUser(userId, 'ERROR', { message: 'Unknown game action type' });
					break;
				}

				sendGameAction(userId, action.data)
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendToUser(userId, 'ERROR', {
							errorCode: goResponse.errorCode,
							message: goResponse.message,
							state: goResponse.state
						});
						return;
					}
					sendToUser(userId, action.responseType, goResponse);
				})
				.catch((err) => {
					console.error('[gRPC Error from Go]:', err.message);
					sendToUser(userId, 'ERROR', {
						message: 'Game engine communication failed',
					});
				});

				// if (frame.action === 'MAKE_MOVE') {
				// 	sendMoveToGoEngine({
				// 		userId,
				// 		color: frame.payload.color,
				// 		pieceId: frame.payload.pieceId,
				// 		originX: frame.payload.originX,
				// 		originY: frame.payload.originY,
				// 		rotation: frame.payload.rotation || 0,
				// 		flip: frame.payload.flip || false,
				// 	})
				// 	.then((goResponse) => {
				// 		console.log('[gRPC Success from Go]:', goResponse);
				// 		sendToUser(userId, 'MOVE_RESULT', goResponse);
				// 	})
				// 	.catch((err) => {
				// 		console.error('[gRPC Error from Go]:', err.message);
				// 		sendToUser(userId, 'ERROR', {
				// 			message: 'Game engine communication failed',
				// 		});
				// 	});
				// }

				break;
			}

			case 'RESYNC': {
				getGameState(userId)
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendToUser(userId, 'ERROR', {
							errorCode: goResponse.errorCode,
							message: goResponse.message,
							state: goResponse.state
						});
						return;
					}
					sendToUser(userId, 'GAME_STATE_SNAPSHOT', goResponse);
				})
				.catch((err) => {
					console.error('[gRPC Error from Go]:', err.message);
					sendToUser(userId, 'ERROR', {
						message: 'Game engine communication failed',
					});
				});

				break;
			}
		}
	} catch (err) {
		sendToUser(ws.userId, 'ERROR', {
			message: 'Malformed JSON payload',
		});
	}
}