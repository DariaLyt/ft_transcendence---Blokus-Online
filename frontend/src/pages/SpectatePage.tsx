import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Navbar from "../components/NavBar";
import Board from "../components/Board";
import GameStatus from "../components/GameStatus";
import PlayersInfo from "../components/PlayersInfo";
import { WS_URL } from "../sockets/frames";
import type { GameState } from "../data/game";

type Snapshot = {
	game?: GameState;
	status?: string;
};

type SocketMessage = {
	event: string;
	payload: {
		success?: boolean;
		errorCode?: string;
		message?: string;
		state?: string;
	};
};

function parseGameState(payload: SocketMessage["payload"]): GameState | null {
	if (!payload.state) return null;

	try {
		const snapshot = JSON.parse(payload.state) as Snapshot;
		return snapshot.game ?? null;
	} catch {
		return null;
	}
}

export default function SpectatePage() {
	const socketRef = useRef<WebSocket | null>(null);
	const [gameId, setGameId] = useState("");
	const [watchedGameId, setWatchedGameId] = useState("");
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [status, setStatus] = useState("Enter a game ID to start watching.");
	const [isConnecting, setIsConnecting] = useState(false);

	useEffect(() => {
		return () => {
			socketRef.current?.close();
		};
	}, []);

	const handleWatch = (event: FormEvent) => {
		event.preventDefault();
		const trimmedGameId = gameId.trim();
		if (!trimmedGameId) return;

		socketRef.current?.close();
		setIsConnecting(true);
		setGameState(null);
		setWatchedGameId(trimmedGameId);
		setStatus("Connecting...");

		const socket = new WebSocket(WS_URL);
		socketRef.current = socket;

		socket.addEventListener("open", () => {
			socket.send(JSON.stringify({
				category: "SPECTATE",
				action: "WATCH_GAME",
				payload: { gameId: trimmedGameId },
			}));
			setStatus("Waiting for game state...");
		});

		socket.addEventListener("message", (message) => {
			const data = JSON.parse(message.data) as SocketMessage;

			if (data.event === "SPECTATOR_GAME_STATE") {
				const nextGameState = parseGameState(data.payload);
				if (!nextGameState) {
					setStatus("Game state could not be loaded.");
					return;
				}
				setGameState(nextGameState);
				setIsConnecting(false);
				setStatus("Live spectator mode");
				return;
			}

			if (data.event === "ERROR") {
				setIsConnecting(false);
				setStatus(data.payload.message || data.payload.errorCode || "Could not watch this game.");
			}
		});

		socket.addEventListener("close", () => {
			setIsConnecting(false);
		});

		socket.addEventListener("error", () => {
			setIsConnecting(false);
			setStatus("Could not connect to the game server.");
		});
	};

	return (
		<div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col">
			<Navbar />

			<main className="flex-1 flex flex-col items-center gap-6 p-6 max-w-7xl mx-auto w-full">
				<form
					onSubmit={handleWatch}
					className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row gap-3"
				>
					<input
						type="text"
						value={gameId}
						onChange={(event) => setGameId(event.target.value)}
						placeholder="Game ID"
						className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						disabled={!gameId.trim() || isConnecting}
						className={`px-6 py-3 rounded-lg text-white ${
							gameId.trim() && !isConnecting
								? "bg-blue-700 hover:bg-blue-800"
								: "bg-slate-300 cursor-not-allowed"
						}`}
					>
						Watch
					</button>
				</form>

				{gameState ? (
					<>
						<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md text-center w-full max-w-2xl">
							<p className="font-bold text-lg">Spectating game {watchedGameId}</p>
							<p className="text-sm text-slate-500 mt-1">{status}</p>
						</div>

						<GameStatus gameState={gameState} />

						<div className="grid grid-cols-1 min-[1400px]:grid-cols-[auto_400px] gap-6 w-full justify-center">
							<Board gameState={gameState} />
							<div className="flex flex-col gap-6">
								<PlayersInfo gameState={gameState} />
							</div>
						</div>
					</>
				) : (
					<div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center w-full max-w-2xl">
						<p className="font-bold text-lg">Spectate</p>
						<p className="text-sm text-slate-500 mt-1">{status}</p>
					</div>
				)}
			</main>
		</div>
	);
}
