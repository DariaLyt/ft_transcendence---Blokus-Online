package game_test

import (
	"testing"

	"blokus/game"
)

func TestTransformNormalizeAfterRotate(t *testing.T) {
	cells := []game.Cell{{0, 0}, {0, 1}, {0, 2}, {1, 2}}
	got, err := game.Transform(cells, game.Rot90, false)
	if err != nil {
		t.Fatal(err)
	}
	want := map[game.Cell]bool{{0, 1}: true, {1, 1}: true, {2, 1}: true, {2, 0}: true}
	if len(got) != 4 {
		t.Fatalf("len=%d %+v", len(got), got)
	}
	for _, c := range got {
		if !want[c] {
			t.Fatalf("unexpected %+v in %+v", c, got)
		}
	}
}

func TestOrientationsDedupesSquare(t *testing.T) {
	orients, err := game.Orientations(game.PieceO4)
	if err != nil {
		t.Fatal(err)
	}
	if len(orients) != 1 {
		t.Fatalf("O4 unique orients=%d want 1", len(orients))
	}
}

func TestValidateAndApplyFirstMoves(t *testing.T) {
	state := game.NewActiveGame("t1", game.ModeM4P, nil)

	blueMove := game.Move{Color: game.ColorBlue, PieceID: string(game.Piece1), X: 0, Y: 0}
	if err := game.ValidateMove(state, blueMove); err != nil {
		t.Fatalf("blue first: %v", err)
	}
	if err := game.ApplyMove(state, blueMove); err != nil {
		t.Fatalf("apply blue: %v", err)
	}
	if state.CurrentColor != game.ColorYellow {
		t.Fatalf("turn=%s want yellow", state.CurrentColor)
	}
	if state.Board[0][0] == nil || *state.Board[0][0] != game.ColorBlue {
		t.Fatal("blue not on board")
	}

	bad := game.Move{Color: game.ColorYellow, PieceID: string(game.Piece1), X: 10, Y: 10}
	if err := game.ValidateMove(state, bad); err == nil {
		t.Fatal("expected FIRST_CORNER")
	} else if me := err.(*game.MoveError); me.Code != game.ErrFirstCorner {
		t.Fatalf("got %v", err)
	}

	good := game.Move{Color: game.ColorYellow, PieceID: string(game.Piece1), X: 19, Y: 0}
	if err := game.ApplyMove(state, good); err != nil {
		t.Fatalf("apply yellow: %v", err)
	}
}

func TestEdgeTouchOwnRejected(t *testing.T) {
	state := game.NewActiveGame("t2", game.ModeM4P, nil)
	if err := game.ApplyMove(state, game.Move{Color: game.ColorBlue, PieceID: string(game.Piece2), X: 0, Y: 0}); err != nil {
		t.Fatal(err)
	}
	state.Passed[game.ColorYellow] = true
	state.Passed[game.ColorRed] = true
	state.Passed[game.ColorGreen] = true
	state.CurrentColor = game.ColorBlue

	err := game.ValidateMove(state, game.Move{Color: game.ColorBlue, PieceID: string(game.Piece1), X: 2, Y: 0})
	if err == nil {
		t.Fatal("expected EDGE_TOUCH_OWN")
	}
	if err.(*game.MoveError).Code != game.ErrEdgeTouchOwn {
		t.Fatalf("got %v", err)
	}

	if err := game.ValidateMove(state, game.Move{Color: game.ColorBlue, PieceID: string(game.Piece1), X: 2, Y: 1}); err != nil {
		t.Fatalf("corner touch should be ok: %v", err)
	}
}

func TestScoreColor(t *testing.T) {
	if game.ScoreColor([]string{string(game.Piece1), string(game.Piece2)}, false) != -3 {
		t.Fatal("remaining 1+2 should be -3")
	}
	if game.ScoreColor(nil, false) != 15 {
		t.Fatal("clear bonus 15")
	}
	if game.ScoreColor(nil, true) != 20 {
		t.Fatal("clear + monomino 20")
	}
}

func TestLegalMovesFirstBlueIncludesCorner(t *testing.T) {
	state := game.NewActiveGame("t3", game.ModeM4P, nil)
	moves := game.LegalMoves(state, game.ColorBlue, 5)
	if len(moves) == 0 {
		t.Fatal("expected some legal first moves for blue")
	}
	start, _ := game.StartingCorner(game.ColorBlue)
	for _, m := range moves {
		cells, err := game.AbsoluteCells(m)
		if err != nil {
			t.Fatal(err)
		}
		ok := false
		for _, c := range cells {
			if c == start {
				ok = true
				break
			}
		}
		if !ok {
			t.Fatalf("move %+v does not cover start", m)
		}
	}
}
