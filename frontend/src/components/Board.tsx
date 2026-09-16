import { useState } from "react";
import type { Color, GameState } from "../data/game";
import { orientedCells, type Rotation } from "../data/pieceTransform";
import type { Piece } from "../data/pieces";

type BoardProps = {
	board?: (Color | null)[][];
	gameState?: GameState;
	selectedPiece?: Piece | null;
	rotation?: Rotation;
	flip?: boolean;
	canPlace?: boolean;
	ghostColor?: Color;
	onPlace?: (x: number, y: number) => void;
};

const cellColor: Record<Color, string> = {
	blue: "bg-blue-600",
	yellow: "bg-yellow-400",
	red: "bg-red-600",
	green: "bg-green-600",
};

const ghostTint: Record<Color, string> = {
	blue: "bg-blue-400/40",
	yellow: "bg-yellow-300/50",
	red: "bg-red-400/40",
	green: "bg-green-400/40",
};

export default function Board({
	board,
	gameState,
	selectedPiece,
	rotation = 0,
	flip = false,
	canPlace = false,
	ghostColor = "blue",
	onPlace,
}: BoardProps) {
	const size = 20;
	const cells = board ?? gameState?.board ?? [];
	const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
	const ghostCells =
		selectedPiece && canPlace && hover
			? orientedCells(selectedPiece.shape, rotation, flip).map((c) => ({
					x: c.x + hover.x,
					y: c.y + hover.y,
				}))
			: [];
	const ghostSet = new Set(ghostCells.map((c) => `${c.x},${c.y}`));

	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl aspect-square h-full">
			<div
				className="grid bg-slate-300 gap-0.5 p-1 border border-slate-300/80 shadow-inner"
				style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
				onMouseLeave={() => setHover(null)}
			>
				{Array.from({ length: size * size }, (_, index) => {
					const x = index % size;
					const y = Math.floor(index / size);
					const occupied = cells[y]?.[x] ?? null;
					const ghost = !occupied && ghostSet.has(`${x},${y}`);
					return (
						<button
							key={index}
							type="button"
							disabled={!canPlace || !onPlace}
							onMouseEnter={() => setHover({ x, y })}
							onClick={() => onPlace?.(x, y)}
							className={`w-full aspect-square ${
								occupied
									? cellColor[occupied]
									: ghost
										? ghostTint[ghostColor]
										: "bg-white"
							} ${canPlace ? "cursor-pointer" : "cursor-default"}`}
						/>
					);
				})}
			</div>
		</div>
	);
}
