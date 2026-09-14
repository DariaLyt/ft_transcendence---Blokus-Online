export const API_BASE = 'https://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://localhost:3000';

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
	return {
		category: 'LOBBY' as const,
		payload: { type, ...extra },
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
