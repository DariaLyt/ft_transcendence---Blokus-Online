package game

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"sync"
	"time"

	pb "blokus/game/proto/pb"
)

const DefaultTurnDuration = 60 * time.Second
const DefaultDisconnectGrace = 15 * time.Second

type GameEngine struct {
	pb.UnimplementedGameEngineServer
	mu              sync.Mutex
	byUser          map[int32]*GameState
	byGame          map[string]*GameState
	lobbies         *LobbyManager
	turnTimers      map[string]*time.Timer
	TurnDuration    time.Duration
	DisconnectGrace time.Duration
}

func NewGameEngine() *GameEngine {
	return &GameEngine{
		byUser:          make(map[int32]*GameState),
		byGame:          make(map[string]*GameState),
		lobbies:         NewLobbyManager(),
		turnTimers:      make(map[string]*time.Timer),
		TurnDuration:    DefaultTurnDuration,
		DisconnectGrace: DefaultDisconnectGrace,
	}
}

func (e *GameEngine) RegisterGame(state *GameState) {
	if e == nil || state == nil {
		return
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	e.registerGameLocked(state)
}

func (e *GameEngine) registerGameLocked(state *GameState) {
	e.byGame[state.ID] = state
	for _, seat := range state.Seats {
		if id, ok := parseUserID(seat.UserID); ok {
			e.byUser[id] = state
		}
	}
}

func (e *GameEngine) unregisterUserLocked(userID int32) {
	delete(e.byUser, userID)
}

func (e *GameEngine) ValidateAndMakeMove(_ context.Context, req *pb.MoveRequest) (*pb.GameStateResponse, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	var state *GameState
	if req != nil {
		state = e.byUser[req.GetUserId()]
	}
	resp := ValidateAndMakeMove(state, req)
	if state != nil {
		resp.State = encodeSnapshot(nil, state)
		if resp.GetIsValid() {
			e.armTurnTimerLocked(state)
		}
	}
	return resp, nil
}

func (e *GameEngine) HandleLobbyAction(_ context.Context, req *pb.LobbyActionRequest) (*pb.ActionResponse, error) {
	if req == nil {
		return failAction("INVALID_USER", "nil request"), nil
	}
	userID := strconv.Itoa(int(req.GetUserId()))
	action := strings.ToUpper(strings.TrimSpace(req.GetAction()))
	p := parseJSONPayload(req.GetPayload())
	lobbyID := firstNonEmpty(p.LobbyID, lobbyIDFor(e, userID))

	var (
		lobby *Lobby
		state *GameState
		err   error
	)

	switch action {
	case "CREATE_LOBBY":
		lobby, err = e.lobbies.CreateLobby(userID, p.Username, p.MaxPlayers)
	case "JOIN_LOBBY":
		lobby, err = e.lobbies.JoinLobby(userID, p.Username, p.LobbyID)
	case "TOGGLE_READY":
		lobby, err = e.lobbies.ToggleReady(userID, lobbyID)
	case "LEAVE_LOBBY":
		lobby, err = e.lobbies.LeaveLobby(userID)
	case "BEGIN_READY_CHECK":
		lobby, state, err = e.lobbies.BeginReadyCheck(userID, lobbyID)
	case "ACCEPT_READY_CHECK":
		lobby, state, err = e.lobbies.AcceptReadyCheck(userID, lobbyID)
	case "DECLINE_READY_CHECK":
		lobby, err = e.lobbies.DeclineReadyCheck(userID, lobbyID)
	default:
		return failAction("UNKNOWN_ACTION", "unknown lobby action "+action), nil
	}

	if err != nil {
		return failActionFromErr(err), nil
	}
	if state != nil {
		e.mu.Lock()
		e.registerGameLocked(state)
		_, _ = (&Bot{}).PlayBotTurnsIfNeeded(state)
		e.armTurnTimerLocked(state)
		e.mu.Unlock()
		if lobby == nil {
			lobby, _ = e.lobbies.GetLobby(state.ID)
		}
	}
	return okAction(encodeSnapshot(lobby, state)), nil
}

func (e *GameEngine) HandleGameAction(_ context.Context, req *pb.GameActionRequest) (*pb.ActionResponse, error) {
	if req == nil {
		return failAction("INVALID_USER", "nil request"), nil
	}
	action := strings.ToUpper(strings.TrimSpace(req.GetAction()))
	p := parseJSONPayload(req.GetPayload())
	userID := req.GetUserId()
	userKey := strconv.Itoa(int(userID))

	e.mu.Lock()
	defer e.mu.Unlock()
	state := e.byUser[userID]
	if state == nil && action != "DISCONNECT" {
		return failAction(string(ErrGameNotActive), "game is not active"), nil
	}

	switch action {
	case "MAKE_MOVE":
		resp := ValidateAndMakeMove(state, &pb.MoveRequest{
			UserId:   userID,
			Color:    p.Color,
			PieceId:  p.PieceID,
			OriginX:  int32(p.OriginX),
			OriginY:  int32(p.OriginY),
			Rotation: int32(p.Rotation),
			Flip:     p.Flip,
		})
		snap := encodeSnapshot(nil, state)
		if resp.GetIsValid() {
			e.armTurnTimerLocked(state)
			return okAction(snap), nil
		}
		return failActionState(codeFromEngineMessage(resp.GetErrorMessage()), resp.GetErrorMessage(), snap), nil
	case "PASS_TURN":
		color := state.CurrentColor
		if p.Color != "" {
			color = Color(strings.ToLower(p.Color))
		}
		if err := assertUserColor(state, userKey, color); err != nil {
			return failActionFromErr(err), nil
		}
		if err := PassTurn(state, color); err != nil {
			return failActionFromErr(err), nil
		}
		_, _ = (&Bot{}).PlayBotTurnsIfNeeded(state)
		e.armTurnTimerLocked(state)
		return okAction(encodeSnapshot(nil, state)), nil
	case "DISCONNECT":
		e.scheduleDisconnectLocked(userID)
		return okAction(encodeSnapshot(nil, state)), nil
	default:
		return failAction("UNKNOWN_ACTION", "unknown game action "+action), nil
	}
}

func (e *GameEngine) GetGameStateSnapshot(_ context.Context, req *pb.GameStateRequest) (*pb.ActionResponse, error) {
	if req == nil {
		return failAction("INVALID_USER", "nil request"), nil
	}
	uid := strconv.Itoa(int(req.GetUserId()))
	lobby, _ := e.lobbies.LobbyForUser(uid)
	e.mu.Lock()
	state := e.byUser[req.GetUserId()]
	if state == nil && lobby != nil {
		state = e.byGame[lobby.ID]
	}
	snap := encodeSnapshot(lobby, state)
	e.mu.Unlock()
	return okAction(snap), nil
}

func (e *GameEngine) ExpireTurn(gameID string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	state := e.byGame[gameID]
	if state == nil || state.Status != StatusActive {
		return
	}
	_ = PassTurn(state, state.CurrentColor)
	_, _ = (&Bot{}).PlayBotTurnsIfNeeded(state)
	e.armTurnTimerLocked(state)
}

func (e *GameEngine) Autofill(userID int32) *pb.ActionResponse {
	e.mu.Lock()
	defer e.mu.Unlock()
	state := e.byUser[userID]
	if state == nil {
		return failAction(string(ErrGameNotActive), "game is not active")
	}
	if err := (&Bot{}).Autofill(state); err != nil {
		return failAction("AUTOFILL_FAILED", err.Error())
	}
	e.armTurnTimerLocked(state)
	return okAction(encodeSnapshot(nil, state))
}

func (e *GameEngine) armTurnTimerLocked(state *GameState) {
	if state == nil {
		return
	}
	if t, ok := e.turnTimers[state.ID]; ok {
		t.Stop()
		delete(e.turnTimers, state.ID)
	}
	if state.Status != StatusActive {
		return
	}
	d := e.TurnDuration
	if d <= 0 {
		d = DefaultTurnDuration
	}
	id := state.ID
	e.turnTimers[id] = time.AfterFunc(d, func() {
		e.ExpireTurn(id)
	})
}

func (e *GameEngine) scheduleDisconnectLocked(userID int32) {
	grace := e.DisconnectGrace
	if grace <= 0 {
		e.disconnectNowLocked(userID)
		return
	}
	time.AfterFunc(grace, func() {
		e.mu.Lock()
		defer e.mu.Unlock()
		e.disconnectNowLocked(userID)
	})
}

func (e *GameEngine) disconnectNowLocked(userID int32) {
	state := e.byUser[userID]
	if state == nil || state.Status != StatusActive {
		return
	}
	if ConvertSeatToBot(state, strconv.Itoa(int(userID))) {
		e.unregisterUserLocked(userID)
		_, _ = (&Bot{}).PlayBotTurnsIfNeeded(state)
		e.armTurnTimerLocked(state)
	}
}

func ValidateAndMakeMove(state *GameState, req *pb.MoveRequest) *pb.GameStateResponse {
	if req == nil {
		return &pb.GameStateResponse{IsValid: false, ErrorMessage: "nil request"}
	}
	if state == nil || state.Status != StatusActive {
		return &pb.GameStateResponse{
			IsValid:           false,
			ErrorMessage:      string(ErrGameNotActive) + ": game is not active",
			CurrentTurnUserId: currentTurnUserID(state),
		}
	}

	userID := strconv.Itoa(int(req.GetUserId()))
	color := Color(strings.ToLower(strings.TrimSpace(req.GetColor())))
	if err := assertUserColor(state, userID, color); err != nil {
		return invalidMove(state, err)
	}

	move := Move{
		Color:    color,
		PieceID:  req.GetPieceId(),
		Rotation: Rotation(req.GetRotation()),
		Flipped:  req.GetFlip(),
		X:        int(req.GetOriginX()),
		Y:        int(req.GetOriginY()),
	}
	if err := ApplyMove(state, move); err != nil {
		return invalidMove(state, err)
	}

	_, _ = (&Bot{}).PlayBotTurnsIfNeeded(state)
	return &pb.GameStateResponse{
		IsValid:           true,
		CurrentTurnUserId: currentTurnUserID(state),
	}
}

func assertUserColor(state *GameState, userID string, color Color) error {
	for _, s := range state.Seats {
		if s.Color != color {
			continue
		}
		if s.Kind != SeatHuman || s.UserID == nil || *s.UserID != userID {
			return &MoveError{Code: ErrNotYourColor, Message: "this color is not assigned to this user"}
		}
		return nil
	}
	return &MoveError{Code: ErrNotYourColor, Message: "invalid color"}
}

func currentTurnUserID(state *GameState) int32 {
	if state == nil {
		return 0
	}
	for _, s := range state.Seats {
		if s.Color != state.CurrentColor {
			continue
		}
		if id, ok := parseUserID(s.UserID); ok {
			return id
		}
		return 0
	}
	return 0
}

func parseUserID(id *string) (int32, bool) {
	if id == nil || *id == "" {
		return 0, false
	}
	n, err := strconv.Atoi(*id)
	if err != nil {
		return 0, false
	}
	return int32(n), true
}

func invalidMove(state *GameState, err error) *pb.GameStateResponse {
	return &pb.GameStateResponse{
		IsValid:           false,
		ErrorMessage:      err.Error(),
		CurrentTurnUserId: currentTurnUserID(state),
	}
}

type actionPayload struct {
	MaxPlayers int    `json:"maxPlayers"`
	LobbyID    string `json:"lobbyId"`
	Username   string `json:"username"`
	Color      string `json:"color"`
	PieceID    string `json:"pieceId"`
	OriginX    int    `json:"originX"`
	OriginY    int    `json:"originY"`
	Rotation   int    `json:"rotation"`
	Flip       bool   `json:"flip"`
}

func parseJSONPayload(raw string) actionPayload {
	var p actionPayload
	if raw == "" {
		return p
	}
	_ = json.Unmarshal([]byte(raw), &p)
	return p
}

func encodeSnapshot(lobby *Lobby, state *GameState) string {
	wrap := map[string]any{}
	if lobby == nil && state == nil {
		wrap["status"] = "NO_ACTIVE_GAME"
	}
	if lobby != nil {
		wrap["lobby"] = lobby
	}
	if state != nil {
		wrap["game"] = state
	}
	b, err := json.Marshal(wrap)
	if err != nil {
		return `{"status":"NO_ACTIVE_GAME"}`
	}
	return string(b)
}

func okAction(state string) *pb.ActionResponse {
	return &pb.ActionResponse{Success: true, State: state}
}

func failAction(code, message string) *pb.ActionResponse {
	return failActionState(code, message, "")
}

func failActionState(code, message, state string) *pb.ActionResponse {
	return &pb.ActionResponse{Success: false, ErrorCode: code, Message: message, State: state}
}

func failActionFromErr(err error) *pb.ActionResponse {
	if le, ok := err.(*LobbyError); ok {
		return failAction(string(le.Code), le.Message)
	}
	if me, ok := err.(*MoveError); ok {
		return failAction(string(me.Code), me.Message)
	}
	return failAction("", err.Error())
}

func codeFromEngineMessage(msg string) string {
	if i := strings.Index(msg, ":"); i > 0 {
		return msg[:i]
	}
	return msg
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func lobbyIDFor(e *GameEngine, userID string) string {
	lobby, err := e.lobbies.LobbyForUser(userID)
	if err != nil || lobby == nil {
		return ""
	}
	return lobby.ID
}
