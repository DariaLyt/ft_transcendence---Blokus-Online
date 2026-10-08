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
import { useNavigate } from 'react-router-dom';
import { API_BASE, WS_URL, gameFrame, lobbyFrame, resyncFrame, type GameActionType, type LobbyFrameType } from './frames';
import { parseEngineSnapshot, snapshotIncludesUser, type EngineSnapshot, type LobbyState } from '../data/snapshot';
import { formatGameError } from '../data/moveErrors';
import type { GameState } from '../data/game';

export type CurrentUser = {
	id: number;
	username: string;
	email: string;
	avatar_url: string | null;
	created_at: string;
};

export type AchievementNotification = {
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
};

export type SpectateSocketMessage = {
	event?: string;
	payload?: {
		message?: string;
		errorCode?: string;
		state?: string;
	};
};

type GameSessionValue = {
	currentUser: CurrentUser | null;
	updateCurrentUser: (user: CurrentUser | null) => void;
	updateProfile: (username: string, email:string) => Promise<void>;
	authLoading: boolean;
	connected: boolean;
	snapshot: EngineSnapshot | null;
	lobby: LobbyState | null;
	game: GameState | null;
	lastError: string | null;
	clearError: () => void;
	connectionLost: boolean;
	sendLobby: (type: LobbyFrameType, extra?: Record<string, unknown>) => void;
	sendGame: (action: GameActionType, payload?: Record<string, unknown>) => void;
	sendSpectate: (action: 'WATCH_GAME' | 'LEAVE_GAME', gameId: string) => void;
	subscribeSpectate: (listener: (message: SpectateSocketMessage) => void) => () => void;
	clearSnapshot: () => void;
	noteLeavingActiveGame: () => void;
	leaveCurrentGame: () => void;
	activeAchievement: AchievementNotification | null;
    clearAchievementPopup: () => void;
	disconnect: () => void;
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
	const updateCurrentUser = useCallback((user: CurrentUser | null) => {
		setCurrentUser(user);
	}, []);
	const updateProfile = useCallback(async (username: string, email: string) => {
    	const response = await fetch(`${API_BASE}/api/users/me`, {
        	method: 'PUT',
        	credentials: 'include',
        	headers: {
            	'Content-Type': 'application/json',
        	},
        	body: JSON.stringify({
            	username,
            	email,
        	}),
    	});

    	if (!response.ok) {
			const errorData = await response.json();
        	throw new Error(errorData.error || 'Failed to update profile');
    }
    	const data = await response.json();
    	updateCurrentUser(data.user);
	}, [updateCurrentUser]);
	const [connected, setConnected] = useState(false);
	const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const [achievementQueue, setAchievementQueue] = useState<AchievementNotification[]>([]);
    const [activeAchievement, setActiveAchievement] = useState<AchievementNotification | null>(null);
	const clearAchievementPopup = useCallback(() => {
		setActiveAchievement(null);
	}, []);
	const wsRef = useRef<WebSocket | null>(null);
	const manualCloses = useRef(new WeakSet<WebSocket>());
	const spectateListenerRef = useRef<((message: SpectateSocketMessage) => void) | null>(null);
	const [connectionLost, setConnectionLost] = useState(false);
	const [socketYielded, setSocketYielded] = useState(false);
	const [connectNonce, setConnectNonce] = useState(0);
	const claimPending = useRef(false);
	const claimSocketRef = useRef<() => void>(() => {});
	const snapshotRef = useRef<EngineSnapshot | null>(null);
	const supersededGameIdRef = useRef<string | null>(null);
	snapshotRef.current = snapshot;
	const currentUserRef = useRef<CurrentUser | null>(null);
	currentUserRef.current = currentUser;
	const navigate = useNavigate();
	const navigateRef = useRef(navigate);
	navigateRef.current = navigate;

	const sendRaw = useCallback((frame: object) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return;
		}
		ws.send(JSON.stringify(frame));
	}, []);

	const disconnect = () => {
		if (wsRef.current) {
			manualCloses.current.add(wsRef.current);
			wsRef.current.close(1000, "User manual logout");
			wsRef.current = null;
		}
	};

	useEffect(() => {
		if (activeAchievement || achievementQueue.length === 0) return;

		const nextAchievement = achievementQueue[0];

		setActiveAchievement(nextAchievement);
		setAchievementQueue((prev: AchievementNotification[]) => prev.slice(1));
	}, [activeAchievement, achievementQueue]);

	useEffect(() => {
		if (!activeAchievement) return;

		const timer = window.setTimeout(() => {
			setActiveAchievement(null);
		}, 5000);

		return () => window.clearTimeout(timer);
	}, [activeAchievement]);

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

		const claimSocket = () => {
			if (document.visibilityState !== 'visible') {
				return;
			}
			const current = wsRef.current;
			if (current && current.readyState <= WebSocket.OPEN) {
				return;
			}
			if (claimPending.current) {
				return;
			}
			claimPending.current = true;
			setConnectNonce((nonce) => nonce + 1);
		};
		claimSocketRef.current = claimSocket;

		window.addEventListener('focus', claimSocket);
		document.addEventListener('visibilitychange', claimSocket);
		return () => {
			window.removeEventListener('focus', claimSocket);
			document.removeEventListener('visibilitychange', claimSocket);
		};
	}, [currentUser]);

	useEffect(() => {
		if (!currentUser) {
			return;
		}
		claimPending.current = false;
		if (document.visibilityState === 'hidden') {
			return;
		}
		if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
			return;
		}

		const socket = new WebSocket(WS_URL);
		wsRef.current = socket;

		socket.onopen = () => {
			setConnected(true);
			setSocketYielded(false);
			setConnectionLost(false);
			socket.send(JSON.stringify(resyncFrame()));
		};

		socket.onmessage = (event) => {
			let msg: { event?: string; payload?: any } = {};
			try {
				msg = JSON.parse(event.data);
			} catch {
				return;
			}
			if (msg.event === 'SOCKET_YIELDED' || msg.event === 'SIGNED_IN_ELSEWHERE') {
				manualCloses.current.add(socket);
				setConnectionLost(false);
				setSocketYielded(true);
				setConnected(false);
				return;
			}
			if (msg.event === 'SPECTATOR_GAME_STATE' || msg.event === 'SPECTATOR_LEFT') {
				spectateListenerRef.current?.(msg);
				return;
			}
			if (msg.event === 'ERROR') {
				if (spectateListenerRef.current) {
					spectateListenerRef.current(msg);
					return;
				}
				setLastError(formatGameError(msg.payload));
				return;
			}

			if (msg.event === 'ACHIEVEMENT_UNLOCKED') {
				const achievementData = msg.payload || msg;
				setAchievementQueue((prev) => [
                    ...prev,
                    {
                        code: achievementData.code,
                        title: achievementData.title,
                        description: achievementData.description,
                        iconUrl: achievementData.iconUrl,
                    },
                ]);
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

		socket.onclose = (event) => {
			setConnected(false);
			if (wsRef.current === socket) {
				wsRef.current = null;
			}
			if (event.code === 4000 || event.code === 4001) {
				manualCloses.current.add(socket);
				setConnectionLost(false);
				setSocketYielded(true);
				return;
			}
			if (!manualCloses.current.has(socket)) {
				setConnectionLost(true);
			}
		};

		return () => {
			manualCloses.current.add(socket);
			socket.close();
			if (wsRef.current === socket) {
				wsRef.current = null;
			}
			setConnected(false);
		};
	}, [currentUser?.id, connectNonce]);

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

	const sendSpectate = useCallback(
		(action: 'WATCH_GAME' | 'LEAVE_GAME', gameId: string) => {
			sendRaw({
				category: 'SPECTATE',
				action,
				payload: { gameId },
			});
		},
		[sendRaw]
	);

	const subscribeSpectate = useCallback((listener: (message: SpectateSocketMessage) => void) => {
		spectateListenerRef.current = listener;
		return () => {
			if (spectateListenerRef.current === listener) {
				spectateListenerRef.current = null;
			}
		};
	}, []);

	const clearSnapshot = useCallback(() => {
		setSnapshot({ status: 'NO_ACTIVE_GAME', lobby: null, game: null });
		setLastError(null);
	}, []);

	const noteLeavingActiveGame = useCallback(() => {
		const current = snapshotRef.current?.game;
		if (current?.id && (current.status === 'active' || current.status === 'finished')) {
			supersededGameIdRef.current = current.id;
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
			updateProfile,
			connected,
			snapshot,
			lobby: snapshot?.lobby ?? null,
			game: snapshot?.game ?? null,
			lastError,
			clearError: () => setLastError(null),
			connectionLost,
			sendLobby,
			sendGame,
			sendSpectate,
			subscribeSpectate,
			clearSnapshot,
			noteLeavingActiveGame,
			leaveCurrentGame,
			activeAchievement,  
            clearAchievementPopup,
			disconnect,
		}),
		[currentUser, authLoading, updateCurrentUser, updateProfile, connected, connectionLost, snapshot, lastError, sendLobby, sendGame, sendSpectate, subscribeSpectate, clearSnapshot, noteLeavingActiveGame, leaveCurrentGame, activeAchievement, clearAchievementPopup, disconnect]
	);

	return (
		<GameSessionContext.Provider value={value}>
			{socketYielded && !connected && currentUser && (
				<button
					type="button"
					onClick={() => claimSocketRef.current()}
					className="fixed top-0 inset-x-0 z-50 px-4 py-2 bg-blue-700 text-white text-sm text-center"
				>
					This tab is paused while another tab is open. Click to play here.
				</button>
			)}
			{connectionLost ? <ConnectionClosed /> : children}
		</GameSessionContext.Provider>
	);
}

function ConnectionClosed() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
			<div className="w-full max-w-[600px] bg-white p-8 rounded-xl shadow-md text-center">
				<h1 className="text-2xl font-bold text-blue-800 mb-3">Connection closed</h1>
				<p className="text-slate-600 mb-6">
					The game connection was closed. Refresh the page to continue.
				</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="px-6 py-3 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
				>
					Refresh
				</button>
			</div>
		</div>
	);
}

export function useGameSession(): GameSessionValue {
	const ctx = useContext(GameSessionContext);
	if (!ctx) {
		throw new Error('useGameSession must be used inside GameSessionProvider');
	}
	return ctx;
}
