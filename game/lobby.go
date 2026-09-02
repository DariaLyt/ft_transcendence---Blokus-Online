package game

import (
	"crypto/rand"
	"fmt"
	"sync"
	"time"
)

const DefaultReadyCheckDuration = 15 * time.Second

type LobbyStatus string

const (
	LobbyWaiting     LobbyStatus = "waiting"
	LobbyReadyCheck  LobbyStatus = "ready_check"
	LobbyInGame      LobbyStatus = "in_game"
)

type LobbyPlayer struct {
	UserID   string `json:"userId"`
	Username string `json:"username,omitempty"`
	Ready    bool   `json:"isReady"`
	Host     bool   `json:"isHost"`
	Accepted bool   `json:"accepted"`
}

type Lobby struct {
	ID            string        `json:"id"`
	MaxPlayers    int           `json:"maxPlayers"`
	Status        LobbyStatus   `json:"status"`
	Players       []LobbyPlayer `json:"players"`
	CreatedAt     time.Time     `json:"createdAt"`
	ReadyDeadline *time.Time    `json:"readyDeadline,omitempty"`
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
	ErrLobbyReadyCheck        LobbyErrorCode = "READY_CHECK_IN_PROGRESS"
	ErrLobbyNoReadyCheck      LobbyErrorCode = "NO_READY_CHECK"
	ErrLobbyNotHost           LobbyErrorCode = "NOT_HOST"
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

type LobbyManager struct {
	mu                 sync.Mutex
	lobbies            map[string]*Lobby
	byUser             map[string]string
	timers             map[string]*time.Timer
	ReadyCheckDuration time.Duration
}

func NewLobbyManager() *LobbyManager {
	return &LobbyManager{
		lobbies:            make(map[string]*Lobby),
		byUser:             make(map[string]string),
		timers:             make(map[string]*time.Timer),
		ReadyCheckDuration: DefaultReadyCheckDuration,
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

	m.removeUserAndAbortCheckLocked(userID)

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
	if err := joinBlocked(lobby.Status); err != nil {
		return nil, err
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
		m.removeUserAndAbortCheckLocked(userID)
	}

	lobby.Players = append(lobby.Players, LobbyPlayer{
		UserID:   userID,
		Username: username,
		Ready:    false,
		Host:     false,
	})
	m.byUser[userID] = lobbyID

	if len(lobby.Players) >= lobby.MaxPlayers {
		if _, err := m.beginReadyCheckLocked(lobby); err != nil {
			return nil, err
		}
	}
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
	if err := joinBlocked(lobby.Status); err != nil {
		return nil, err
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
	if lobby != nil && lobby.Status == LobbyInGame {
		return nil, &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	}

	wasCheck := lobby != nil && lobby.Status == LobbyReadyCheck
	m.removeUserLocked(userID)
	leftover, ok := m.lobbies[id]
	if !ok {
		return nil, nil
	}
	if wasCheck {
		m.abortReadyCheckLocked(leftover)
	}
	return cloneLobby(leftover), nil
}

func (m *LobbyManager) BeginReadyCheck(userID, lobbyID string) (*Lobby, *GameState, error) {
	if userID == "" {
		return nil, nil, &LobbyError{Code: ErrLobbyInvalidUser, Message: "user id is required"}
	}
	if lobbyID == "" {
		return nil, nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	lobby, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	if !hasPlayer(lobby, userID) {
		return nil, nil, &LobbyError{Code: ErrLobbyNotMember, Message: "not in this lobby"}
	}
	if !isHost(lobby, userID) {
		return nil, nil, &LobbyError{Code: ErrLobbyNotHost, Message: "only the host can start a ready check"}
	}
	if lobby.Status == LobbyInGame {
		return nil, nil, &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	}
	if lobby.Status == LobbyReadyCheck {
		return nil, nil, &LobbyError{Code: ErrLobbyReadyCheck, Message: "ready check already in progress"}
	}

	state, err := m.beginReadyCheckLocked(lobby)
	if err != nil {
		return nil, nil, err
	}
	return cloneLobby(lobby), state, nil
}

func (m *LobbyManager) AcceptReadyCheck(userID, lobbyID string) (*Lobby, *GameState, error) {
	if userID == "" {
		return nil, nil, &LobbyError{Code: ErrLobbyInvalidUser, Message: "user id is required"}
	}
	if lobbyID == "" {
		return nil, nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	lobby, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	if lobby.Status != LobbyReadyCheck {
		return nil, nil, &LobbyError{Code: ErrLobbyNoReadyCheck, Message: "no ready check in progress"}
	}

	found := false
	for i := range lobby.Players {
		if lobby.Players[i].UserID != userID {
			continue
		}
		lobby.Players[i].Accepted = true
		found = true
		break
	}
	if !found {
		return nil, nil, &LobbyError{Code: ErrLobbyNotMember, Message: "not in this lobby"}
	}

	if !allAccepted(lobby) {
		return cloneLobby(lobby), nil, nil
	}
	state, err := m.startGameLocked(lobby)
	if err != nil {
		return nil, nil, err
	}
	return cloneLobby(lobby), state, nil
}

func (m *LobbyManager) DeclineReadyCheck(userID, lobbyID string) (*Lobby, error) {
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
	if lobby.Status != LobbyReadyCheck {
		return nil, &LobbyError{Code: ErrLobbyNoReadyCheck, Message: "no ready check in progress"}
	}
	if !hasPlayer(lobby, userID) {
		return nil, &LobbyError{Code: ErrLobbyNotMember, Message: "not in this lobby"}
	}

	m.removeUserLocked(userID)
	leftover, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, nil
	}
	m.abortReadyCheckLocked(leftover)
	return cloneLobby(leftover), nil
}

func (m *LobbyManager) ExpireReadyCheck(lobbyID string) (*Lobby, error) {
	if lobbyID == "" {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	lobby, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, &LobbyError{Code: ErrLobbyNotFound, Message: "lobby not found"}
	}
	if lobby.Status != LobbyReadyCheck {
		return cloneLobby(lobby), nil
	}

	m.stopTimerLocked(lobbyID)

	var drop []string
	for _, p := range lobby.Players {
		if !p.Accepted {
			drop = append(drop, p.UserID)
		}
	}
	for _, uid := range drop {
		m.removeUserLocked(uid)
	}

	leftover, ok := m.lobbies[lobbyID]
	if !ok {
		return nil, nil
	}
	leftover.Status = LobbyWaiting
	leftover.ReadyDeadline = nil
	for i := range leftover.Players {
		leftover.Players[i].Accepted = false
	}
	return cloneLobby(leftover), nil
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

func (m *LobbyManager) beginReadyCheckLocked(lobby *Lobby) (*GameState, error) {
	for i := range lobby.Players {
		lobby.Players[i].Accepted = lobby.Players[i].Host
	}
	if allAccepted(lobby) {
		return m.startGameLocked(lobby)
	}

	deadline := time.Now().UTC().Add(m.readyCheckDuration())
	lobby.Status = LobbyReadyCheck
	lobby.ReadyDeadline = &deadline
	id := lobby.ID
	m.stopTimerLocked(id)
	m.timers[id] = time.AfterFunc(m.readyCheckDuration(), func() {
		_, _ = m.ExpireReadyCheck(id)
	})
	return nil, nil
}

func (m *LobbyManager) startGameLocked(lobby *Lobby) (*GameState, error) {
	mode, seats, err := SeatsFromLobby(lobby)
	if err != nil {
		return nil, err
	}
	m.stopTimerLocked(lobby.ID)
	lobby.Status = LobbyInGame
	lobby.ReadyDeadline = nil
	return NewActiveGame(lobby.ID, mode, seats), nil
}

func (m *LobbyManager) abortReadyCheckLocked(lobby *Lobby) {
	m.stopTimerLocked(lobby.ID)
	lobby.Status = LobbyWaiting
	lobby.ReadyDeadline = nil
	for i := range lobby.Players {
		lobby.Players[i].Accepted = false
	}
}

func (m *LobbyManager) stopTimerLocked(id string) {
	if t, ok := m.timers[id]; ok {
		t.Stop()
		delete(m.timers, id)
	}
}

func (m *LobbyManager) readyCheckDuration() time.Duration {
	if m.ReadyCheckDuration <= 0 {
		return DefaultReadyCheckDuration
	}
	return m.ReadyCheckDuration
}

func (m *LobbyManager) removeUserAndAbortCheckLocked(userID string) {
	id, ok := m.byUser[userID]
	if !ok {
		return
	}
	wasCheck := false
	if lobby, exists := m.lobbies[id]; exists && lobby.Status == LobbyReadyCheck {
		wasCheck = true
	}
	m.removeUserLocked(userID)
	if leftover, exists := m.lobbies[id]; exists && wasCheck {
		m.abortReadyCheckLocked(leftover)
	}
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
		m.stopTimerLocked(id)
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
	if l.ReadyDeadline != nil {
		t := *l.ReadyDeadline
		out.ReadyDeadline = &t
	}
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

func joinBlocked(status LobbyStatus) error {
	switch status {
	case LobbyWaiting:
		return nil
	case LobbyReadyCheck:
		return &LobbyError{Code: ErrLobbyReadyCheck, Message: "ready check in progress"}
	case LobbyInGame:
		return &LobbyError{Code: ErrLobbyInGame, Message: "game already in progress"}
	default:
		return &LobbyError{Code: ErrLobbyInGame, Message: "lobby is not joinable"}
	}
}

func isHost(lobby *Lobby, userID string) bool {
	for _, p := range lobby.Players {
		if p.UserID == userID {
			return p.Host
		}
	}
	return false
}

func hasPlayer(lobby *Lobby, userID string) bool {
	for _, p := range lobby.Players {
		if p.UserID == userID {
			return true
		}
	}
	return false
}

func allAccepted(lobby *Lobby) bool {
	if len(lobby.Players) == 0 {
		return false
	}
	for _, p := range lobby.Players {
		if !p.Accepted {
			return false
		}
	}
	return true
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
