package game

import (
	"fmt"
	"sort"
	"strings"
)

func Normalize(cells []Cell) []Cell {
	if len(cells) == 0 {
		return nil
	}
	minX, minY := cells[0].X, cells[0].Y
	for _, c := range cells[1:] {
		if c.X < minX {
			minX = c.X
		}
		if c.Y < minY {
			minY = c.Y
		}
	}
	out := make([]Cell, len(cells))
	for i, c := range cells {
		out[i] = Cell{X: c.X - minX, Y: c.Y - minY}
	}
	return out
}

func FlipHorizontal(cells []Cell) []Cell {
	out := make([]Cell, len(cells))
	for i, c := range cells {
		out[i] = Cell{X: -c.X, Y: c.Y}
	}
	return Normalize(out)
}

func FlipVertical(cells []Cell) []Cell {
	out := make([]Cell, len(cells))
	for i, c := range cells {
		out[i] = Cell{X: c.X, Y: -c.Y}
	}
	return Normalize(out)
}

//(x, y) -> (y, -x).
func RotateCW(cells []Cell) []Cell {
	out := make([]Cell, len(cells))
	for i, c := range cells {
		out[i] = Cell{X: c.Y, Y: -c.X}
	}
	return Normalize(out)
}

// (x, y) -> (-y, x).
func RotateCCW(cells []Cell) []Cell {
	out := make([]Cell, len(cells))
	for i, c := range cells {
		out[i] = Cell{X: -c.Y, Y: c.X}
	}
	return Normalize(out)
}

func Transform(cells []Cell, rotation Rotation, flipped bool) ([]Cell, error) {
	if !ValidRotation(rotation) {
		return nil, &MoveError{Code: ErrInvalidRotation, Message: "rotation must be 0, 90, 180, or 270"}
	}
	out := make([]Cell, len(cells))
	copy(out, cells)
	out = Normalize(out)
	if flipped {
		out = FlipHorizontal(out)
	}
	turns := int(rotation) / 90
	for i := 0; i < turns; i++ {
		out = RotateCW(out)
	}
	return out, nil
}

type orientedShape struct {
	Rotation Rotation
	Flipped  bool
	Cells    []Cell
}

func Orientations(id PieceID) ([]orientedShape, error) {
	base, ok := baseShapes[id]
	if !ok {
		return nil, &MoveError{Code: ErrUnknownPiece, Message: "unknown piece id: " + string(id)}
	}
	seen := map[string]bool{}
	var out []orientedShape
	for _, flipped := range []bool{false, true} {
		for _, rot := range []Rotation{Rot0, Rot90, Rot180, Rot270} {
			cells, err := Transform(base, rot, flipped)
			if err != nil {
				return nil, err
			}
			k := shapeKey(cells)
			if seen[k] {
				continue
			}
			seen[k] = true
			out = append(out, orientedShape{
				Rotation: rot,
				Flipped:  flipped,
				Cells:    cells,
			})
		}
	}
	return out, nil
}

func shapeKey(cells []Cell) string {
	n := append([]Cell(nil), cells...)
	sort.Slice(n, func(i, j int) bool {
		if n[i].Y != n[j].Y {
			return n[i].Y < n[j].Y
		}
		return n[i].X < n[j].X
	})
	parts := make([]string, len(n))
	for i, c := range n {
		parts[i] = fmt.Sprintf("%d,%d", c.X, c.Y)
	}
	return strings.Join(parts, ";")
}
