// Shapes must match game/pieces.go baseShapes (same cells at rotation 0, flip off).
export interface Piece {
	id: string;
	name: string;
	shape: number[][];
}

export const PIECES: Piece[] = [
	{
		id: "1",
		name: "Small boy",
		shape: [[1]],
	},
	{
		id: "2",
		name: "Two piece",
		shape: [[1, 1]],
	},
	{
		id: "I3",
		name: "Three piece",
		shape: [[1, 1, 1]],
	},
	{
		id: "V3",
		name: "Corner 3",
		shape: [
			[1, 0],
			[1, 1],
		],
	},
	{
		id: "I4",
		name: "Long 4",
		shape: [[1, 1, 1, 1]],
	},
	{
		id: "O4",
		name: "Square",
		shape: [
			[1, 1],
			[1, 1],
		],
	},
	{
		id: "T4",
		name: "Small T",
		shape: [
			[1, 1, 1],
			[0, 1, 0],
		],
	},
	{
		id: "L4",
		name: "Small L",
		shape: [
			[1, 0],
			[1, 0],
			[1, 1],
		],
	},
	{
		id: "S4",
		name: "Small zig zag",
		shape: [
			[0, 1, 1],
			[1, 1, 0],
		],
	},
	{
		id: "F",
		name: "F shape",
		shape: [
			[0, 1, 1],
			[1, 1, 0],
			[0, 1, 0],
		],
	},
	{
		id: "I5",
		name: "Long boy",
		shape: [[1, 1, 1, 1, 1]],
	},
	{
		id: "L5",
		name: "Big L",
		shape: [
			[1, 0],
			[1, 0],
			[1, 0],
			[1, 1],
		],
	},
	{
		id: "N",
		name: "Big zig zag",
		shape: [
			[0, 1],
			[0, 1],
			[1, 1],
			[1, 0],
		],
	},
	{
		id: "P",
		name: "P shape",
		shape: [
			[1, 1],
			[1, 1],
			[1, 0],
		],
	},
	{
		id: "T5",
		name: "Big T",
		shape: [
			[1, 1, 1],
			[0, 1, 0],
			[0, 1, 0],
		],
	},
	{
		id: "U",
		name: "Bridge",
		shape: [
			[1, 0, 1],
			[1, 1, 1],
		],
	},
	{
		id: "V5",
		name: "V shape",
		shape: [
			[1, 0, 0],
			[1, 0, 0],
			[1, 1, 1],
		],
	},
	{
		id: "W",
		name: "Stairs",
		shape: [
			[1, 0, 0],
			[1, 1, 0],
			[0, 1, 1],
		],
	},
	{
		id: "X",
		name: "Cross",
		shape: [
			[0, 1, 0],
			[1, 1, 1],
			[0, 1, 0],
		],
	},
	{
		id: "Y",
		name: "Tree with branch",
		shape: [
			[0, 1, 0, 0],
			[1, 1, 1, 1],
		],
	},
	{
		id: "Z",
		name: "Z shape",
		shape: [
			[1, 1, 0],
			[0, 1, 0],
			[0, 1, 1],
		],
	},
];
