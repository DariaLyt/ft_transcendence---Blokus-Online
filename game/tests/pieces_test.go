package game_test

import (
	"testing"

	"blokus/game"
)

func TestAllPiecesPresentAndSized(t *testing.T) {
	if len(game.AllPieceIDs) != 21 {
		t.Fatalf("expected 21 pieces, got %d", len(game.AllPieceIDs))
	}

	total := 0
	seen := map[game.PieceID]bool{}
	for _, id := range game.AllPieceIDs {
		if seen[id] {
			t.Fatalf("duplicate piece id %s", id)
		}
		seen[id] = true

		p, ok := game.GetPiece(id)
		if !ok {
			t.Fatalf("missing shape for %s", id)
		}
		if p.Size != len(p.Cells) || p.Size == 0 {
			t.Fatalf("%s: bad size %d cells %d", id, p.Size, len(p.Cells))
		}
		total += p.Size

		uniq := map[game.Cell]bool{}
		for _, c := range p.Cells {
			if uniq[c] {
				t.Fatalf("%s: duplicate cell %+v", id, c)
			}
			uniq[c] = true
		}
	}

	if total != game.TotalSquaresPerColor {
		t.Fatalf("expected %d squares per color, got %d", game.TotalSquaresPerColor, total)
	}
}

func TestPieceSizeBuckets(t *testing.T) {
	counts := map[int]int{}
	for _, id := range game.AllPieceIDs {
		counts[game.PieceSize(id)]++
	}
	want := map[int]int{1: 1, 2: 1, 3: 2, 4: 5, 5: 12}
	for size, n := range want {
		if counts[size] != n {
			t.Fatalf("size %d: want %d pieces, got %d", size, n, counts[size])
		}
	}
}

func TestFootprintRotateAndFlip(t *testing.T) {
	cells, err := game.Footprint(game.PieceL4, game.Rot90, false)
	if err != nil {
		t.Fatal(err)
	}
	want := map[game.Cell]bool{
		{0, 1}: true, {1, 1}: true, {2, 1}: true, {2, 0}: true,
	}
	if len(cells) != 4 {
		t.Fatalf("len=%d got %+v", len(cells), cells)
	}
	for _, c := range cells {
		if !want[c] {
			t.Fatalf("unexpected cell %+v in %+v", c, cells)
		}
	}

	flipped, err := game.Footprint(game.PieceI3, game.Rot0, true)
	if err != nil {
		t.Fatal(err)
	}
	if len(flipped) != 3 {
		t.Fatalf("I3 flipped len=%d", len(flipped))
	}
}

func TestAbsoluteCells(t *testing.T) {
	move := game.Move{
		Color:    game.ColorBlue,
		PieceID:  string(game.Piece2),
		Rotation: game.Rot0,
		Flipped:  false,
		X:        3,
		Y:        5,
	}
	cells, err := game.AbsoluteCells(move)
	if err != nil {
		t.Fatal(err)
	}
	want := []game.Cell{{3, 5}, {4, 5}}
	if len(cells) != 2 || cells[0] != want[0] || cells[1] != want[1] {
		t.Fatalf("got %+v want %+v", cells, want)
	}
}

func TestFullTray(t *testing.T) {
	tray := game.FullTray()
	if len(tray) != 21 {
		t.Fatalf("tray len=%d", len(tray))
	}
	tray[0] = "mutated"
	if game.AllPieceIDs[0] != game.Piece1 {
		t.Fatal("AllPieceIDs mutated")
	}
}

func TestUnknownPiece(t *testing.T) {
	_, err := game.Footprint(game.PieceID("nope"), game.Rot0, false)
	if err == nil {
		t.Fatal("expected error")
	}
	me, ok := err.(*game.MoveError)
	if !ok || me.Code != game.ErrUnknownPiece {
		t.Fatalf("got %v", err)
	}
}
