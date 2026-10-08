import { useRef, useState } from "react";
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

const ghostOverlay: Record<Color, string> = {
	blue: "bg-blue-400/80 shadow-[inset_0_0_0_2px_white]",
	yellow: "bg-yellow-200/85 shadow-[inset_0_0_0_2px_white]",
	red: "bg-red-400/80 shadow-[inset_0_0_0_2px_white]",
	green: "bg-green-400/80 shadow-[inset_0_0_0_2px_white]",
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
	const gridRef = useRef<HTMLDivElement>(null);
	const suppressClick = useRef(false);
	const touchGesture = useRef<{
		alreadyThere: boolean;
		moved: boolean;
		startX: number;
		startY: number;
	} | null>(null);
	const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
	const ghostCells =
		selectedPiece && canPlace && hover
			? orientedCells(selectedPiece.shape, rotation, flip)
					.map((c) => ({
						x: c.x + hover.x,
						y: c.y + hover.y,
					}))
					.filter((c) => c.x >= 0 && c.y >= 0 && c.x < size && c.y < size)
			: [];
	const last = size - 1;

	function cellFromClient(clientX: number, clientY: number) {
		const el = gridRef.current;
		if (!el) {
			return null;
		}
		const rect = el.getBoundingClientRect();
		const styles = getComputedStyle(el);
		const padLeft = parseFloat(styles.paddingLeft) || 0;
		const padTop = parseFloat(styles.paddingTop) || 0;
		const padRight = parseFloat(styles.paddingRight) || 0;
		const padBottom = parseFloat(styles.paddingBottom) || 0;
		const gapX = parseFloat(styles.columnGap) || 0;
		const gapY = parseFloat(styles.rowGap) || 0;
		const innerW = rect.width - padLeft - padRight;
		const innerH = rect.height - padTop - padBottom;
		const localX = clientX - rect.left - padLeft;
		const localY = clientY - rect.top - padTop;
		if (localX < 0 || localY < 0 || localX >= innerW || localY >= innerH) {
			return null;
		}
		const cellW = (innerW - gapX * (size - 1)) / size;
		const cellH = (innerH - gapY * (size - 1)) / size;
		const next = {
			x: Math.min(size - 1, Math.max(0, Math.floor(localX / (cellW + gapX)))),
			y: Math.min(size - 1, Math.max(0, Math.floor(localY / (cellH + gapY)))),
		};
		setHover((prev) => (prev?.x === next.x && prev?.y === next.y ? prev : next));
		return next;
	}

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
				ref={gridRef}
				className="relative grid bg-slate-300 gap-0.5 p-1 border border-slate-300/80 shadow-inner h-full select-none"
				style={{
					gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
					touchAction: canPlace ? "none" : "auto",
				}}
				onPointerDown={(event) => {
					if (!canPlace) {
						return;
					}
					const cell = cellFromClient(event.clientX, event.clientY);
					if (!cell || event.pointerType === "mouse") {
						return;
					}
					touchGesture.current = {
						alreadyThere: hover?.x === cell.x && hover?.y === cell.y,
						moved: false,
						startX: event.clientX,
						startY: event.clientY,
					};
					suppressClick.current = true;
					event.currentTarget.setPointerCapture(event.pointerId);
				}}
				onPointerMove={(event) => {
					if (!canPlace) {
						return;
					}
					if (event.pointerType === "mouse") {
						cellFromClient(event.clientX, event.clientY);
						return;
					}
					const gesture = touchGesture.current;
					if (!gesture) {
						return;
					}
					if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 8) {
						gesture.moved = true;
					}
					cellFromClient(event.clientX, event.clientY);
				}}
				onPointerUp={(event) => {
					if (event.pointerType === "mouse") {
						return;
					}
					const gesture = touchGesture.current;
					touchGesture.current = null;
					if (!gesture || !canPlace) {
						return;
					}
					const cell = cellFromClient(event.clientX, event.clientY);
					if (cell && (gesture.moved || gesture.alreadyThere)) {
						onPlace?.(cell.x, cell.y);
						setHover(null);
					}
				}}
				onPointerLeave={(event) => {
					if (event.pointerType === "mouse") {
						setHover(null);
					}
				}}
			>
				{Array.from({ length: size * size }, (_, index) => {
					const x = index % size;
					const y = Math.floor(index / size);
					const occupied = cells[y]?.[x] ?? null;
					const corner = startingCorner(x, y);
					return (
						<button
							key={index}
							type="button"
							disabled={!canPlace || !onPlace}
							onClick={() => {
								if (suppressClick.current) {
									suppressClick.current = false;
									return;
								}
								onPlace?.(x, y);
							}}
							className={`w-full aspect-square ${
								occupied ? cellColor[occupied] : "bg-white"
							} ${corner ? cornerRing[corner] : ""} ${canPlace ? "cursor-pointer" : "cursor-default"}`}
						/>
					);
				})}
				{ghostCells.length > 0 && (
					<div
						className="pointer-events-none absolute inset-0 grid gap-0.5 p-1"
						style={{
							gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
							gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
						}}
					>
						{ghostCells.map((cell) => (
							<div
								key={`${cell.x},${cell.y}`}
								className={ghostOverlay[ghostColor]}
								style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }}
							/>
						))}
					</div>
				)}
			</div>
			</div>
		</div>
	);
}
