package game

// Scoring
//   - each square left in hand: -1
//   - all pieces placed: +15
//   - all pieces placed and the last piece was the monomino ("1"): +5 extra (+20 total bonus)

var orthoDirs = []Cell{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
var diagDirs = []Cell{{1, 1}, {1, -1}, {-1, 1}, {-1, -1}}

func ValidateMove(state *GameState, move Move) error {
	if state == nil {
		return &MoveError{Code: ErrGameNotActive, Message: "nil state"}
	}
	if state.Status != StatusActive {
		return &MoveError{Code: ErrGameNotActive, Message: "game is not active"}
	}
	if move.Color != state.CurrentColor {
		return &MoveError{Code: ErrNotYourTurn, Message: "it is not this color's turn"}
	}
	if state.Passed[move.Color] {
		return &MoveError{Code: ErrColorPassed, Message: "this color has already passed"}
	}
	if !ValidRotation(move.Rotation) {
		return &MoveError{Code: ErrInvalidRotation, Message: "rotation must be 0, 90, 180, or 270"}
	}
	if !pieceInHand(state, move.Color, move.PieceID) {
		return &MoveError{Code: ErrPieceUsed, Message: "piece not in hand: " + move.PieceID}
	}

	cells, err := AbsoluteCells(move)
	if err != nil {
		return err
	}

	first := !colorHasAnySquare(state, move.Color)
	coversStart := false
	start, ok := StartingCorner(move.Color)
	if !ok {
		return &MoveError{Code: ErrNotYourColor, Message: "invalid color"}
	}

	cornerTouch := false

	for _, c := range cells {
		if c.X < 0 || c.Y < 0 || c.X >= BoardSize || c.Y >= BoardSize {
			return &MoveError{Code: ErrOutOfBounds, Message: "piece leaves the board"}
		}
		if state.Board[c.Y][c.X] != nil {
			return &MoveError{Code: ErrCellOccupied, Message: "cell already occupied"}
		}
		if c.X == start.X && c.Y == start.Y {
			coversStart = true
		}

		for _, d := range orthoDirs {
			nx, ny := c.X+d.X, c.Y+d.Y
			if !inBounds(nx, ny) {
				continue
			}
			if occ := state.Board[ny][nx]; occ != nil && *occ == move.Color {
				return &MoveError{Code: ErrEdgeTouchOwn, Message: "same color shares an edge"}
			}
		}
		for _, d := range diagDirs {
			nx, ny := c.X+d.X, c.Y+d.Y
			if !inBounds(nx, ny) {
				continue
			}
			if occ := state.Board[ny][nx]; occ != nil && *occ == move.Color {
				cornerTouch = true
			}
		}
	}

	if first {
		if !coversStart {
			return &MoveError{Code: ErrFirstCorner, Message: "first piece must cover starting corner"}
		}
		return nil
	}
	if !cornerTouch {
		return &MoveError{Code: ErrNoCornerTouch, Message: "must touch own color by a corner"}
	}
	return nil
}

func ApplyMove(state *GameState, move Move) error {
	if err := ValidateMove(state, move); err != nil {
		return err
	}

	cells, err := AbsoluteCells(move)
	if err != nil {
		return err
	}

	color := move.Color
	for _, c := range cells {
		col := color
		state.Board[c.Y][c.X] = &col
	}
	state.Remaining[color] = removePiece(state.Remaining[color], move.PieceID)

	advanceTurn(state)
	ResolvePasses(state)

	if state.Status == StatusActive && (allPassed(state) || !anyColorCanMove(state)) {
		finishGame(state, move)
	}
	return nil
}

func ResolvePasses(state *GameState) {
	if state == nil || state.Status != StatusActive {
		return
	}
	for i := 0; i < 8; i++ {
		cur := state.CurrentColor
		if state.Passed[cur] {
			advanceTurn(state)
			continue
		}
		if HasLegalMove(state, cur) {
			return
		}
		state.Passed[cur] = true
		advanceTurn(state)
	}
	if allPassed(state) || !anyColorCanMove(state) {
		finishGame(state, Move{})
	}
}

// HasLegalMove reports whether color has at least one legal placement.
func HasLegalMove(state *GameState, color Color) bool {
	moves := LegalMoves(state, color, 1)
	return len(moves) > 0
}

func LegalMoves(state *GameState, color Color, limit int) []Move {
	if state == nil || state.Passed[color] || state.Status != StatusActive {
		return nil
	}
	hand := state.Remaining[color]
	if len(hand) == 0 {
		return nil
	}

	var out []Move
	first := !colorHasAnySquare(state, color)
	start, _ := StartingCorner(color)

	for _, pid := range hand {
		orients, err := Orientations(PieceID(pid))
		if err != nil {
			continue
		}
		for _, o := range orients {
			maxX, maxY := shapeBounds(o.Cells)
			for y := 0; y <= BoardSize-1-maxY; y++ {
				for x := 0; x <= BoardSize-1-maxX; x++ {
					if first {
						if !orientationCovers(o.Cells, x, y, start) {
							continue
						}
					}
					m := Move{
						Color:    color,
						PieceID:  pid,
						Rotation: o.Rotation,
						Flipped:  o.Flipped,
						X:        x,
						Y:        y,
					}
					if ValidateMove(state, m) != nil {
						continue
					}
					out = append(out, m)
					if limit > 0 && len(out) >= limit {
						return out
					}
				}
			}
		}
	}
	return out
}

func ScoreColor(remaining []string, emptiedWithMonomino bool) int {
	if len(remaining) == 0 {
		if emptiedWithMonomino {
			return 20 
		}
		return 15
	}
	score := 0
	for _, id := range remaining {
		score -= PieceSize(PieceID(id))
	}
	return score
}

func ComputeScores(state *GameState, lastMove Move) map[Color]int {
	scores := make(map[Color]int, 4)
	for _, c := range AllColors {
		emptiedWithOne := len(state.Remaining[c]) == 0 &&
			lastMove.Color == c &&
			lastMove.PieceID == string(Piece1)
		scores[c] = ScoreColor(state.Remaining[c], emptiedWithOne)
	}
	return scores
}

func finishGame(state *GameState, lastMove Move) {
	state.Status = StatusFinished
	state.Scores = ComputeScores(state, lastMove)
}

func advanceTurn(state *GameState) {
	state.CurrentColor = NextColor(state.CurrentColor)
}

func allPassed(state *GameState) bool {
	for _, c := range AllColors {
		if !state.Passed[c] {
			return false
		}
	}
	return true
}

func anyColorCanMove(state *GameState) bool {
	for _, c := range AllColors {
		if !state.Passed[c] && HasLegalMove(state, c) {
			return true
		}
	}
	return false
}

func inBounds(x, y int) bool {
	return x >= 0 && y >= 0 && x < BoardSize && y < BoardSize
}

func colorHasAnySquare(state *GameState, color Color) bool {
	for y := 0; y < BoardSize; y++ {
		for x := 0; x < BoardSize; x++ {
			if occ := state.Board[y][x]; occ != nil && *occ == color {
				return true
			}
		}
	}
	return false
}

func pieceInHand(state *GameState, color Color, pieceID string) bool {
	for _, id := range state.Remaining[color] {
		if id == pieceID {
			return true
		}
	}
	return false
}

func removePiece(hand []string, pieceID string) []string {
	out := make([]string, 0, len(hand))
	removed := false
	for _, id := range hand {
		if !removed && id == pieceID {
			removed = true
			continue
		}
		out = append(out, id)
	}
	return out
}

func shapeBounds(cells []Cell) (maxX, maxY int) {
	for _, c := range cells {
		if c.X > maxX {
			maxX = c.X
		}
		if c.Y > maxY {
			maxY = c.Y
		}
	}
	return maxX, maxY
}

func orientationCovers(local []Cell, originX, originY int, target Cell) bool {
	for _, c := range local {
		if originX+c.X == target.X && originY+c.Y == target.Y {
			return true
		}
	}
	return false
}

func NewActiveGame(id string, mode GameMode, seats []Seat) *GameState {
	return newGame(id, mode, seats, StatusActive)
}

func NewLobbyGame(id string, mode GameMode, seats []Seat) *GameState {
	return newGame(id, mode, seats, StatusLobby)
}

func newGame(id string, mode GameMode, seats []Seat, status GameStatus) *GameState {
	return &GameState{
		ID:           id,
		Mode:         mode,
		Board:        NewEmptyBoard(),
		Seats:        seats,
		Remaining:    NewFullRemaining(),
		CurrentColor: ColorBlue,
		Passed:       NewEmptyPassed(),
		Status:       status,
	}
}
