import type { Color, GameState } from "../data/game";

type BoardProps = {
	gameState: GameState;
};

const cellColors: Record<Color, string> = {
	blue: "bg-blue-600",
	yellow: "bg-yellow-500",
	red: "bg-red-600",
	green: "bg-green-600",
};

export default function Board({ gameState }: BoardProps) {
	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl aspect-square h-full">
			<div className="grid grid-cols-20 bg-slate-300 gap-0.5 p-1 border border-slate-300/80 shadow-inner">
				{gameState.board.flatMap((row, y) =>
					row.map((color, x) => (
						<div
							key={`${x}-${y}`}
							className={`w-full aspect-square ${color ? cellColors[color] : "bg-white"}`}
						/>
					))
				)}
			</div>
		</div>
	);
}
