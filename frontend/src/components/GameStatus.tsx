import type { GameState } from "../data/game";

type GameStatusProps = {
	gameState: GameState;
	currentUserId?: number;
}; // passing information that exists in Game page to this Game status

export default function GameStatus({ gameState, currentUserId }: GameStatusProps) {
	const currentColor = gameState.currentColor;
	const currentPlayer = gameState.seats.find(
		(seat) => seat.userId === currentUserId
	);
	const isYourTurn = currentPlayer?.color === currentColor;
	let title = "";
	let message = "";

	if (gameState.status === "active") {
		title = isYourTurn ? "Your turn" : `${currentColor}'s turn`;
		message = isYourTurn ? "Place a piece on the board" : "Waiting for them to make their move";
	}
	else if (gameState.status === "finished") {
		title = "Game finished";
		message = "The game has ended";
	}
	else if (gameState.status === "aborted") {
		title = "Game aborted";
		message = "This game is no longer available";
	}

	return (
		<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md text-center w-full max-w-2xl">
			<p className="font-bold text-lg">{title}</p> 
			<p className="text-sm text-slate-500 mt-1">{message}</p>
		</div>
	);
}