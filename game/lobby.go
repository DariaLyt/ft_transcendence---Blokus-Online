package game

import (
	"crypto/rand"
	"fmt"
	"sync"
	"time"
)

type LobbyStatus string

const (
	LobbyWaiting LobbyStatus = "waiting"
	LobbyInGame  LobbyStatus = "in_game"
)

type LobbyPlayer struct {
	UserID   string `json:"userId"`
	Username string `json:"username,omitempty"`
	Ready    bool   `json:"isReady"`
	Host     bool   `json:"isHost"`
}

type Lobby struct {
	ID         string        `json:"id"`
	MaxPlayers int           `json:"maxPlayers"`
	Status     LobbyStatus   `json:"status"`
	Players    []LobbyPlayer `json:"players"`
	CreatedAt  time.Time     `json:"createdAt"`
}

type LobbyErrorCode string

const (
	ErrLobbyNotFound          LobbyErrorCode = "LOBBY_NOT_FOUND"
	ErrLobbyFull              LobbyErrorCode = "LOBBY_FULL"
	ErrLobbyInGame            LobbyErrorCode = "LOBBY_IN_GAME"
	ErrLobbyAlreadyMember     LobbyErrorCode = "ALREADY_IN_LOBBY"
	ErrLobbyInvalidMaxPlayers LobbyErrorCode = "INVALID_MAX_PLAYERS"
	ErrLobbyInvalidUser       LobbyErrorCode = "INVALID_USER"
	ErrLobbyNotMember         LobbyErrorCode = "NOT_IN_LOBBY"
	ErrLobbyHostToggle        LobbyErrorCode = "HOST_CANNOT_TOGGLE"
	ErrLobbyNotReady          LobbyErrorCode = "NOT_ALL_READY"
	ErrLobbyEmpty             LobbyErrorCode = "LOBBY_EMPTY"
)

type LobbyError struct {
	Code    LobbyErrorCode `json:"code"`
	Message string         `json:"message"`
}

func (e *LobbyError) Error() string {
	if e.Message != "" {
		return string(e.Code) + ": " + e.Message
	}
	return string(e.Code)
}

// LobbyManager is an in-memory store. One user may be in at most one lobby.
type LobbyManager struct {
	mu      sync.Mutex
	lobbies map[string]*Lobby
	byUser  map[string]string
}

func NewLobbyManager() *LobbyManager {
	return &LobbyManager{
		lobbies: make(map[string]*Lobby),
		byUser:  make(map[string]string),
	}
}

func (m *LobbyManager) CreateLobby(userID, username string, maxPlayers int) (*Lobby, error) {
	if userID == "" {
		return nil, &LobbyError{Code: ErrLobbyInvalidUser, Message: "user id is required"}
	}
	if maxPlayers == 0 {
		maxPlayers = 4
	}
	if maxPlayers < 2 || maxPlayers > 4 {
		return nil, &LobbyError{Code: ErrLobbyInvalidMaxPlayers, Message: "maxPlayers must be 2-4"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	m.removeUserLocked(userID)

	id := newLobbyID()
	lobby := &Lobby{
		ID:         id,
		MaxPlayers: maxPlayers,
		Status:     LobbyWaiting,
		Players: []LobbyPlayer{{
			UserID:   userID,
			Username: username,
			Ready:    true,
			Host:     true,
		}},
		CreatedAt: time.Now().UTC(),
	}
	m.lobbies[id] = lobby
	m.byUser[userID] = id
	return cloneLobby(lobby), nil
}

func (m *LobbyManager) JoinLobby(userID, username, lobbyID string) (*Lobby, error) {
	if userID == "" {
		return nil, &LobbyError{Code: ErrLobbyInvalidUser, Message: "user id is required"}
	}
	if lobbyID == "" {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	lobby, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	if lobby.Status != LobbyWaiting {
		return nil, &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	}
	for _, p := range lobby.Players {
		if p.UserID == userID {
			return nil, &LobbyError{Code: ErrLobbyAlreadyMember, Message: "already in this lobby"}
		}
	}
	if len(lobby.Players) >= lobby.MaxPlayers {
		return nil, &LobbyError{Code: ErrLobbyFull, Message: "lobby is full"}
	}

	if cur, ok := m.byUser[userID]; ok && cur != lobbyID {
		m.removeUserLocked(userID)
	}

	lobby.Players = append(lobby.Players, LobbyPlayer{
		UserID:   userID,
		Username: username,
		Ready:    false,
		Host:     false,
	})
	m.byUser[userID] = lobbyID
	return cloneLobby(lobby), nil
}

func (m *LobbyManager) ToggleReady(userID, lobbyID string) (*Lobby, error) {
	if userID == "" {
		return nil, &LobbyError{Code: ErrLobbyInvalidUser, Message: "user id is required"}
	}
	if lobbyID == "" {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	lobby, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	if lobby.Status != LobbyWaiting {
		return nil, &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	}

	for i := range lobby.Players {
		if lobby.Players[i].UserID != userID {
			continue
		}
		if lobby.Players[i].Host {
			return nil, &LobbyError{Code: ErrLobbyHostToggle, Message: "host is always ready"}
		}
		lobby.Players[i].Ready = !lobby.Players[i].Ready
		return cloneLobby(lobby), nil
	}
	return nil, &LobbyError{Code: ErrLobbyNotMember, Message: "not in this lobby"}
}

func (m *LobbyManager) LeaveLobby(userID string) (*Lobby, error) {
	if userID == "" {
		return nil, &LobbyError{Code: ErrLobbyInvalidUser, Message: "user id is required"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	id, ok := m.byUser[userID]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "user is not in a lobby"}
	}
	lobby := m.lobbies[id]
	if lobby != nil && lobby.Status != LobbyWaiting {
		return nil, &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	}

	m.removeUserLocked(userID)
	leftover, ok := m.lobbies[id]
	if !ok {
		return nil, nil
	}
	return cloneLobby(leftover), nil
}

func (m *LobbyManager) StartGame(lobbyID string) (*GameState, error) {
	if lobbyID == "" {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	lobby, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	if lobby.Status != LobbyWaiting {
		return nil, &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	}
	for _, p := range lobby.Players {
		if !p.Ready {
			return nil, &LobbyError{Code: ErrLobbyNotReady, Message: "not all players are ready"}
		}
	}

	mode, seats, err := SeatsFromLobby(lobby)
	if err != nil {
		return nil, err
	}
	lobby.Status = LobbyInGame
	return NewActiveGame(lobby.ID, mode, seats), nil
}

func (m *LobbyManager) GetLobby(id string) (*Lobby, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	lobby, ok := m.lobbies[id]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	return cloneLobby(lobby), nil
}

func (m *LobbyManager) LobbyForUser(userID string) (*Lobby, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	id, ok := m.byUser[userID]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "user is not in a lobby"}
	}
	lobby, ok := m.lobbies[id]
	if !ok {
		delete(m.byUser, userID)
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	return cloneLobby(lobby), nil
}

func (m *LobbyManager) removeUserLocked(userID string) {
	id, ok := m.byUser[userID]
	if !ok {
		return
	}
	delete(m.byUser, userID)

	lobby, ok := m.lobbies[id]
	if !ok {
		return
	}

	next := make([]LobbyPlayer, 0, len(lobby.Players))
	for _, p := range lobby.Players {
		if p.UserID != userID {
			next = append(next, p)
		}
	}
	if len(next) == 0 {
		delete(m.lobbies, id)
		return
	}

	hasHost := false
	for _, p := range next {
		if p.Host {
			hasHost = true
			break
		}
	}
	if !hasHost {
		next[0].Host = true
		next[0].Ready = true
	}
	lobby.Players = next
}

func cloneLobby(l *Lobby) *Lobby {
	if l == nil {
		return nil
	}
	out := *l
	out.Players = append([]LobbyPlayer(nil), l.Players...)
	return &out
}

func SeatsFromLobby(lobby *Lobby) (GameMode, []Seat, error) {
	if lobby == nil || len(lobby.Players) == 0 {
		return "", nil, &LobbyError{Code: ErrLobbyEmpty, Message: "lobby has no players"}
	}
	n := len(lobby.Players)
	if n > 4 {
		return "", nil, &LobbyError{Code: ErrLobbyFull, Message: "more than 4 players"}
	}

	var mode GameMode
	switch n {
	case 1:
		mode = ModeM1P3B
	case 2:
		mode = ModeM2P2B
	case 3:
		mode = ModeM3P1B
	default:
		mode = ModeM4P
	}

	seats := make([]Seat, 0, 4)
	for i, c := range AllColors {
		if i < n {
			uid := lobby.Players[i].UserID
			seats = append(seats, Seat{Color: c, Kind: SeatHuman, UserID: &uid})
			continue
		}
		seats = append(seats, Seat{Color: c, Kind: SeatBot})
	}
	return mode, seats, nil
}

func newLobbyID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
