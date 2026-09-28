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
	const last = size - 1;

	function startingCorner(x: number, y: number): Color | null {
		if (x === 0 && y === 0) {
			return "blue";
		}
		if (x === last && y === 0) {
			return "yellow";
		}
		if (x === last && y === last) {
			return "red";
		}
		if (x === 0 && y === last) {
			return "green";
		}
		return null;
	}

	const cornerRing: Record<Color, string> = {
		blue: "ring-2 ring-inset ring-blue-600",
		yellow: "ring-2 ring-inset ring-yellow-400",
		red: "ring-2 ring-inset ring-red-600",
		green: "ring-2 ring-inset ring-green-600",
	};

	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl aspect-square h-full">
			<div
				className="h-full rounded-md p-[6px]"
				style={{
					backgroundImage: [
						"linear-gradient(#2563eb,#2563eb)",
						"linear-gradient(#facc15,#facc15)",
						"linear-gradient(#facc15,#facc15)",
						"linear-gradient(#dc2626,#dc2626)",
						"linear-gradient(#dc2626,#dc2626)",
						"linear-gradient(#16a34a,#16a34a)",
						"linear-gradient(#16a34a,#16a34a)",
						"linear-gradient(#2563eb,#2563eb)",
					].join(","),
					backgroundSize: [
						"50% 6px",
						"50% 6px",
						"6px 50%",
						"6px 50%",
						"50% 6px",
						"50% 6px",
						"6px 50%",
						"6px 50%",
					].join(","),
					backgroundPosition: [
						"top left",
						"top right",
						"top right",
						"bottom right",
						"bottom right",
						"bottom left",
						"bottom left",
						"top left",
					].join(","),
					backgroundRepeat: "no-repeat",
				}}
			>
			<div
				className="grid bg-slate-300 gap-0.5 p-1 border border-slate-300/80 shadow-inner h-full"
				style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
				onMouseLeave={() => setHover(null)}
			>
				{Array.from({ length: size * size }, (_, index) => {
					const x = index % size;
					const y = Math.floor(index / size);
					const occupied = cells[y]?.[x] ?? null;
					const ghost = !occupied && ghostSet.has(`${x},${y}`);
					const corner = startingCorner(x, y);
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
							} ${corner ? cornerRing[corner] : ""} ${canPlace ? "cursor-pointer" : "cursor-default"}`}
						/>
					);
				})}
			</div>
			</div>
		</div>
	);
}
