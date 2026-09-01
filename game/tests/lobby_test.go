package game_test

import (
	"testing"

	"blokus/game"
)

func TestCreateLobby(t *testing.T) {
	m := game.NewLobbyManager()
	lobby, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if lobby.ID == "" {
		t.Fatal("expected lobby id")
	}
	if lobby.MaxPlayers != 4 || lobby.Status != game.LobbyWaiting {
		t.Fatalf("max=%d status=%s", lobby.MaxPlayers, lobby.Status)
	}
	if len(lobby.Players) != 1 {
		t.Fatalf("players=%d", len(lobby.Players))
	}
	p := lobby.Players[0]
	if p.UserID != "u1" || p.Username != "host" || !p.Host || !p.Ready {
		t.Fatalf("host seat %+v", p)
	}

	got, err := m.LobbyForUser("u1")
	if err != nil || got.ID != lobby.ID {
		t.Fatalf("LobbyForUser: %v %+v", err, got)
	}
}

func TestCreateLobbyDefaultMaxPlayers(t *testing.T) {
	m := game.NewLobbyManager()
	lobby, err := m.CreateLobby("u1", "", 0)
	if err != nil {
		t.Fatal(err)
	}
	if lobby.MaxPlayers != 4 {
		t.Fatalf("max=%d want 4", lobby.MaxPlayers)
	}
}

func TestCreateLobbyRejectsBadInput(t *testing.T) {
	m := game.NewLobbyManager()
	if _, err := m.CreateLobby("", "x", 4); err == nil {
		t.Fatal("expected INVALID_USER")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyInvalidUser {
		t.Fatalf("got %v", err)
	}
	if _, err := m.CreateLobby("u1", "x", 1); err == nil {
		t.Fatal("expected INVALID_MAX_PLAYERS")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyInvalidMaxPlayers {
		t.Fatalf("got %v", err)
	}
	if _, err := m.CreateLobby("u1", "x", 5); err == nil {
		t.Fatal("expected INVALID_MAX_PLAYERS")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyInvalidMaxPlayers {
		t.Fatalf("got %v", err)
	}
}

func TestJoinLobby(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}

	lobby, err := m.JoinLobby("u2", "guest", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(lobby.Players) != 2 {
		t.Fatalf("players=%d", len(lobby.Players))
	}
	p := lobby.Players[1]
	if p.UserID != "u2" || p.Host || p.Ready {
		t.Fatalf("guest seat %+v", p)
	}

	got, err := m.GetLobby(host.ID)
	if err != nil || len(got.Players) != 2 {
		t.Fatalf("GetLobby: %v players=%d", err, len(got.Players))
	}
}

func TestJoinLobbyNotFound(t *testing.T) {
	m := game.NewLobbyManager()
	_, err := m.JoinLobby("u2", "guest", "missing")
	if err == nil {
		t.Fatal("expected LOBBY_NOT_FOUND")
	}
	if err.(*game.LobbyError).Code != game.ErrLobbyNotFound {
		t.Fatalf("got %v", err)
	}
}

func TestJoinLobbyFull(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "a", 2)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "b", host.ID); err != nil {
		t.Fatal(err)
	}
	_, err = m.JoinLobby("u3", "c", host.ID)
	if err == nil {
		t.Fatal("expected LOBBY_FULL")
	}
	if err.(*game.LobbyError).Code != game.ErrLobbyFull {
		t.Fatalf("got %v", err)
	}
}

func TestJoinLobbyAlreadyMember(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	_, err = m.JoinLobby("u1", "host", host.ID)
	if err == nil {
		t.Fatal("expected ALREADY_IN_LOBBY")
	}
	if err.(*game.LobbyError).Code != game.ErrLobbyAlreadyMember {
		t.Fatalf("got %v", err)
	}
}

func TestOneUserOneLobbyOnCreate(t *testing.T) {
	m := game.NewLobbyManager()
	first, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", first.ID); err != nil {
		t.Fatal(err)
	}

	second, err := m.CreateLobby("u1", "host", 3)
	if err != nil {
		t.Fatal(err)
	}
	if second.ID == first.ID {
		t.Fatal("expected a new lobby")
	}

	if _, err := m.GetLobby(first.ID); err != nil {
		t.Fatalf("old lobby should still exist with remaining player: %v", err)
	}
	old, _ := m.GetLobby(first.ID)
	if len(old.Players) != 1 || old.Players[0].UserID != "u2" {
		t.Fatalf("old lobby players %+v", old.Players)
	}
	if !old.Players[0].Host || !old.Players[0].Ready {
		t.Fatalf("guest should be promoted to host %+v", old.Players[0])
	}

	cur, err := m.LobbyForUser("u1")
	if err != nil || cur.ID != second.ID {
		t.Fatalf("u1 should be in new lobby: %v %+v", err, cur)
	}
}

func TestOneUserOneLobbyOnJoin(t *testing.T) {
	m := game.NewLobbyManager()
	a, err := m.CreateLobby("u1", "a", 4)
	if err != nil {
		t.Fatal(err)
	}
	b, err := m.CreateLobby("u2", "b", 4)
	if err != nil {
		t.Fatal(err)
	}

	joined, err := m.JoinLobby("u1", "a", b.ID)
	if err != nil {
		t.Fatal(err)
	}
	if joined.ID != b.ID || len(joined.Players) != 2 {
		t.Fatalf("join result %+v", joined)
	}

	if _, err := m.GetLobby(a.ID); err == nil {
		t.Fatal("empty first lobby should be deleted")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyNotFound {
		t.Fatalf("got %v", err)
	}

	cur, err := m.LobbyForUser("u1")
	if err != nil || cur.ID != b.ID {
		t.Fatalf("u1 lobby %v %+v", err, cur)
	}
}

func TestReturnedLobbyIsACopy(t *testing.T) {
	m := game.NewLobbyManager()
	lobby, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	lobby.Players[0].Username = "mutated"
	lobby.Players = append(lobby.Players, game.LobbyPlayer{UserID: "fake"})

	got, err := m.GetLobby(lobby.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Players) != 1 || got.Players[0].Username != "host" {
		t.Fatalf("store mutated: %+v", got.Players)
	}
}

func TestToggleReady(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}

	if _, err := m.ToggleReady("u1", host.ID); err == nil {
		t.Fatal("expected HOST_CANNOT_TOGGLE")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyHostToggle {
		t.Fatalf("got %v", err)
	}

	lobby, err := m.ToggleReady("u2", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if !lobby.Players[1].Ready {
		t.Fatal("guest should be ready")
	}
	lobby, err = m.ToggleReady("u2", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if lobby.Players[1].Ready {
		t.Fatal("guest should be not-ready again")
	}

	if _, err := m.ToggleReady("u3", host.ID); err == nil {
		t.Fatal("expected NOT_IN_LOBBY")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyNotMember {
		t.Fatalf("got %v", err)
	}
}

func TestLeaveLobby(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}

	left, err := m.LeaveLobby("u2")
	if err != nil {
		t.Fatal(err)
	}
	if left == nil || len(left.Players) != 1 || left.Players[0].UserID != "u1" {
		t.Fatalf("after guest leave %+v", left)
	}
	if _, err := m.LobbyForUser("u2"); err == nil {
		t.Fatal("u2 should not be in a lobby")
	}

	gone, err := m.LeaveLobby("u1")
	if err != nil {
		t.Fatal(err)
	}
	if gone != nil {
		t.Fatalf("empty lobby should be deleted, got %+v", gone)
	}
	if _, err := m.GetLobby(host.ID); err == nil {
		t.Fatal("expected LOBBY_NOT_FOUND")
	}

	if _, err := m.LeaveLobby("u1"); err == nil {
		t.Fatal("expected LOBBY_NOT_FOUND")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyNotFound {
		t.Fatalf("got %v", err)
	}
}

func TestLeaveLobbyPromotesHost(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}

	left, err := m.LeaveLobby("u1")
	if err != nil {
		t.Fatal(err)
	}
	if len(left.Players) != 1 || left.Players[0].UserID != "u2" {
		t.Fatalf("players %+v", left.Players)
	}
	if !left.Players[0].Host || !left.Players[0].Ready {
		t.Fatalf("promoted host %+v", left.Players[0])
	}
}

func TestSeatsFromLobbyFillsBots(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}
	lobby, err := m.GetLobby(host.ID)
	if err != nil {
		t.Fatal(err)
	}

	mode, seats, err := game.SeatsFromLobby(lobby)
	if err != nil {
		t.Fatal(err)
	}
	if mode != game.ModeM2P2B {
		t.Fatalf("mode=%s want M2P2B", mode)
	}
	if len(seats) != 4 {
		t.Fatalf("seats=%d", len(seats))
	}

	wantKind := []game.SeatKind{game.SeatHuman, game.SeatHuman, game.SeatBot, game.SeatBot}
	wantUser := []string{"u1", "u2", "", ""}
	for i, s := range seats {
		if s.Color != game.AllColors[i] || s.Kind != wantKind[i] {
			t.Fatalf("seat %d: %+v", i, s)
		}
		if wantUser[i] == "" {
			if s.UserID != nil {
				t.Fatalf("bot seat %d has user %s", i, *s.UserID)
			}
			continue
		}
		if s.UserID == nil || *s.UserID != wantUser[i] {
			t.Fatalf("human seat %d userid %+v", i, s.UserID)
		}
	}

	solo, err := m.CreateLobby("u3", "solo", 4)
	if err != nil {
		t.Fatal(err)
	}
	mode, seats, err = game.SeatsFromLobby(solo)
	if err != nil || mode != game.ModeM1P3B {
		t.Fatalf("solo mode=%s err=%v", mode, err)
	}
	if seats[0].Kind != game.SeatHuman || seats[1].Kind != game.SeatBot {
		t.Fatalf("solo seats %+v", seats)
	}

	waiting := game.NewLobbyGame(solo.ID, mode, seats)
	if waiting.Status != game.StatusLobby || waiting.CurrentColor != game.ColorBlue {
		t.Fatalf("lobby game status=%s turn=%s", waiting.Status, waiting.CurrentColor)
	}
}

func TestStartGameRequiresReadyAndFillsBots(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}

	if _, err := m.StartGame(host.ID); err == nil {
		t.Fatal("expected NOT_ALL_READY")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyNotReady {
		t.Fatalf("got %v", err)
	}

	if _, err := m.ToggleReady("u2", host.ID); err != nil {
		t.Fatal(err)
	}
	state, err := m.StartGame(host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != game.StatusActive || state.Mode != game.ModeM2P2B {
		t.Fatalf("status=%s mode=%s", state.Status, state.Mode)
	}
	if state.CurrentColor != game.ColorBlue {
		t.Fatalf("turn=%s", state.CurrentColor)
	}

	lobby, err := m.GetLobby(host.ID)
	if err != nil || lobby.Status != game.LobbyInGame {
		t.Fatalf("lobby status %v %+v", err, lobby)
	}
	if _, err := m.JoinLobby("u3", "late", host.ID); err == nil {
		t.Fatal("expected LOBBY_IN_GAME")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyInGame {
		t.Fatalf("got %v", err)
	}
}

func TestStartGameSoloIsM1P3B(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	state, err := m.StartGame(host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Mode != game.ModeM1P3B || state.Seats[0].Kind != game.SeatHuman {
		t.Fatalf("mode=%s seats %+v", state.Mode, state.Seats)
	}
	if state.Seats[1].Kind != game.SeatBot || state.Seats[2].Kind != game.SeatBot || state.Seats[3].Kind != game.SeatBot {
		t.Fatalf("expected 3 bots %+v", state.Seats)
	}
}
