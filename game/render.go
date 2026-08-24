package game

import (
	"fmt"
	"strings"
)

const (
	ansiReset  = "\033[0m"
	ansiBlue   = "\033[94m"
	ansiYellow = "\033[93m"
	ansiRed    = "\033[91m"
	ansiGreen  = "\033[92m"
	ansiDim    = "\033[2m"
	ansiBold   = "\033[1m"
)

func colorANSI(c Color) string {
	switch c {
	case ColorBlue:
		return ansiBlue
	case ColorYellow:
		return ansiYellow
	case ColorRed:
		return ansiRed
	case ColorGreen:
		return ansiGreen
	default:
		return ansiReset
	}
}

func colorGlyph(c Color) string {
	switch c {
	case ColorBlue:
		return "B"
	case ColorYellow:
		return "Y"
	case ColorRed:
		return "R"
	case ColorGreen:
		return "G"
	default:
		return "?"
	}
}

func RenderBoard(state *GameState) string {
	var b strings.Builder

	b.WriteString(ansiDim)
	b.WriteString("    ")
	for x := 0; x < BoardSize; x++ {
		fmt.Fprintf(&b, "%d ", x%10)
	}
	b.WriteString(ansiReset)
	b.WriteByte('\n')

	b.WriteString(ansiDim)
	b.WriteString("    ")
	for x := 0; x < BoardSize; x++ {
		if x%10 == 0 {
			fmt.Fprintf(&b, "%d ", x/10)
		} else {
			b.WriteString("  ")
		}
	}
	b.WriteString(ansiReset)
	b.WriteString("  (tens)\n")

	for y := 0; y < BoardSize; y++ {
		fmt.Fprintf(&b, "%s%02d%s  ", ansiDim, y, ansiReset)
		for x := 0; x < BoardSize; x++ {
			occ := state.Board[y][x]
			if occ == nil {
				b.WriteString(ansiDim)
				b.WriteString("· ")
				b.WriteString(ansiReset)
				continue
			}
			b.WriteString(colorANSI(*occ))
			b.WriteString(colorGlyph(*occ))
			b.WriteString(" ")
			b.WriteString(ansiReset)
		}
		b.WriteByte('\n')
	}
	return b.String()
}

func RenderBoardWithGhost(state *GameState, move Move) (string, error) {
	cells, err := AbsoluteCells(move)
	if err != nil {
		return "", err
	}
	ghost := map[Cell]bool{}
	for _, c := range cells {
		ghost[c] = true
	}

	var b strings.Builder
	b.WriteString(ansiDim)
	b.WriteString("    ")
	for x := 0; x < BoardSize; x++ {
		fmt.Fprintf(&b, "%d ", x%10)
	}
	b.WriteString(ansiReset + "\n")

	for y := 0; y < BoardSize; y++ {
		fmt.Fprintf(&b, "%s%02d%s  ", ansiDim, y, ansiReset)
		for x := 0; x < BoardSize; x++ {
			cell := Cell{X: x, Y: y}
			if ghost[cell] {
				b.WriteString(ansiBold)
				b.WriteString(colorANSI(move.Color))
				b.WriteString(strings.ToLower(colorGlyph(move.Color)))
				b.WriteString(" ")
				b.WriteString(ansiReset)
				continue
			}
			occ := state.Board[y][x]
			if occ == nil {
				b.WriteString(ansiDim + "· " + ansiReset)
				continue
			}
			b.WriteString(colorANSI(*occ))
			b.WriteString(colorGlyph(*occ) + " ")
			b.WriteString(ansiReset)
		}
		b.WriteByte('\n')
	}
	return b.String(), nil
}

func RenderPieceASCII(id PieceID, rotation Rotation, flipped bool, color Color) (string, error) {
	cells, err := Footprint(id, rotation, flipped)
	if err != nil {
		return "", err
	}
	maxX, maxY := 0, 0
	set := map[Cell]bool{}
	for _, c := range cells {
		set[c] = true
		if c.X > maxX {
			maxX = c.X
		}
		if c.Y > maxY {
			maxY = c.Y
		}
	}

	var b strings.Builder
	fmt.Fprintf(&b, "%s%s%s rot=%d flip=%v size=%d\n",
		colorANSI(color), id, ansiReset, rotation, flipped, len(cells))
	for y := 0; y <= maxY; y++ {
		b.WriteString("  ")
		for x := 0; x <= maxX; x++ {
			if set[Cell{X: x, Y: y}] {
				b.WriteString(colorANSI(color))
				b.WriteString("██")
				b.WriteString(ansiReset)
			} else {
				b.WriteString("  ")
			}
		}
		b.WriteByte('\n')
	}
	return b.String(), nil
}

func RenderHand(state *GameState, color Color) string {
	hand := state.Remaining[color]
	bySize := map[int][]string{}
	for _, id := range hand {
		s := PieceSize(PieceID(id))
		bySize[s] = append(bySize[s], id)
	}
	var b strings.Builder
	fmt.Fprintf(&b, "%s%s%s hand (%d pieces):\n", colorANSI(color), color, ansiReset, len(hand))
	for size := 5; size >= 1; size-- {
		ids := bySize[size]
		if len(ids) == 0 {
			continue
		}
		fmt.Fprintf(&b, "  %d-sq: %s\n", size, strings.Join(ids, " "))
	}
	return b.String()
}

func RenderStatus(state *GameState) string {
	var b strings.Builder
	fmt.Fprintf(&b, "%sGame %s%s | mode=%s (%s) | status=%s\n",
		ansiBold, state.ID, ansiReset, state.Mode, ModeDescription(state.Mode), state.Status)
	fmt.Fprintf(&b, "Turn: %s%s%s", colorANSI(state.CurrentColor), state.CurrentColor, ansiReset)
	if IsBotTurn(state) {
		b.WriteString(" [BOT]")
	} else {
		b.WriteString(" [HUMAN]")
	}
	b.WriteByte('\n')

	parts := make([]string, 0, 4)
	for _, c := range AllColors {
		kind := SeatKindOf(state, c)
		flag := string(kind)
		if state.Passed[c] {
			flag = "PASSED"
		}
		parts = append(parts, fmt.Sprintf("%s%s%s:%s", colorANSI(c), c, ansiReset, flag))
	}
	b.WriteString(strings.Join(parts, "  "))
	b.WriteByte('\n')
	return b.String()
}

func RenderScores(state *GameState) string {
	if state.Scores == nil {
		state.Scores = ComputeScores(state, Move{})
	}
	var b strings.Builder
	b.WriteString(ansiBold + "Scores:" + ansiReset + "\n")
	for _, c := range AllColors {
		fmt.Fprintf(&b, "  %s%s%s: %d\n", colorANSI(c), c, ansiReset, state.Scores[c])
	}
	return b.String()
}
