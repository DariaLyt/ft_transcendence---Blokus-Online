# Blokus game engine (Go)

This folder is the **game-logic** part of ft_transcendence: rules, pieces, modes, AI bots, terminal rendering, and a hotseat CLI to play/test locally.

It is a pure Go module (`blokus/game`). React / NestJS / Docker are **not** required to develop or verify the engine.

---

## What was done

### Core engine

| File | Responsibility |
|------|----------------|
| `types.go` | Colors, modes, seats, `GameState`, `Move`, error codes, board helpers |
| `pieces.go` | All **21** Blokus shapes, trays, `Footprint` / `AbsoluteCells` |
| `transform.go` | Normalize, flip, rotate, unique `Orientations` for move generation |
| `rules.go` | `ValidateMove`, `ApplyMove`, `LegalMoves`, auto-pass, scoring, endgame |
| `mode.go` | Mode parsing + default human/bot seat layouts |
| `bot.go` | Simple heuristic AI (`SuggestMove`, `PlayTurn`) |
| `render.go` | Colored ASCII board, hand, piece preview, scores |

### Supported game modes (v1)

| Mode | Seats (Blue → Yellow → Red → Green) |
|------|--------------------------------------|
| `M4P` | Human · Human · Human · Human |
| `M1P3B` | Human · Bot · Bot · Bot |
| `M2P2B` | Human · Human · Bot · Bot |
| `M3P1B` | Human · Human · Human · Bot |

Official dual-color (`M2P`) and shared-color (`M3P`) variants were **removed for now**.

### Rules implemented

- 20×20 board, turn order Blue → Yellow → Red → Green
- First piece of each color must cover that color’s starting corner
- Later pieces must touch own color by a **corner**, never by an **edge**
- Illegal moves return stable codes (`OUT_OF_BOUNDS`, `EDGE_TOUCH_OWN`, `NO_CORNER_TOUCH`, …)
- Auto-pass when a color has no legal moves; game ends when nobody can play
- Scoring: −1 per leftover square; **+15** if tray cleared; **+20** if cleared with monomino last

### AI (simple, explainable)

The bot scores legal moves with a heuristic:

- prefer larger pieces
- prefer placements toward the center
- reward new diagonal “anchors”
- avoid spending the monomino too early
- small randomness so play is not perfect/deterministic

### Hotseat CLI

`cmd/hotseat` — interactive terminal client to:

- choose a mode
- play as human(s)
- let bots take their turns automatically
- preview pieces / ghost placements
- autofill a full game for smoke testing

---

## Requirements

- Go **1.22+**

```bash
go version
```

---

## How to test (unit tests)

All `*_test.go` files live in `tests/` (external test package `game_test`).

From the `game/` folder:

```bash
# run all engine tests
go test ./tests/

# verbose
go test ./tests/ -v

# one test
go test ./tests/ -run TestValidateAndApplyFirstMoves -v

# with coverage of the game package
go test ./tests/ -coverpkg=blokus/game -cover
```

Coverage includes pieces, transforms, placement rules, scoring, modes, and bot legality.

---

## How to launch the game (hotseat CLI)

From the `game/` folder:

```bash
# interactive mode menu (Enter defaults to M1P3B)
go run ./cmd/hotseat

# pick mode + reproducible bot RNG
go run ./cmd/hotseat -mode M1P3B
go run ./cmd/hotseat -mode M2P2B -seed 42
go run ./cmd/hotseat -mode M4P
```

### Useful CLI commands

| Command | Meaning |
|---------|---------|
| `help` | List commands |
| `board` | Redraw board |
| `hand` | Show current hand |
| `seats` | Show human/bot seats |
| `show L5 90 1` | Preview piece (rot + flip) |
| `legal 20` | List legal moves |
| `ghost I5 0 0` | Preview placement on board |
| `place I5 0 0` | Place piece |
| `place V3 1 1 90 0` | Place with rotation |
| `auto` | Let heuristic bot play **this** turn once |
| `autofill` | Auto-play until the game ends |
| `scores` | Score estimate |
| `quit` | Exit |

### Quick smoke checklist

1. Start `M1P3B` (you = blue, three bots).
2. First blue move must cover corner `(0,0)`, e.g. `place I5 0 0`.
3. Bots for yellow / red / green should play automatically.
4. Use `legal` / `ghost` before placing to verify rules feedback.
5. Run `autofill` once and confirm the game finishes with scores.

Yellow first corner is `(19,0)`, red `(19,19)`, green `(0,19)`.

---

## Package layout

```
game/
  types.go
  pieces.go
  transform.go
  rules.go
  mode.go
  bot.go
  render.go
  tests/             # all *_test.go (package game_test)
  cmd/hotseat/       # playable CLI
  go.mod             # module blokus/game
```

Import path for other Go services later:

```go
import "blokus/game"
```

---

## Not done yet (next game-side steps)

- WebSocket / HTTP `game-server` for remote play (React clients)
- JWT join auth + finish callback to NestJS
- Stronger AI / difficulty levels (optional)
- Re-add `M2P` / `M3P` official variants if the team wants them

---
