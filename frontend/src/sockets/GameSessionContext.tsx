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
import { useLocation } from 'react-router-dom';
import { API_BASE, WS_URL, gameFrame, lobbyFrame, resyncFrame, type GameActionType, type LobbyFrameType } from './frames';
import { parseEngineSnapshot, type EngineSnapshot, type LobbyState } from '../data/snapshot';
import type { GameState } from '../data/game';

export type CurrentUser = {
	id: number;
	username: string;
	email?: string;
	avatar_url: string | null;
	created_at: string;
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
};

const GameSessionContext = createContext<GameSessionValue | null>(null);

function applyIncomingPayload(payload: any): EngineSnapshot {
	return parseEngineSnapshot(payload);
}

export function GameSessionProvider({ children }: { children: ReactNode }) {
	const location = useLocation();
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
	const [authLoading, setAuthLoading] = useState(true);
	const updateCurrentUser = useCallback((user: CurrentUser) => {
		setCurrentUser(user);
	}, []);
	const [connected, setConnected] = useState(false);
	const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const wsRef = useRef<WebSocket | null>(null);

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
				if (cancelled || !data.user) {
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
	}, [location.pathname]);

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
				setLastError(msg.payload?.message || msg.payload?.code || 'Game error');
				if (msg.payload?.details || msg.payload?.state) {
					setSnapshot(applyIncomingPayload(msg.payload.details ?? msg.payload));
				}
				return;
			}
			if (
				msg.event === 'GAME_STATE_SNAPSHOT' ||
				msg.payload?.state !== undefined ||
				msg.payload?.lobby ||
				msg.payload?.game
			) {
				setLastError(null);
				setSnapshot(applyIncomingPayload(msg.payload));
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
		}),
		[currentUser, authLoading, updateCurrentUser, connected, snapshot, lastError, sendLobby, sendGame]
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
