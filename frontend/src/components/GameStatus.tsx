import { useEffect, useState } from "react";
import type { GameState } from "../data/game";

type GameStatusProps = {
	gameState: GameState;
	currentUserId?: number;
	error?: string | null;
};

function secondsLeft(deadline?: string | null): number {
	if (!deadline) {
		return 0;
	}
	const ms = new Date(deadline).getTime() - Date.now();
	return Math.max(0, Math.ceil(ms / 1000));
}

function formatClock(total: number): string {
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function GameStatus({ gameState, currentUserId, error }: GameStatusProps) {
	const [remaining, setRemaining] = useState(() => secondsLeft(gameState.turnDeadline));
	const currentColor = gameState.currentColor;
	const currentPlayer = gameState.seats.find(
		(seat) => seat.userId === currentUserId
	);
	const currentTurnSeat = gameState.seats.find(
		(seat) => seat.color === currentColor
	);
	const isYourTurn = currentPlayer?.color === currentColor;
	const showTimer =
		gameState.status === "active" &&
		Boolean(gameState.turnDeadline) &&
		currentTurnSeat?.kind !== "bot";

	useEffect(() => {
		setRemaining(secondsLeft(gameState.turnDeadline));
		if (gameState.status !== "active" || !gameState.turnDeadline) {
			return;
		}
		const id = window.setInterval(() => {
			setRemaining(secondsLeft(gameState.turnDeadline));
		}, 250);
		return () => window.clearInterval(id);
	}, [gameState.status, gameState.turnDeadline]);

	let title = "";
	let message = "";

	if (gameState.status === "active") {
		title = isYourTurn ? "Your turn" : `${currentColor}'s turn`;
		message = isYourTurn ? "Place a piece on the board" : "Waiting for them to make their move";
	}
	else if (gameState.status === "finished") {
		title = "Game finished";
		if (gameState.scores) {
			const ranked = [...gameState.seats].sort(
				(a, b) => (gameState.scores?.[b.color] ?? 0) - (gameState.scores?.[a.color] ?? 0)
			);
			const winner = ranked[0];
			const winnerScore = gameState.scores[winner.color] ?? 0;
			message = winner.userId === currentUserId
				? `You won with ${winnerScore} points`
				: `${winner.color} wins with ${winnerScore} points`;
		} else {
			message = "The game has ended";
		}
	}
	else if (gameState.status === "aborted") {
		title = "Game aborted";
		message = "This game is no longer available";
	}

	const urgent = remaining <= 10;

	return (
		<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md text-center w-full max-w-2xl">
			<p className="font-bold text-lg">{title}</p>
			<p className="text-sm text-slate-500 mt-1">{message}</p>
			{showTimer && (
				<div className="mt-3">
					<p
						className={`text-3xl font-bold tabular-nums ${
							urgent ? "text-red-600" : "text-slate-800"
						}`}
					>
						{formatClock(remaining)}
					</p>
					<p className="text-xs text-slate-400 mt-1">
						{isYourTurn
							? remaining === 0
								? "Time's up — a piece will be placed for you"
								: "Time left to place a piece"
							: "Time left this turn"}
					</p>
				</div>
			)}
			{error && (
				<p className="mt-3 text-sm font-medium text-red-600">{error}</p>
			)}
		</div>
	);
}
