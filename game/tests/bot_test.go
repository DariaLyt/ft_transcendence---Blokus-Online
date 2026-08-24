package game_test

import (
	"math/rand"
	"testing"

	"blokus/game"
)

func TestParseMode(t *testing.T) {
	m, err := game.ParseMode("m1p3b")
	if err != nil || m != game.ModeM1P3B {
		t.Fatalf("got %v %v", m, err)
	}
	if _, err := game.ParseMode("M2P"); err == nil {
		t.Fatal("M2P should be rejected")
	}
}

func TestDefaultSeatsForMode(t *testing.T) {
	cases := map[game.GameMode][]game.SeatKind{
		game.ModeM4P:   {game.SeatHuman, game.SeatHuman, game.SeatHuman, game.SeatHuman},
		game.ModeM1P3B: {game.SeatHuman, game.SeatBot, game.SeatBot, game.SeatBot},
		game.ModeM2P2B: {game.SeatHuman, game.SeatHuman, game.SeatBot, game.SeatBot},
		game.ModeM3P1B: {game.SeatHuman, game.SeatHuman, game.SeatHuman, game.SeatBot},
	}
	for mode, want := range cases {
		seats, err := game.DefaultSeatsForMode(mode)
		if err != nil {
			t.Fatal(err)
		}
		for i, s := range seats {
			if s.Kind != want[i] || s.Color != game.AllColors[i] {
				t.Fatalf("%s seat %d: got %s/%s", mode, i, s.Color, s.Kind)
			}
		}
	}
}

func TestBotSuggestsLegalMove(t *testing.T) {
	seats, _ := game.DefaultSeatsForMode(game.ModeM1P3B)
	state := game.NewActiveGame("bot-test", game.ModeM1P3B, seats)
	bot := &game.Bot{RNG: rand.New(rand.NewSource(1))}

	if err := game.ApplyMove(state, game.Move{Color: game.ColorBlue, PieceID: string(game.PieceI5), X: 0, Y: 0}); err != nil {
		t.Fatal(err)
	}
	if state.CurrentColor != game.ColorYellow {
		t.Fatalf("turn=%s", state.CurrentColor)
	}

	m, err := bot.SuggestMove(state, game.ColorYellow)
	if err != nil {
		t.Fatal(err)
	}
	if err := game.ValidateMove(state, m); err != nil {
		t.Fatalf("bot suggested illegal move %+v: %v", m, err)
	}
}

func TestBotPlaysThroughTurns(t *testing.T) {
	seats, _ := game.DefaultSeatsForMode(game.ModeM1P3B)
	state := game.NewActiveGame("bot-flow", game.ModeM1P3B, seats)
	bot := &game.Bot{RNG: rand.New(rand.NewSource(42))}

	if err := game.ApplyMove(state, game.Move{Color: game.ColorBlue, PieceID: string(game.Piece1), X: 0, Y: 0}); err != nil {
		t.Fatal(err)
	}
	n, err := bot.PlayBotTurnsIfNeeded(state)
	if err != nil {
		t.Fatal(err)
	}
	if n < 1 {
		t.Fatalf("expected bots to play, n=%d", n)
	}
	if state.Status == game.StatusActive && game.IsBotTurn(state) {
		t.Fatalf("still bot turn after PlayBotTurnsIfNeeded: %s", state.CurrentColor)
	}
}
