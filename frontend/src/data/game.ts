// Defines objects needed for the game logic

export type Color = "blue" | "yellow" | "red" | "green";

export type Seat = {
	color: Color;
	kind: "human" | "bot";
	userId?: number; // humans have userId but bots don't
};

export type GameState = {
	id: string;
	mode: "M4P" | "M1P3B" | "M2P2B" | "M3P1B";
	board: (Color | null)[][]; // array of arrays where each cell is either a Color or null
	seats: Seat[];
	remaining: Record<Color, string[]>; // to know which pieces the current player still has
	currentColor: Color;
	passed: Record<Color, boolean>; // to know which color has passed their turn
	status: "lobby" | "active" | "finished" | "aborted";
	scores?: Record<Color, number>;
};