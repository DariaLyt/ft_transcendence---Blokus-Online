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

	return (
		<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md text-center w-full max-w-2xl">
			<p className="font-bold text-lg">{isYourTurn ? "Your turn" : `${currentColor}'s turn`}</p> 
			<p className="text-sm text-slate-500 mt-1">{isYourTurn ? "Place a piece on the board"
			: "Waiting for them to make their move"}
			</p>
		</div>
	);
}