const MOVE_ERRORS: Record<string, string> = {
	FIRST_CORNER_REQUIRED: 'Your first piece must cover your starting corner.',
	NO_CORNER_TOUCH: 'The piece must touch your color by a corner.',
	EDGE_TOUCH_OWN: 'Your pieces cannot share an edge with each other.',
	CELL_OCCUPIED: 'That square is already taken.',
	OUT_OF_BOUNDS: 'That piece would go off the board.',
	PIECE_USED: 'You no longer have that piece.',
	NOT_YOUR_TURN: 'It is not your turn.',
	NOT_YOUR_COLOR: 'That is not your color.',
	COLOR_PASSED: 'You have already passed.',
	INVALID_ROTATION: 'Invalid rotation.',
	GAME_NOT_ACTIVE: 'The game is not active.',
	UNKNOWN_PIECE: 'Unknown piece.',
};

export function formatGameError(payload: { message?: string; code?: string } | null | undefined): string {
	const code = String(payload?.code || '').trim();
	if (code && MOVE_ERRORS[code]) {
		return MOVE_ERRORS[code];
	}
	const raw = String(payload?.message || '').trim();
	if (!raw) {
		return 'That move is not allowed.';
	}
	const prefix = raw.split(':')[0]?.trim();
	if (prefix && MOVE_ERRORS[prefix]) {
		return MOVE_ERRORS[prefix];
	}
	const withoutCode = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1).trim() : raw;
	return withoutCode || 'That move is not allowed.';
}
