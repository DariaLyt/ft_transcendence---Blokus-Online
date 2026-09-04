package game_test

import (
	"testing"

	"blokus/game"
	pb "blokus/game/proto/pb"
)

func strID(s string) *string { return &s }

func fourHumanSeats() []game.Seat {
	return []game.Seat{
		{Color: game.ColorBlue, Kind: game.SeatHuman, UserID: strID("1")},
		{Color: game.ColorYellow, Kind: game.SeatHuman, UserID: strID("2")},
		{Color: game.ColorRed, Kind: game.SeatHuman, UserID: strID("3")},
		{Color: game.ColorGreen, Kind: game.SeatHuman, UserID: strID("4")},
	}
}

func TestValidateAndMakeMoveLegal(t *testing.T) {
	state := game.NewActiveGame("g1", game.ModeM4P, fourHumanSeats())
	resp := game.ValidateAndMakeMove(state, &pb.MoveRequest{
		UserId:  1,
		Color:   "blue",
		PieceId: string(game.Piece1),
		OriginX: 0,
		OriginY: 0,
	})
	if !resp.GetIsValid() {
		t.Fatalf("expected valid, got %s", resp.GetErrorMessage())
	}
	if resp.GetCurrentTurnUserId() != 2 {
		t.Fatalf("next user=%d want 2", resp.GetCurrentTurnUserId())
	}
	if state.CurrentColor != game.ColorYellow {
		t.Fatalf("turn=%s", state.CurrentColor)
	}
}

func TestValidateAndMakeMoveRejectsIllegal(t *testing.T) {
	state := game.NewActiveGame("g1", game.ModeM4P, fourHumanSeats())
	resp := game.ValidateAndMakeMove(state, &pb.MoveRequest{
		UserId:  1,
		Color:   "blue",
		PieceId: string(game.Piece1),
		OriginX: 10,
		OriginY: 10,
	})
	if resp.GetIsValid() {
		t.Fatal("expected invalid first move")
	}
	if resp.GetErrorMessage() == "" {
		t.Fatal("expected error message")
	}
	if state.CurrentColor != game.ColorBlue {
		t.Fatal("illegal move must not advance the turn")
	}
}

func TestValidateAndMakeMoveRejectsWrongUser(t *testing.T) {
	state := game.NewActiveGame("g1", game.ModeM4P, fourHumanSeats())
	resp := game.ValidateAndMakeMove(state, &pb.MoveRequest{
		UserId:  2,
		Color:   "blue",
		PieceId: string(game.Piece1),
		OriginX: 0,
		OriginY: 0,
	})
	if resp.GetIsValid() {
		t.Fatal("user 2 must not play blue")
	}
}

func TestGameEngineLookupByUser(t *testing.T) {
	state := game.NewActiveGame("g1", game.ModeM4P, fourHumanSeats())
	eng := game.NewGameEngine()
	eng.RegisterGame(state)

	resp, err := eng.ValidateAndMakeMove(nil, &pb.MoveRequest{
		UserId:  1,
		Color:   "BLUE",
		PieceId: string(game.Piece1),
		OriginX: 0,
		OriginY: 0,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !resp.GetIsValid() || resp.GetCurrentTurnUserId() != 2 {
		t.Fatalf("%+v", resp)
	}
}
