import type { Color, GameState, Seat } from './game';

export type LobbyStatus = 'waiting' | 'ready_check' | 'in_game';

export type LobbyPlayer = {
	userId: string;
	username: string;
	isReady: boolean;
	isHost: boolean;
	accepted: boolean;
};

export type LobbyState = {
	id: string;
	maxPlayers: number;
	status: LobbyStatus;
	players: LobbyPlayer[];
	createdAt?: string;
	readyDeadline?: string | null;
};

export type EngineSnapshot = {
	status?: string;
	lobby: LobbyState | null;
	game: GameState | null;
};

const COLORS: Color[] = ['blue', 'yellow', 'red', 'green'];

function asNumber(value: unknown): number | undefined {
	if (value == null || value === '') {
		return undefined;
	}
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function normalizeSeat(raw: any): Seat {
	return {
		color: raw?.color,
		kind: raw?.kind === 'bot' ? 'bot' : 'human',
		userId: asNumber(raw?.userId),
	};
}

function emptyRemaining(): GameState['remaining'] {
	return { blue: [], yellow: [], red: [], green: [] };
}

function emptyPassed(): GameState['passed'] {
	return { blue: false, yellow: false, red: false, green: false };
}

export function normalizeGameState(raw: any): GameState | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	const remaining = emptyRemaining();
	for (const color of COLORS) {
		remaining[color] = Array.isArray(raw.remaining?.[color]) ? raw.remaining[color] : [];
	}
	const passed = emptyPassed();
	for (const color of COLORS) {
		passed[color] = Boolean(raw.passed?.[color]);
	}
	return {
		id: String(raw.id ?? ''),
		mode: raw.mode ?? 'M4P',
		board: Array.isArray(raw.board) ? raw.board : [],
		seats: Array.isArray(raw.seats) ? raw.seats.map(normalizeSeat) : [],
		remaining,
		currentColor: raw.currentColor ?? 'blue',
		passed,
		status: raw.status ?? 'active',
		scores: raw.scores,
	};
}

export function normalizeLobby(raw: any): LobbyState | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	return {
		id: String(raw.id ?? ''),
		maxPlayers: Number(raw.maxPlayers ?? 4),
		status: raw.status ?? 'waiting',
		players: Array.isArray(raw.players)
			? raw.players.map((p: any) => ({
					userId: String(p.userId ?? ''),
					username: p.username ?? '',
					isReady: Boolean(p.isReady),
					isHost: Boolean(p.isHost),
					accepted: Boolean(p.accepted),
				}))
			: [],
		createdAt: raw.createdAt,
		readyDeadline: raw.readyDeadline ?? null,
	};
}

export function parseEngineSnapshot(payload: any): EngineSnapshot {
	let body = payload;
	if (payload && typeof payload.state === 'string') {
		try {
			body = JSON.parse(payload.state);
		} catch {
			body = {};
		}
	} else if (payload && typeof payload.state === 'object' && payload.state) {
		body = payload.state;
	}

	if (body?.status === 'NO_ACTIVE_GAME') {
		return { status: 'NO_ACTIVE_GAME', lobby: null, game: null };
	}

	return {
		status: body?.status,
		lobby: normalizeLobby(body?.lobby),
		game: normalizeGameState(body?.game),
	};
}

export function userIdsFromSnapshot(snapshot: EngineSnapshot): number[] {
	const ids = new Set<number>();
	for (const player of snapshot.lobby?.players ?? []) {
		const n = asNumber(player.userId);
		if (n != null) {
			ids.add(n);
		}
	}
	for (const seat of snapshot.game?.seats ?? []) {
		if (seat.userId != null) {
			ids.add(seat.userId);
		}
	}
	return [...ids];
}

export function isEngineFailure(resp: any): boolean {
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
