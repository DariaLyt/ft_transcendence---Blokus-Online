//Define how every piece object will look like
export interface Piece {
	id: string;
	name: string;
	shape: number[][]; // 2D array of 1 and 0
}

export const PIECES: Piece[] = [
{
  id: 'L-3',
  name: 'Corner 3',
  shape: [
    [1, 0],
    [1, 1]
  ]
},
{
  id: 'I-5',
  name: 'Long boy',
  shape: [
    [1, 1, 1, 1, 1]
  ]
},
{
  id: 'L-5',
  name: 'Big L',
  shape: [
    [1, 0],
	  [1, 0],
	  [1, 0],
    [1, 1]
  ]
},
{
  id: 'C-5',
  name: 'Bridge',
  shape: [
    [1, 1, 1],
    [1, 0, 1]
  ]
},
{
  id: 'V-5',
  name: 'V shape',
  shape: [
    [1, 0, 0],
    [1, 0, 0],
	  [1, 1, 1]
  ]
},
{
  id: 'X-5',
  name: 'Cross',
  shape: [
    [0, 1, 0],
    [1, 1, 1],
	  [0, 1, 0]
  ]
},
{
  id: 'I-1',
  name: 'Small boy',
  shape: [
    [1]
  ]
},
{
  id: 'SQ-4',
  name: 'Square',
  shape: [
    [1, 1],
    [1, 1]
  ]
},
{
  id: 'I-4',
  name: 'Long 4',
  shape: [
    [1, 1, 1, 1]
  ]
},
{
  id: 'W-5',
  name: 'Stairs',
  shape: [
	  [1, 0, 0],
  	[1, 1, 0],
  	[0, 1, 1]
  ]
},
{
  id: 'L-4',
  name: 'Small L',
  shape: [
    [1, 0],
	  [1, 0],
    [1, 1]
  ]
},
{
  id: 'Y-5',
  name: 'Tree with branch',
  shape: [
    [1, 0],
    [1, 1],
	  [1, 0],
	  [1, 0]
  ]
},
{
  id: 'Z-5',
  name: 'Z shape',
  shape: [
    [1, 1, 0],
    [0, 1, 0],
	  [0, 1, 1],
  ]
},
{
  id: 'P-5',
  name: 'P shape',
  shape: [
    [1, 1],
    [1, 1],
	  [1, 0]
  ]
},
{
  id: 'T-5',
  name: 'Big T',
  shape: [
    [1, 1, 1],
    [0, 1, 0],
	  [0, 1, 0]
  ]
},
{
  id: 'F-5',
  name: 'F shape',
  shape: [
    [1, 1, 0],
    [0, 1, 1],
	  [0, 1, 0]
  ]
},
{
  id: 'I-2',
  name: 'Two piece',
  shape: [
    [1, 1]
  ]
},
{
  id: 'I-3',
  name: 'Three piece',
  shape: [
    [1, 1, 1]
  ]
},
{
  id: 'Z-4',
  name: 'Small zig zag',
  shape: [
    [0, 1, 1],
    [1, 1, 0]
  ]
},
{
  id: 'T-4',
  name: 'Small T',
  shape: [
    [1, 1, 1],
    [0, 1, 0]
  ]
},
{
  id: 'N-5',
  name: 'Big zig zag',
  shape: [
	[0, 1],
	[1, 1],
	[1, 0],
	[1, 0]
  ]
}
];