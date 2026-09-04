package game_test

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"blokus/game"
	pb "blokus/game/proto/pb"
)

func TestLobbyCreateStartMoveAndScores(t *testing.T) {
	eng := game.NewGameEngine()
	eng.TurnDuration = time.Hour
	ctx := context.Background()

	created, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId:  1,
		Action:  "CREATE_LOBBY",
		Payload: `{"maxPlayers":4,"username":"host"}`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !created.GetSuccess() {
		t.Fatalf("create: %+v", created)
	}
	lobbyID := snapshot(t, created.GetState()).Lobby.ID
	if lobbyID == "" || snapshot(t, created.GetState()).Lobby.Status != game.LobbyWaiting {
		t.Fatalf("lobby %+v", snapshot(t, created.GetState()).Lobby)
	}

	started, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId:  1,
		Action:  "BEGIN_READY_CHECK",
		Payload: `{"lobbyId":"` + lobbyID + `"}`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !started.GetSuccess() {
		t.Fatalf("start: %+v", started)
	}
	wrap := snapshot(t, started.GetState())
	if wrap.Lobby == nil || wrap.Lobby.Status != game.LobbyInGame {
		t.Fatalf("lobby status %+v", wrap.Lobby)
	}
	if wrap.Game == nil || wrap.Game.Mode != game.ModeM1P3B || wrap.Game.CurrentColor != game.ColorBlue {
		t.Fatalf("game %+v", wrap.Game)
	}

	illegal, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{
		UserId:  1,
		Action:  "MAKE_MOVE",
		Payload: `{"color":"blue","pieceId":"1","originX":10,"originY":10}`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if illegal.GetSuccess() {
		t.Fatal("expected illegal first move")
	}
	if illegal.GetErrorCode() != string(game.ErrFirstCorner) {
		t.Fatalf("code=%s msg=%s", illegal.GetErrorCode(), illegal.GetMessage())
	}

	moved, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{
		UserId:  1,
		Action:  "MAKE_MOVE",
		Payload: `{"color":"blue","pieceId":"1","originX":0,"originY":0}`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !moved.GetSuccess() {
		t.Fatalf("move: %+v", moved)
	}

	filled := eng.Autofill(1)
	if !filled.GetSuccess() {
		t.Fatalf("autofill: %+v", filled)
	}
	done := snapshot(t, filled.GetState())
	if done.Game == nil || done.Game.Status != game.StatusFinished {
		t.Fatalf("status=%v", done.Game)
	}
	if len(done.Game.Scores) != 4 {
		t.Fatalf("scores=%v", done.Game.Scores)
	}
}

func TestHandleGameActionEdgeTouchOwn(t *testing.T) {
	state := game.NewActiveGame("g-edge", game.ModeM4P, fourHumanSeats())
	eng := game.NewGameEngine()
	eng.TurnDuration = time.Hour
	eng.RegisterGame(state)
	ctx := context.Background()

	first, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{
		UserId:  1,
		Action:  "MAKE_MOVE",
		Payload: `{"color":"blue","pieceId":"2","originX":0,"originY":0}`,
	})
	if err != nil || !first.GetSuccess() {
		t.Fatalf("first: %+v %v", first, err)
	}

	for _, uid := range []int32{2, 3, 4} {
		pass, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{UserId: uid, Action: "PASS_TURN"})
		if err != nil || !pass.GetSuccess() {
			t.Fatalf("pass %d: %+v %v", uid, pass, err)
		}
	}

	bad, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{
		UserId:  1,
		Action:  "MAKE_MOVE",
		Payload: `{"color":"blue","pieceId":"1","originX":2,"originY":0}`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if bad.GetSuccess() || bad.GetErrorCode() != string(game.ErrEdgeTouchOwn) {
		t.Fatalf("want EDGE_TOUCH_OWN got %+v", bad)
	}
}

func TestTurnTimerPassesCurrentColor(t *testing.T) {
	eng := game.NewGameEngine()
	eng.TurnDuration = 25 * time.Millisecond
	ctx := context.Background()

	created, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId:  1,
		Action:  "CREATE_LOBBY",
		Payload: `{"maxPlayers":4}`,
	})
	if err != nil || !created.GetSuccess() {
		t.Fatalf("create: %+v %v", created, err)
	}
	started, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId: 1,
		Action: "BEGIN_READY_CHECK",
	})
	if err != nil || !started.GetSuccess() {
		t.Fatalf("start: %+v %v", started, err)
	}

	deadline := time.Now().Add(500 * time.Millisecond)
	for time.Now().Before(deadline) {
		snap, err := eng.GetGameStateSnapshot(ctx, &pb.GameStateRequest{UserId: 1})
		if err != nil {
			t.Fatal(err)
		}
		wrap := snapshot(t, snap.GetState())
		if wrap.Game != nil && wrap.Game.Passed[game.ColorBlue] {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("blue should have been auto-passed after the turn timer")
}

func TestDisconnectConvertsSeatToBot(t *testing.T) {
	state := game.NewActiveGame("g-dc", game.ModeM4P, fourHumanSeats())
	eng := game.NewGameEngine()
	eng.TurnDuration = time.Hour
	eng.DisconnectGrace = 0
	eng.RegisterGame(state)
	ctx := context.Background()

	resp, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{UserId: 1, Action: "DISCONNECT"})
	if err != nil || !resp.GetSuccess() {
		t.Fatalf("disconnect: %+v %v", resp, err)
	}
	wrap := snapshot(t, resp.GetState())
	if wrap.Game == nil {
		t.Fatal("expected game in snapshot")
	}
	seat := wrap.Game.Seats[0]
	if seat.Kind != game.SeatBot || seat.UserID != nil {
		t.Fatalf("seat %+v", seat)
	}

	move, err := eng.HandleGameAction(ctx, &pb.GameActionRequest{
		UserId:  1,
		Action:  "MAKE_MOVE",
		Payload: `{"color":"blue","pieceId":"1","originX":0,"originY":0}`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if move.GetSuccess() || move.GetErrorCode() != string(game.ErrGameNotActive) {
		t.Fatalf("disconnected user must not move: %+v", move)
	}
}

func TestTwoPlayerReadyCheckStartsM2P2B(t *testing.T) {
	eng := game.NewGameEngine()
	eng.TurnDuration = time.Hour
	ctx := context.Background()

	created, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId:  1,
		Action:  "CREATE_LOBBY",
		Payload: `{"maxPlayers":2}`,
	})
	if err != nil || !created.GetSuccess() {
		t.Fatalf("create: %+v %v", created, err)
	}
	lobbyID := snapshot(t, created.GetState()).Lobby.ID

	joined, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId:  2,
		Action:  "JOIN_LOBBY",
		Payload: `{"lobbyId":"` + lobbyID + `","username":"guest"}`,
	})
	if err != nil || !joined.GetSuccess() {
		t.Fatalf("join: %+v %v", joined, err)
	}
	if snapshot(t, joined.GetState()).Lobby.Status != game.LobbyReadyCheck {
		t.Fatalf("expected ready_check, got %+v", snapshot(t, joined.GetState()).Lobby)
	}

	accepted, err := eng.HandleLobbyAction(ctx, &pb.LobbyActionRequest{
		UserId:  2,
		Action:  "ACCEPT_READY_CHECK",
		Payload: `{"lobbyId":"` + lobbyID + `"}`,
	})
	if err != nil || !accepted.GetSuccess() {
		t.Fatalf("accept: %+v %v", accepted, err)
	}
	wrap := snapshot(t, accepted.GetState())
	if wrap.Game == nil || wrap.Game.Mode != game.ModeM2P2B {
		t.Fatalf("want M2P2B got %+v", wrap.Game)
	}
}

type snapWrap struct {
	Lobby *game.Lobby     `json:"lobby"`
	Game  *game.GameState `json:"game"`
}

func snapshot(t *testing.T, raw string) snapWrap {
	t.Helper()
	var wrap snapWrap
	if err := json.Unmarshal([]byte(raw), &wrap); err != nil {
		t.Fatalf("snapshot json: %v raw=%s", err, raw)
	}
	return wrap
}

func TestPassTurnHelper(t *testing.T) {
	state := game.NewActiveGame("g-pass", game.ModeM4P, fourHumanSeats())
	if err := game.PassTurn(state, game.ColorBlue); err != nil {
		t.Fatal(err)
	}
	if !state.Passed[game.ColorBlue] {
		t.Fatal("blue should be passed")
	}
	if state.CurrentColor != game.ColorYellow {
		t.Fatalf("turn=%s", state.CurrentColor)
	}
	if err := game.PassTurn(state, game.ColorBlue); err == nil {
		t.Fatal("expected not your turn")
	} else if !strings.Contains(err.Error(), string(game.ErrNotYourTurn)) && !strings.Contains(err.Error(), string(game.ErrColorPassed)) {
		t.Fatalf("got %v", err)
	}
}
