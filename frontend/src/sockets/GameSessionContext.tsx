import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { API_BASE, WS_URL, gameFrame, lobbyFrame, resyncFrame, type GameActionType, type LobbyFrameType } from './frames';
import { parseEngineSnapshot, snapshotIncludesUser, type EngineSnapshot, type LobbyState } from '../data/snapshot';
import { formatGameError } from '../data/moveErrors';
import type { GameState } from '../data/game';

export type CurrentUser = {
	id: number;
	username: string;
	email?: string;
	avatar_url: string | null;
	created_at: string;
};

export type AchievementNotification = {
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
};

type GameSessionValue = {
	currentUser: CurrentUser | null;
	updateCurrentUser: (user: CurrentUser) => void;
	authLoading: boolean;
	connected: boolean;
	snapshot: EngineSnapshot | null;
	lobby: LobbyState | null;
	game: GameState | null;
	lastError: string | null;
	clearError: () => void;
	sendLobby: (type: LobbyFrameType, extra?: Record<string, unknown>) => void;
	sendGame: (action: GameActionType, payload?: Record<string, unknown>) => void;
	clearSnapshot: () => void;
	noteLeavingActiveGame: () => void;
	leaveCurrentGame: () => void;
	activeAchievement: AchievementNotification | null;
    clearAchievementPopup: () => void;
};

const GameSessionContext = createContext<GameSessionValue | null>(null);

function gameProgressed(prev: GameState | null | undefined, next: GameState | null | undefined): boolean {
	if (!next) {
		return Boolean(prev);
	}
	if (!prev) {
		return true;
	}
	if (prev.id !== next.id || prev.status !== next.status || prev.currentColor !== next.currentColor) {
		return true;
	}
	for (const color of ['blue', 'yellow', 'red', 'green'] as const) {
		if ((prev.remaining[color] ?? []).join() !== (next.remaining[color] ?? []).join()) {
			return true;
		}
	}
	return false;
}

function applyIncomingPayload(payload: any): EngineSnapshot {
	return parseEngineSnapshot(payload);
}

export function GameSessionProvider({ children }: { children: ReactNode }) {
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
	const [authLoading, setAuthLoading] = useState(true);
	const updateCurrentUser = useCallback((user: CurrentUser) => {
		setCurrentUser(user);
	}, []);
	const [connected, setConnected] = useState(false);
	const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const [activeAchievement, setActiveAchievement] = useState<AchievementNotification | null>(null);
	const clearAchievementPopup = useCallback(() => {
		setActiveAchievement(null);
	}, []);
	const wsRef = useRef<WebSocket | null>(null);
	const snapshotRef = useRef<EngineSnapshot | null>(null);
	const supersededGameIdRef = useRef<string | null>(null);
	snapshotRef.current = snapshot;
	const currentUserRef = useRef<CurrentUser | null>(null);
	currentUserRef.current = currentUser;

	const sendRaw = useCallback((frame: object) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return;
		}
		ws.send(JSON.stringify(frame));
	}, []);

	useEffect(() => {
		let cancelled = false;
		async function loadUser() {
			try {
				const response = await fetch(`${API_BASE}/api/users/me`, {
					credentials: 'include',
				});
				if (!response.ok) {
					if (!cancelled) {
						setCurrentUser(null);
					}
					return;
				}
				const data = await response.json();
            	if (cancelled) {
                	return;
            	}

            	if (!data.user) {
                	setCurrentUser(null);
                	return;
            	}
				setCurrentUser({
					id: data.user.id,
					username: data.user.username,
					email: data.user.email,
					avatar_url: data.user.avatar_url,
					created_at: data.user.created_at,
				});
			} catch {
				if (!cancelled) {
					setCurrentUser(null);
				}
			} finally {
				if (!cancelled)
					setAuthLoading(false);
			}
		}
		void loadUser();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!currentUser) {
			return;
		}
		if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
			return;
		}

		const socket = new WebSocket(WS_URL);
		wsRef.current = socket;

		socket.onopen = () => {
			setConnected(true);
			socket.send(JSON.stringify(resyncFrame()));
		};

		socket.onmessage = (event) => {
			let msg: { event?: string; payload?: any } = {};
			try {
				msg = JSON.parse(event.data);
			} catch {
				return;
			}
			if (msg.event === 'ERROR') {
				setLastError(formatGameError(msg.payload));
				return;
			}

			if (msg.event === 'ACHIEVEMENT_UNLOCKED') {
				const achievementData = msg.payload || msg;
				setActiveAchievement({
					code: achievementData.code,
					title: achievementData.title,
					description: achievementData.description,
					iconUrl: achievementData.iconUrl,
				});

				setTimeout(() => {
					setActiveAchievement(null);
				}, 5000);
				return;
			}

			if (
				msg.event === 'GAME_STATE_SNAPSHOT' ||
				msg.payload?.state !== undefined ||
				msg.payload?.lobby ||
				msg.payload?.game
			) {
				let next = applyIncomingPayload(msg.payload);
				const leftGameId = supersededGameIdRef.current;
				if (
					leftGameId &&
					(next.game?.id === leftGameId || next.lobby?.id === leftGameId)
				) {
					return;
				}
				if (next.game && next.lobby && next.game.id !== next.lobby.id) {
					next = { ...next, game: null };
				}
				const currentLobby = snapshotRef.current?.lobby;
				if (
					next.game &&
					!next.lobby &&
					currentLobby &&
					currentLobby.id !== next.game.id &&
					currentLobby.status !== 'in_game'
				) {
					return;
				}
				if (next.status === 'NO_ACTIVE_GAME' || (!next.lobby && !next.game)) {
					setLastError(null);
					setSnapshot(next);
					return;
				}
				const userId = currentUserRef.current?.id;
				if (userId != null && !snapshotIncludesUser(next, userId)) {
					return;
				}
				if (gameProgressed(snapshotRef.current?.game, next.game)) {
					setLastError(null);
				}
				setSnapshot(next);
			}
		};

		socket.onclose = () => {
			setConnected(false);
			if (wsRef.current === socket) {
				wsRef.current = null;
			}
		};

		return () => {
			socket.close();
			if (wsRef.current === socket) {
				wsRef.current = null;
			}
			setConnected(false);
		};
	}, [currentUser?.id]);

	const shouldPoll =
		snapshot?.game?.status === 'active' || snapshot?.lobby?.status === 'ready_check';

	useEffect(() => {
		if (!shouldPoll) {
			return;
		}
		const id = window.setInterval(() => {
			sendRaw(resyncFrame());
		}, 400);
		return () => window.clearInterval(id);
	}, [shouldPoll, sendRaw]);

	const sendLobby = useCallback(
		(type: LobbyFrameType, extra: Record<string, unknown> = {}) => {
			sendRaw(lobbyFrame(type, extra));
		},
		[sendRaw]
	);

	const sendGame = useCallback(
		(action: GameActionType, payload: Record<string, unknown> = {}) => {
			sendRaw(gameFrame(action, payload));
		},
		[sendRaw]
	);

	const clearSnapshot = useCallback(() => {
		setSnapshot({ status: 'NO_ACTIVE_GAME', lobby: null, game: null });
		setLastError(null);
	}, []);

	const noteLeavingActiveGame = useCallback(() => {
		const active = snapshotRef.current?.game;
		if (active?.status === 'active' && active.id) {
			supersededGameIdRef.current = active.id;
		}
	}, []);

	const leaveCurrentGame = useCallback(() => {
		noteLeavingActiveGame();
		sendRaw(lobbyFrame('LEAVE_LOBBY'));
		setSnapshot({ status: 'NO_ACTIVE_GAME', lobby: null, game: null });
		setLastError(null);
	}, [noteLeavingActiveGame, sendRaw]);

	const value = useMemo<GameSessionValue>(
		() => ({
			currentUser,
			authLoading,
			updateCurrentUser,
			connected,
			snapshot,
			lobby: snapshot?.lobby ?? null,
			game: snapshot?.game ?? null,
			lastError,
			clearError: () => setLastError(null),
			sendLobby,
			sendGame,
			clearSnapshot,
			noteLeavingActiveGame,
			leaveCurrentGame,
			activeAchievement,  
            clearAchievementPopup,
		}),
		[currentUser, authLoading, updateCurrentUser, connected, snapshot, lastError, sendLobby, sendGame, clearSnapshot, noteLeavingActiveGame, leaveCurrentGame, activeAchievement, clearAchievementPopup]
	);

	return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession(): GameSessionValue {
	const ctx = useContext(GameSessionContext);
	if (!ctx) {
		throw new Error('useGameSession must be used inside GameSessionProvider');
	}
	return ctx;
}
