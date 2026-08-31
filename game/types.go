package game

type Color string

const (
	ColorBlue   Color = "blue"
	ColorYellow Color = "yellow"
	ColorRed    Color = "red"
	ColorGreen  Color = "green"
)

// Fixed turn order based on colors
var AllColors = []Color{ColorBlue, ColorYellow, ColorRed, ColorGreen}

type GameMode string

const (
	ModeM4P   GameMode = "M4P"   // 4 humans, 1 color each
	ModeM1P3B GameMode = "M1P3B" // 1 human, 3 bots
	ModeM2P2B GameMode = "M2P2B" // 2 humans, 2 bots
	ModeM3P1B GameMode = "M3P1B" // 3 humans, 1 bot
)

type SeatKind string

const (
	SeatHuman SeatKind = "human"
	SeatBot   SeatKind = "bot"
)

type GameStatus string

const (
	StatusLobby    GameStatus = "lobby"
	StatusActive   GameStatus = "active"
	StatusFinished GameStatus = "finished"
	StatusAborted  GameStatus = "aborted"
)

const BoardSize = 20

type Rotation int

const (
	Rot0   Rotation = 0
	Rot90  Rotation = 90
	Rot180 Rotation = 180
	Rot270 Rotation = 270
)

type Cell struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Seat struct {
	Color Color    `json:"color"`
	Kind  SeatKind `json:"kind"`
	UserID *string `json:"userId,omitempty"` // userid for humans, nil for bots
}

type Move struct {
	Color    Color    `json:"color"`
	PieceID  string   `json:"pieceId"`
	Rotation Rotation `json:"rotation"`
	Flipped  bool     `json:"flipped"`
	X        int      `json:"x"`
	Y        int      `json:"y"`
}

type GameState struct {
	ID   string   `json:"id"`
	Mode GameMode `json:"mode"`
	Board [][]*Color `json:"board"`
	Seats []Seat     `json:"seats"`
	Remaining map[Color][]string `json:"remaining"`
	CurrentColor Color `json:"currentColor"`
	Passed map[Color]bool `json:"passed"`
	Status GameStatus     `json:"status"`
	Scores map[Color]int `json:"scores,omitempty"`
}

type CreateGameRequest struct {
	Mode  GameMode          `json:"mode"`
	Seats []CreateSeatInput `json:"seats"`
}

type CreateSeatInput struct {
	Color  Color   `json:"color"`
	UserID *string `json:"userId,omitempty"`
	Kind   SeatKind `json:"kind,omitempty"`
}

type MoveErrorCode string

const (
	ErrOutOfBounds    MoveErrorCode = "OUT_OF_BOUNDS"
	ErrEdgeTouchOwn   MoveErrorCode = "EDGE_TOUCH_OWN"
	ErrNoCornerTouch  MoveErrorCode = "NO_CORNER_TOUCH"
	ErrFirstCorner    MoveErrorCode = "FIRST_CORNER_REQUIRED"
	ErrPieceUsed      MoveErrorCode = "PIECE_USED"
	ErrUnknownPiece   MoveErrorCode = "UNKNOWN_PIECE"
	ErrNotYourTurn    MoveErrorCode = "NOT_YOUR_TURN"
	ErrNotYourColor   MoveErrorCode = "NOT_YOUR_COLOR"
	ErrGameNotActive  MoveErrorCode = "GAME_NOT_ACTIVE"
	ErrCellOccupied   MoveErrorCode = "CELL_OCCUPIED"
	ErrColorPassed    MoveErrorCode = "COLOR_PASSED"
	ErrInvalidRotation MoveErrorCode = "INVALID_ROTATION"
)

type MoveError struct {
	Code    MoveErrorCode `json:"code"`
	Message string        `json:"message"`
}

func (e *MoveError) Error() string {
	if e.Message != "" {
		return string(e.Code) + ": " + e.Message
	}
	return string(e.Code)
}

func StartingCorner(c Color) (Cell, bool) {
	switch c {
	case ColorBlue:
		return Cell{X: 0, Y: 0}, true
	case ColorYellow:
		return Cell{X: BoardSize - 1, Y: 0}, true
	case ColorRed:
		return Cell{X: BoardSize - 1, Y: BoardSize - 1}, true
	case ColorGreen:
		return Cell{X: 0, Y: BoardSize - 1}, true
	default:
		return Cell{}, false
	}
}

func NextColor(c Color) Color {
	switch c {
	case ColorBlue:
		return ColorYellow
	case ColorYellow:
		return ColorRed
	case ColorRed:
		return ColorGreen
	default:
		return ColorBlue
	}
}

func ValidRotation(r Rotation) bool {
	switch r {
	case Rot0, Rot90, Rot180, Rot270:
		return true
	default:
		return false
	}
}

func NewEmptyBoard() [][]*Color {
	board := make([][]*Color, BoardSize)
	for y := 0; y < BoardSize; y++ {
		board[y] = make([]*Color, BoardSize)
	}
	return board
}

func NewEmptyRemaining() map[Color][]string {
	return map[Color][]string{
		ColorBlue:   {},
		ColorYellow: {},
		ColorRed:    {},
		ColorGreen:  {},
	}
}

func NewEmptyPassed() map[Color]bool {
	return map[Color]bool{
		ColorBlue:   false,
		ColorYellow: false,
		ColorRed:    false,
		ColorGreen:  false,
	}
}
