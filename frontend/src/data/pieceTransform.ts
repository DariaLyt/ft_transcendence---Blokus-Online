import type { Piece } from './pieces';

export type Rotation = 0 | 90 | 180 | 270;

type Cell = { x: number; y: number };

function normalize(cells: Cell[]): Cell[] {
	if (cells.length === 0) {
		return cells;
	}
	let minX = cells[0].x;
	let minY = cells[0].y;
	for (const c of cells) {
		if (c.x < minX) minX = c.x;
		if (c.y < minY) minY = c.y;
	}
	return cells.map((c) => ({ x: c.x - minX, y: c.y - minY }));
}

function shapeToCells(shape: number[][]): Cell[] {
	const cells: Cell[] = [];
	for (let y = 0; y < shape.length; y++) {
		for (let x = 0; x < shape[y].length; x++) {
			if (shape[y][x] === 1) {
				cells.push({ x, y });
			}
		}
	}
	return cells;
}

export function orientedCells(shape: number[][], rotation: Rotation, flip: boolean): Cell[] {
	let cells = shapeToCells(shape);
	cells = normalize(cells);
	if (flip) {
		cells = normalize(cells.map((c) => ({ x: -c.x, y: c.y })));
	}
	const turns = rotation / 90;
	for (let i = 0; i < turns; i++) {
		cells = normalize(cells.map((c) => ({ x: c.y, y: -c.x })));
	}
	return cells;
}

export function findPiece(pieces: Piece[], id: string): Piece | undefined {
	return pieces.find((p) => p.id === id);
}
