package game

import (
	"fmt"
	"math/rand"
)


type Bot struct {
	RNG *rand.Rand
}

func (b *Bot) SuggestMove(state *GameState, color Color) (Move, error) {
	if state == nil {
		return Move{}, fmt.Errorf("nil state")
	}
	moves := LegalMoves(state, color, 0)
	if len(moves) == 0 {
		return Move{}, fmt.Errorf("no legal moves for %s", color)
	}

	rng := b.RNG
	if rng == nil {
		rng = rand.New(rand.NewSource(rand.Int63()))
	}

	bestScore := -1 << 30
	var best []Move

	for _, m := range moves {
		s := scoreMove(state, m, rng)
		if s > bestScore {
			bestScore = s
			best = []Move{m}
		} else if s == bestScore {
			best = append(best, m)
		}
	}

	return best[rng.Intn(len(best))], nil
}

func (b *Bot) PlayTurn(state *GameState) (Move, error) {
	if state == nil || state.Status != StatusActive {
		return Move{}, fmt.Errorf("game not active")
	}
	ResolvePasses(state)
	if state.Status != StatusActive {
		return Move{}, fmt.Errorf("game already finished")
	}
	m, err := b.SuggestMove(state, state.CurrentColor)
	if err != nil {
		ResolvePasses(state)
		return Move{}, err
	}
	if err := ApplyMove(state, m); err != nil {
		return Move{}, err
	}
	return m, nil
}

func (b *Bot) PlayBotTurnsIfNeeded(state *GameState) (int, error) {
	n := 0
	for state.Status == StatusActive && IsBotTurn(state) {
		if _, err := b.PlayTurn(state); err != nil {
			ResolvePasses(state)
			if state.Status != StatusActive {
				break
			}
			if !IsBotTurn(state) {
				break
			}
			state.Passed[state.CurrentColor] = true
			advanceTurn(state)
			ResolvePasses(state)
			continue
		}
		n++
		if n > 200 {
			return n, fmt.Errorf("bot turn safety limit reached")
		}
	}
	return n, nil
}

func (b *Bot) Autofill(state *GameState) error {
	steps := 0
	for state != nil && state.Status == StatusActive {
		ResolvePasses(state)
		if state.Status != StatusActive {
			break
		}
		if _, err := b.PlayTurn(state); err != nil {
			ResolvePasses(state)
			if state.Status == StatusActive && !state.Passed[state.CurrentColor] {
				state.Passed[state.CurrentColor] = true
				advanceTurn(state)
				ResolvePasses(state)
			}
		}
		steps++
		if steps > 400 {
			return fmt.Errorf("autofill safety limit reached")
		}
	}
	return nil
}

func scoreMove(state *GameState, m Move, rng *rand.Rand) int {
	size := PieceSize(PieceID(m.PieceID))
	score := size * 40
	remaining := len(state.Remaining[m.Color])
	if m.PieceID == string(Piece1) && remaining > 3 {
		score -= 80
	}

	cells, err := AbsoluteCells(m)
	if err != nil {
		return -1 << 29
	}
	for _, c := range cells {
		dx := c.X - (BoardSize / 2)
		dy := c.Y - (BoardSize / 2)
		if dx < 0 {
			dx = -dx
		}
		if dy < 0 {
			dy = -dy
		}
		dist := dx + dy
		score += (20 - dist)
	}

	anchors := 0
	occupied := map[Cell]bool{}
	for _, c := range cells {
		occupied[c] = true
	}
	for _, c := range cells {
		for _, d := range diagDirs {
			nx, ny := c.X+d.X, c.Y+d.Y
			if !inBounds(nx, ny) {
				continue
			}
			nc := Cell{X: nx, Y: ny}
			if occupied[nc] {
				continue
			}
			if state.Board[ny][nx] != nil {
				continue
			}
			if wouldEdgeTouchOwn(state, m.Color, occupied, nx, ny) {
				continue
			}
			anchors++
		}
	}
	score += anchors * 6
	score += rng.Intn(15)
	return score
}

func wouldEdgeTouchOwn(state *GameState, color Color, pieceCells map[Cell]bool, x, y int) bool {
	for _, d := range orthoDirs {
		nx, ny := x+d.X, y+d.Y
		if !inBounds(nx, ny) {
			continue
		}
		if pieceCells[Cell{X: nx, Y: ny}] {
			return true
		}
		if occ := state.Board[ny][nx]; occ != nil && *occ == color {
			return true
		}
	}
	return false
}
