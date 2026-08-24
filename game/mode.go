package game

import (
	"fmt"
	"strings"
)

var AllModes = []GameMode{
	ModeM4P,
	ModeM1P3B,
	ModeM2P2B,
	ModeM3P1B,
}
func ParseMode(s string) (GameMode, error) {
	m := GameMode(strings.ToUpper(strings.TrimSpace(s)))
	for _, ok := range AllModes {
		if m == ok {
			return m, nil
		}
	}
	return "", fmt.Errorf("unknown mode %q (want M4P, M1P3B, M2P2B, or M3P1B)", s)
}

func ModeDescription(mode GameMode) string {
	switch mode {
	case ModeM4P:
		return "4 humans (1 color each)"
	case ModeM1P3B:
		return "1 human + 3 bots"
	case ModeM2P2B:
		return "2 humans + 2 bots"
	case ModeM3P1B:
		return "3 humans + 1 bot"
	default:
		return string(mode)
	}
}

//	M4P:   H H H H
//	M1P3B: H B B B
//	M2P2B: H H B B
//	M3P1B: H H H B
func DefaultSeatsForMode(mode GameMode) ([]Seat, error) {
	humanCount := 0
	switch mode {
	case ModeM4P:
		humanCount = 4
	case ModeM1P3B:
		humanCount = 1
	case ModeM2P2B:
		humanCount = 2
	case ModeM3P1B:
		humanCount = 3
	default:
		return nil, fmt.Errorf("unsupported mode %s", mode)
	}

	seats := make([]Seat, 0, 4)
	for i, c := range AllColors {
		kind := SeatBot
		if i < humanCount {
			kind = SeatHuman
		}
		seats = append(seats, Seat{Color: c, Kind: kind})
	}
	return seats, nil
}

func SeatKindOf(state *GameState, color Color) SeatKind {
	if state == nil {
		return SeatHuman
	}
	for _, s := range state.Seats {
		if s.Color == color {
			return s.Kind
		}
	}
	return SeatHuman
}

func IsBotTurn(state *GameState) bool {
	return SeatKindOf(state, state.CurrentColor) == SeatBot
}
