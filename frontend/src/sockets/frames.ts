export const API_BASE = '';
export const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export type LobbyFrameType =
	| 'CREATE_LOBBY'
	| 'JOIN_LOBBY'
	| 'TOGGLE_READY'
	| 'LEAVE_LOBBY'
	| 'BEGIN_READY_CHECK'
	| 'ACCEPT_READY_CHECK'
	| 'DECLINE_READY_CHECK';

export type GameActionType = 'MAKE_MOVE' | 'PASS_TURN' | 'DISCONNECT';

export function lobbyFrame(type: LobbyFrameType, extra: Record<string, unknown> = {}) {
	const payload: Record<string, unknown> = { type, ...extra };
	if (typeof payload.lobbyId === 'string') {
		payload.lobbyId = payload.lobbyId.trim();
	}
	return {
		category: 'LOBBY' as const,
		payload,
	};
}

export function gameFrame(action: GameActionType, payload: Record<string, unknown> = {}) {
	return {
		category: 'GAME' as const,
		action,
		payload,
	};
}

export function resyncFrame() {
	return { category: 'RESYNC' as const };
}
