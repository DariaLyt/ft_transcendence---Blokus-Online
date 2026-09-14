import type { AuthenticatedSocket } from './socketServer.js';
import { IncomingFrameSchema, type GameModules } from '../types/gatewayTypes.js';
import { sendToUser, sendToUsers } from './broadcaster.js'; // [NEW]
import { z } from 'zod';
import { sendLobbyAction, sendGameAction, getGameState, getGameStateById } from '../grpc/gameClient.js';
import {
	broadcastToGameWatchers,
	subscribeToGame,
	unsubscribeFromGame,
} from './gameSubscriptions.js';

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
            // [OLD]
            // return {
            //     responseType: 'LOBBY_CREATED',
            //     data: { createLobby: { userName: payload.userName, maxPlayers: payload.maxPlayers } }
            // };
            // [NEW] oneof field for Go proto (username, not userName)
            return {
                createLobby: { username: payload.userName, maxPlayers: payload.maxPlayers }
            };
        case 'JOIN_LOBBY':
            // [OLD]
            // return {
            //     responseType: 'LOBBY_JOINED',
            //     data: { joinLobby: { userName: payload.userName, lobbyId: payload.lobbyId } }
            // };
            return { // [NEW]
                joinLobby: { username: payload.userName, lobbyId: payload.lobbyId }
            };
        case 'TOGGLE_READY':
            // [OLD]
            // return {
            //     responseType: 'READY_TOGGLED',
            //     data: { toggleReady: { lobbyId: payload.lobbyId } }
            // };
            return { // [NEW]
                toggleReady: { lobbyId: payload.lobbyId }
            };
        case 'LEAVE_LOBBY':
            // [OLD]
            // return {
            //     responseType: 'LOBBY_LEFT',
            //     data: { leaveLobby: {} }
            // };
            return { // [NEW]
                leaveLobby: {}
            };
        case 'BEGIN_READY_CHECK':
            // [OLD]
            // return {
            //     responseType: 'READY_CHECK_BEGUN',
            //     data: { beginReadyCheck: { lobbyId: payload.lobbyId } }
            // };
            return { // [NEW]
                beginReadyCheck: { lobbyId: payload.lobbyId }
            };
        case 'ACCEPT_READY_CHECK':
            // [OLD]
            // return {
            //     responseType: 'READY_CHECK_ACCEPTED',
            //     data: { acceptReadyCheck: { lobbyId: payload.lobbyId } }
            // };
            return { // [NEW]
                acceptReadyCheck: { lobbyId: payload.lobbyId }
            };
        case 'DECLINE_READY_CHECK':
            // [OLD]
            // return {
            //     responseType: 'READY_CHECK_DECLINED',
            //     data: { declineReadyCheck: { lobbyId: payload.lobbyId } }
            // };
            return { // [NEW]
                declineReadyCheck: { lobbyId: payload.lobbyId }
            };
        default:
            return null;
    }
}

function buildGamePayload(frame: any) {
	const { action, payload } = frame;
    switch (action) {
        case 'MAKE_MOVE':
            // [OLD]
            // return {
            //     responseType: 'MOVE_MADE',
            //     data: { makeMove: {
            //         color: payload.color,
            //         pieceId: payload.pieceId,
            //         originX: payload.originX,
            //         originY: payload.originY,
            //         rotation: payload.rotation,
            //         flip: payload.flip
            //     } }
            // };
            return { // [NEW]
                makeMove: {
					color: payload.color,
					pieceId: payload.pieceId,
					originX: payload.originX,
					originY: payload.originY,
					rotation: payload.rotation,
					flip: payload.flip
				}
            };
        case 'PASS_TURN':
            // [OLD]
            // return {
            //     responseType: 'TURN_PASSED',
            //     data: { passTurn: { color: payload.color } }
            // };
            return { // [NEW]
                passTurn: { color: payload.color }
            };
        case 'DISCONNECT':
            // [OLD]
            // return {
            //     responseType: 'DISCONNECTED',
            //     data: { disconnect: {} }
            // };
            return { // [NEW]
                disconnect: {}
            };
        default:
            return null;
    }
}

function gameIdFromResponse(goResponse: any): string | null {
	if (!goResponse?.state) return null;

	try {
		const snapshot = JSON.parse(goResponse.state);
		return snapshot?.game?.id ?? snapshot?.lobby?.id ?? null;
	} catch {
		return null;
	}
}

function sendGoError(userId: number, goResponse: any) {
	sendToUser(userId, 'ERROR', {
		errorCode: goResponse.errorCode,
		message: goResponse.message,
		state: goResponse.state,
	});
}

function broadcastSpectatorState(goResponse: any) {
	const gameId = gameIdFromResponse(goResponse);
	if (!gameId) return;

	broadcastToGameWatchers(gameId, 'SPECTATOR_GAME_STATE', goResponse);
}

// [NEW] parse Go ActionResponse.state JSON before broadcasting
function parseSnapshot(resp: any): any {
	const raw = resp?.state;
	if (typeof raw === 'string' && raw !== '') {
		try {
			return JSON.parse(raw);
		} catch {
			return { status: 'NO_ACTIVE_GAME' };
		}
	}
	if (raw && typeof raw === 'object') {
		return raw;
	}
	if (resp?.lobby || resp?.game) {
		return resp;
	}
	return { status: 'NO_ACTIVE_GAME' };
}

// [NEW] collect every human user id in the lobby/game so all clients get the snapshot
function userIdsFromSnapshot(snapshot: any, fallbackUserId: number): number[] {
	const ids = new Set<number>();
	for (const player of snapshot?.lobby?.players ?? []) {
		const n = Number(player?.userId);
		if (Number.isFinite(n)) {
			ids.add(n);
		}
	}
	for (const seat of snapshot?.game?.seats ?? []) {
		const n = Number(seat?.userId);
		if (Number.isFinite(n)) {
			ids.add(n);
		}
	}
	if (ids.size === 0) {
		ids.add(fallbackUserId);
	}
	return [...ids];
}

// [NEW]
function isEngineFailure(resp: any): boolean {
	if (!resp) {
		return true;
	}
	if (resp.success === true) {
		return false;
	}
	if (resp.success === false) {
		return true;
	}
	return Boolean(resp.error_code || resp.errorCode || resp.message);
}

// [NEW] unified GAME_STATE_SNAPSHOT to all involved users; ERROR to the actor on failure
function broadcastEngineResult(userId: number, resp: any) {
	const snapshot = parseSnapshot(resp);
	const targets = userIdsFromSnapshot(snapshot, userId);

	if (isEngineFailure(resp)) {
		sendToUser(userId, 'ERROR', {
			message: resp?.message || 'Game engine rejected the action',
			code: resp?.error_code || resp?.errorCode,
			details: snapshot,
		});
	}

	sendToUsers(targets, 'GAME_STATE_SNAPSHOT', snapshot);
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

				// [OLD] sendLobbyAction(userId, action.data)
				sendLobbyAction(userId, action) // [NEW]
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendGoError(userId, goResponse);
						return;
					}
					broadcastSpectatorState(goResponse);
					broadcastEngineResult(userId, goResponse); // [NEW]
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
				const action = buildGamePayload(frame);

				if (!action) {
					sendToUser(userId, 'ERROR', { message: 'Unknown game action type' });
					break;
				}

				// [OLD] sendGameAction(userId, action.data)
				sendGameAction(userId, action) // [NEW]
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendGoError(userId, goResponse);
						return;
					}
					broadcastSpectatorState(goResponse);
					broadcastEngineResult(userId, goResponse); // [NEW]
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

			case 'SPECTATE': {
				const gameId = frame.payload.gameId.trim();

				if (frame.action === 'LEAVE_GAME') {
					unsubscribeFromGame(userId, gameId);
					sendToUser(userId, 'SPECTATOR_LEFT', { gameId });
					break;
				}

				getGameStateById(gameId)
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendGoError(userId, goResponse);
						return;
					}
					subscribeToGame(userId, gameId);
					sendToUser(userId, 'SPECTATOR_GAME_STATE', goResponse);
				})
				.catch((err) => {
					console.error('[gRPC Error from Go]:', err.message);
					sendToUser(userId, 'ERROR', {
						message: 'Game engine communication failed',
					});
				});

				break;
			}

			case 'RESYNC': {
				getGameState(userId)
				.then((goResponse) => {
					console.log('[gRPC Success from Go]:', goResponse);
					if (!goResponse.success) {
						sendGoError(userId, goResponse);
						return;
					}
					broadcastEngineResult(userId, goResponse); // [NEW]
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
