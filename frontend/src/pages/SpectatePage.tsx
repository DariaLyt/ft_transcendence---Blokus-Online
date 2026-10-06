import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Navbar from "../components/NavBar";
import Board from "../components/Board";
import GameStatus from "../components/GameStatus";
import PlayersInfo from "../components/PlayersInfo";
import PiecesTray from "../components/PiecesTray";
import { useGameSession } from "../sockets/GameSessionContext";
import type { SpectateSocketMessage } from "../sockets/GameSessionContext";
import type { GameState } from "../data/game";

type Snapshot = {
	game?: GameState;
	status?: string;
};

function parseGameState(payload: SpectateSocketMessage["payload"]): GameState | null {
	if (!payload?.state) return null;

	try {
		const snapshot = JSON.parse(payload.state) as Snapshot;
		return snapshot.game ?? null;
	} catch {
		return null;
	}
}

export default function SpectatePage() {
	const { connected, sendSpectate, subscribeSpectate } = useGameSession();
	const watchedRef = useRef("");
	const [gameId, setGameId] = useState("");
	const [watchedGameId, setWatchedGameId] = useState("");
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [status, setStatus] = useState("Enter a lobby ID to start watching.");
	const [isConnecting, setIsConnecting] = useState(false);
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		return subscribeSpectate((message) => {
			if (message.event === "SPECTATOR_GAME_STATE") {
				const nextGameState = parseGameState(message.payload);
				if (!nextGameState) {
					setIsConnecting(false);
					setStatus("Game state could not be loaded.");
					return;
				}
				setGameState(nextGameState);
				setIsConnecting(false);
				setStatus("Live spectator mode");
				return;
			}
			if (message.event === "ERROR") {
				setIsConnecting(false);
				setGameState(null);
				setStatus(message.payload?.message || message.payload?.errorCode || "Could not watch this game.");
			}
		});
	}, [subscribeSpectate]);

	useEffect(() => {
		return () => {
			if (watchedRef.current) {
				sendSpectate("LEAVE_GAME", watchedRef.current);
			}
		};
	}, [sendSpectate]);

	const handleWatch = (event: FormEvent) => {
		event.preventDefault();
		setError("");
		const code = gameId.trim().toUpperCase();
		if (code.length < 1 || code.length > 8) {
			setError("Lobby ID must be between 1 and 8 characters");
			return;
		}
		if (!connected) {
			setError("Not connected to the game server.");
			return;
		}
		if (watchedRef.current && watchedRef.current !== code) {
			sendSpectate("LEAVE_GAME", watchedRef.current);
		}
		setIsConnecting(true);
		setGameState(null);
		setWatchedGameId(code);
		watchedRef.current = code;
		setStatus("Waiting for game state...");
		sendSpectate("WATCH_GAME", code);
	};

	return (
		<div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col">
			<Navbar />

			<main className="flex-1 flex flex-col items-center gap-6 p-6 max-w-7xl mx-auto w-full">
				<form
					onSubmit={handleWatch}
					className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col gap-3"
				>
					<div>
						<label
							htmlFor="spectateLobbyId"
							className="block text-sm font-medium text-slate-700 mb-2"
						>
							Lobby ID
						</label>
						<input
							id="spectateLobbyId"
							type="text"
							value={gameId}
							onChange={(event) =>
								setGameId(event.target.value.toUpperCase())
							}
							placeholder="e.g. 7K3M2P"
							maxLength={8}
							autoCapitalize="characters"
							autoComplete="off"
							spellCheck={false}
							className="w-full px-4 py-3 border border-slate-300 rounded-lg font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{error && (
							<p role="alert" className="text-red-600 text-sm mt-2">
								{error}
							</p>
						)}
					</div>
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
							<Board
								board={gameState.board}
								canPlace={false}
								/>
							<div className="flex flex-col gap-6">
								<PlayersInfo gameState={gameState} />
								<PiecesTray
									gameState={gameState}
									viewColor={gameState.currentColor}
									selectedPiece={selectedPiece}
									onSelect={setSelectedPiece}
									canSelect={false}
									/>
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
