package game_test

import (
	"testing"
	"time"

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
	m.ReadyCheckDuration = time.Hour
	host, err := m.CreateLobby("u1", "a", 2)
	if err != nil {
		t.Fatal(err)
	}
	filled, err := m.JoinLobby("u2", "b", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if filled.Status != game.LobbyReadyCheck {
		t.Fatalf("full lobby should start ready check, status=%s", filled.Status)
	}
	_, err = m.JoinLobby("u3", "c", host.ID)
	if err == nil {
		t.Fatal("expected READY_CHECK_IN_PROGRESS")
	}
	if err.(*game.LobbyError).Code != game.ErrLobbyReadyCheck {
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

func TestReadyCheckSoloStartsM1P3B(t *testing.T) {
	m := game.NewLobbyManager()
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	lobby, state, err := m.BeginReadyCheck("u1", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state == nil {
		t.Fatal("solo host should start immediately")
	}
	if lobby.Status != game.LobbyInGame {
		t.Fatalf("lobby status=%s", lobby.Status)
	}
	if state.Status != game.StatusActive || state.Mode != game.ModeM1P3B {
		t.Fatalf("status=%s mode=%s", state.Status, state.Mode)
	}
	if state.CurrentColor != game.ColorBlue {
		t.Fatalf("turn=%s", state.CurrentColor)
	}
	if state.Seats[0].Kind != game.SeatHuman || state.Seats[0].UserID == nil || *state.Seats[0].UserID != "u1" {
		t.Fatalf("blue seat %+v", state.Seats[0])
	}
	if state.Seats[1].Kind != game.SeatBot || state.Seats[2].Kind != game.SeatBot || state.Seats[3].Kind != game.SeatBot {
		t.Fatalf("expected 3 bots %+v", state.Seats)
	}
}

func TestReadyCheckAllAcceptStartsGame(t *testing.T) {
	m := game.NewLobbyManager()
	m.ReadyCheckDuration = time.Hour
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}

	lobby, state, err := m.BeginReadyCheck("u1", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state != nil || lobby.Status != game.LobbyReadyCheck {
		t.Fatalf("should wait for guest accept, state=%v status=%s", state, lobby.Status)
	}
	if lobby.ReadyDeadline == nil {
		t.Fatal("expected ready deadline")
	}
	if !lobby.Players[0].Accepted || lobby.Players[1].Accepted {
		t.Fatalf("host accepted, guest not: %+v", lobby.Players)
	}

	if _, _, err := m.BeginReadyCheck("u2", host.ID); err == nil {
		t.Fatal("expected NOT_HOST")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyNotHost {
		t.Fatalf("got %v", err)
	}

	lobby, state, err = m.AcceptReadyCheck("u2", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state == nil || state.Mode != game.ModeM2P2B || state.Status != game.StatusActive {
		t.Fatalf("expected active M2P2B, state=%+v", state)
	}
	if lobby.Status != game.LobbyInGame {
		t.Fatalf("lobby status=%s", lobby.Status)
	}
	if _, err := m.JoinLobby("u3", "late", host.ID); err == nil {
		t.Fatal("expected LOBBY_IN_GAME")
	} else if err.(*game.LobbyError).Code != game.ErrLobbyInGame {
		t.Fatalf("got %v", err)
	}
}

func TestReadyCheckDeclineDoesNotStart(t *testing.T) {
	m := game.NewLobbyManager()
	m.ReadyCheckDuration = time.Hour
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}
	if _, _, err := m.BeginReadyCheck("u1", host.ID); err != nil {
		t.Fatal(err)
	}

	left, err := m.DeclineReadyCheck("u2", host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if left == nil || left.Status != game.LobbyWaiting {
		t.Fatalf("should return to waiting %+v", left)
	}
	if len(left.Players) != 1 || left.Players[0].UserID != "u1" {
		t.Fatalf("decliner should be replaced/removed %+v", left.Players)
	}

	got, err := m.GetLobby(host.ID)
	if err != nil || got.Status != game.LobbyWaiting {
		t.Fatalf("game must not start: %v %+v", err, got)
	}
}

func TestReadyCheckTimeoutRemovesUnaccepted(t *testing.T) {
	m := game.NewLobbyManager()
	m.ReadyCheckDuration = time.Hour
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}
	if _, _, err := m.BeginReadyCheck("u1", host.ID); err != nil {
		t.Fatal(err)
	}

	left, err := m.ExpireReadyCheck(host.ID)
	if err != nil {
		t.Fatal(err)
	}
	if left == nil || left.Status != game.LobbyWaiting {
		t.Fatalf("timeout must not start %+v", left)
	}
	if len(left.Players) != 1 || left.Players[0].UserID != "u1" {
		t.Fatalf("unaccepted guest should be dropped %+v", left.Players)
	}
	if _, err := m.LobbyForUser("u2"); err == nil {
		t.Fatal("u2 should no longer be in a lobby")
	}
}

func TestReadyCheckLeaveAborts(t *testing.T) {
	m := game.NewLobbyManager()
	m.ReadyCheckDuration = time.Hour
	host, err := m.CreateLobby("u1", "host", 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := m.JoinLobby("u2", "guest", host.ID); err != nil {
		t.Fatal(err)
	}
	if _, _, err := m.BeginReadyCheck("u1", host.ID); err != nil {
		t.Fatal(err)
	}

	left, err := m.LeaveLobby("u2")
	if err != nil {
		t.Fatal(err)
	}
	if left.Status != game.LobbyWaiting || len(left.Players) != 1 {
		t.Fatalf("leave during check should abort %+v", left)
	}
}
