package game

type PieceID string

const (
	Piece1  PieceID = "1"  // monomino
	Piece2  PieceID = "2"  // domino
	PieceI3 PieceID = "I3" // straight tromino
	PieceV3 PieceID = "V3" // V tromino
	PieceI4 PieceID = "I4" // straight tetromino
	PieceO4 PieceID = "O4" // square tetromino
	PieceT4 PieceID = "T4" // T tetromino
	PieceL4 PieceID = "L4" // L tetromino
	PieceS4 PieceID = "S4" // S/Z skew tetromino
	PieceF  PieceID = "F"  // F pentomino
	PieceI5 PieceID = "I5" // straight pentomino
	PieceL5 PieceID = "L5" // L pentomino
	PieceN  PieceID = "N"  // N pentomino
	PieceP  PieceID = "P"  // P pentomino
	PieceT5 PieceID = "T5" // T pentomino
	PieceU  PieceID = "U"  // U pentomino
	PieceV5 PieceID = "V5" // V pentomino
	PieceW  PieceID = "W"  // W pentomino
	PieceX  PieceID = "X"  // X pentomino
	PieceY  PieceID = "Y"  // Y pentomino
	PieceZ  PieceID = "Z"  // Z pentomino
)

var AllPieceIDs = []PieceID{
	Piece1, Piece2,
	PieceI3, PieceV3,
	PieceI4, PieceO4, PieceT4, PieceL4, PieceS4,
	PieceF, PieceI5, PieceL5, PieceN, PieceP, PieceT5, PieceU, PieceV5, PieceW, PieceX, PieceY, PieceZ,
}


type Piece struct {
	ID    PieceID
	Cells []Cell 
	Size  int    
}

var baseShapes = map[PieceID][]Cell{
	// #
	Piece1: {{0, 0}},

	// ##
	Piece2: {{0, 0}, {1, 0}},

	// ###
	PieceI3: {{0, 0}, {1, 0}, {2, 0}},

	// #
	// ##
	PieceV3: {{0, 0}, {0, 1}, {1, 1}},

	// ####
	PieceI4: {{0, 0}, {1, 0}, {2, 0}, {3, 0}},

	// ##
	// ##
	PieceO4: {{0, 0}, {1, 0}, {0, 1}, {1, 1}},

	// ###
	//  #
	PieceT4: {{0, 0}, {1, 0}, {2, 0}, {1, 1}},

	// #
	// #
	// ##
	PieceL4: {{0, 0}, {0, 1}, {0, 2}, {1, 2}},

	//  ##
	// ##
	PieceS4: {{1, 0}, {2, 0}, {0, 1}, {1, 1}},

	//  ##
	// ##
	//  #
	PieceF: {{1, 0}, {2, 0}, {0, 1}, {1, 1}, {1, 2}},

	// #####
	PieceI5: {{0, 0}, {1, 0}, {2, 0}, {3, 0}, {4, 0}},

	// #
	// #
	// #
	// ##
	PieceL5: {{0, 0}, {0, 1}, {0, 2}, {0, 3}, {1, 3}},

	//  #
	//  #
	// ##
	// #
	PieceN: {{1, 0}, {1, 1}, {0, 2}, {1, 2}, {0, 3}},

	// ##
	// ##
	// #
	PieceP: {{0, 0}, {1, 0}, {0, 1}, {1, 1}, {0, 2}},

	// ###
	//  #
	//  #
	PieceT5: {{0, 0}, {1, 0}, {2, 0}, {1, 1}, {1, 2}},

	// # #
	// ###
	PieceU: {{0, 0}, {2, 0}, {0, 1}, {1, 1}, {2, 1}},

	// #
	// #
	// ###
	PieceV5: {{0, 0}, {0, 1}, {0, 2}, {1, 2}, {2, 2}},

	// #
	// ##
	//  ##
	PieceW: {{0, 0}, {0, 1}, {1, 1}, {1, 2}, {2, 2}},

	//  #
	// ###
	//  #
	PieceX: {{1, 0}, {0, 1}, {1, 1}, {2, 1}, {1, 2}},

	//  #
	// ####
	PieceY: {{1, 0}, {0, 1}, {1, 1}, {2, 1}, {3, 1}},

	// ##
	//  #
	//  ##
	PieceZ: {{0, 0}, {1, 0}, {1, 1}, {1, 2}, {2, 2}},
}

func GetPiece(id PieceID) (Piece, bool) {
	cells, ok := baseShapes[id]
	if !ok {
		return Piece{}, false
	}
	out := make([]Cell, len(cells))
	copy(out, cells)
	return Piece{ID: id, Cells: out, Size: len(out)}, true
}

func MustGetPiece(id PieceID) Piece {
	p, ok := GetPiece(id)
	if !ok {
		panic("unknown piece: " + string(id))
	}
	return p
}

func FullTray() []string {
	tray := make([]string, len(AllPieceIDs))
	for i, id := range AllPieceIDs {
		tray[i] = string(id)
	}
	return tray
}

func NewFullRemaining() map[Color][]string {
	return map[Color][]string{
		ColorBlue:   FullTray(),
		ColorYellow: FullTray(),
		ColorRed:    FullTray(),
		ColorGreen:  FullTray(),
	}
}

func PieceSize(id PieceID) int {
	cells, ok := baseShapes[id]
	if !ok {
		return 0
	}
	return len(cells)
}

const TotalSquaresPerColor = 89

func Footprint(id PieceID, rotation Rotation, flipped bool) ([]Cell, error) {
	base, ok := baseShapes[id]
	if !ok {
		return nil, &MoveError{Code: ErrUnknownPiece, Message: "unknown piece id: " + string(id)}
	}
	return Transform(base, rotation, flipped)
}

func AbsoluteCells(move Move) ([]Cell, error) {
	local, err := Footprint(PieceID(move.PieceID), move.Rotation, move.Flipped)
	if err != nil {
		return nil, err
	}
	out := make([]Cell, len(local))
	for i, c := range local {
		out[i] = Cell{X: move.X + c.X, Y: move.Y + c.Y}
	}
	return out, nil
}
