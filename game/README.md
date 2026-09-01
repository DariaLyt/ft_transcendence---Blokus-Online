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

## Next: step-by-step plan (game-side)

The engine, CLI, and tests are enough for local play. Remote play is **not** “React talks to Go”. NestJS already owns WebSockets + JWT; Go should own **lobby + rules**. Nest will call Go over **gRPC**.

```
Browser (React)
    │  WebSocket JSON  (CREATE_LOBBY, MAKE_MOVE, RESYNC, …)
    ▼
NestJS  (auth, sockets, broadcast)
    │  gRPC  (HandleLobbyAction / HandleGameAction / GetGameStateSnapshot)
    ▼
Go game-server  (this folder)  →  engine (ValidateMove / ApplyMove / Bot)
```

Do the steps **in order**. Each step should stay playable with `go test ./tests/` (and a tiny gRPC smoke client once the server exists). Do not start Docker or Nest wiring until the Go server answers the three RPCs locally.

### Step 1 — In-memory lobby (no network)

Add a lobby manager in this module (new files, e.g. `lobby.go`). Mirror what Nest already sends:

| Action | Meaning |
|--------|---------|
| `CREATE_LOBBY` | host + `maxPlayers` 2–4, unique lobby id |
| `JOIN_LOBBY` | join by id; reject full / already in-game / already seated |
| `TOGGLE_READY` | non-host ready flag |
| `LEAVE_LOBBY` | remove player; delete empty lobby; one lobby per user |

Rules to encode now (from the lobby flow doc):

- One user → at most one lobby / game.
- Seats map to colors in order Blue → Yellow → Red → Green.
- Empty seats become **bots** using existing modes (`M1P3B`, `M2P2B`, `M3P1B`, `M4P`).
- Keep status `WAITING` until ready-check succeeds. `GameState.StatusLobby` already exists; `NewActiveGame` still starts `active` — add a `NewLobby` / `StartGame` path instead of skipping the lobby.

**Done when:** unit tests create / join / ready / leave without gRPC.

### Step 2 — Ready-check → start a real `GameState`

When the lobby is full (or host starts) and everyone accepted:

1. 15s ready window (timer can live in Go; Nest only forwards accept/decline).
2. On success: `NewActiveGame`, assign `Seat.UserID` for humans, `SeatBot` for the rest.
3. On decline / timeout: replace the missing seat (bot or wait) — do **not** start.

**Done when:** a 1-human lobby becomes `M1P3B` and `CurrentColor` is Blue.

### Step 3 — Freeze the gRPC contract (proto-first)

See **gRPC research** below. Put a single `.proto` in this folder (e.g. `proto/game.proto`) so Nest and Go generate from the **same file**.

Use the team’s three unary RPCs first (they already match `GameModules` in Nest):

- `HandleLobbyAction(user_id, action, payload)`
- `HandleGameAction(user_id, action, payload)`
- `GetGameStateSnapshot(user_id)`

Improve the sketch before generating code:

- `ActionResponse` needs more than `bool success`: `error_code`, `message`, and a `state` JSON string so Nest can broadcast after every call.
- Keep `payload` as JSON **for v1** so Nest can keep sending `MAKE_MOVE` / `CREATE_LOBBY` without a proto change per action.
- Add `syntax = "proto3";` and a `package` (e.g. `blokus.game.v1`).

Optional later: typed RPCs (`CreateLobby`, `MakeMove`) or a **server stream** of events. Do not need them to ship remote play.

**Done when:** `protoc` generates Go stubs; Nest can copy the same `.proto`.

### Step 4 — Go gRPC server (unary only)

New binary, e.g. `cmd/gameserver`:

1. Listen on `0.0.0.0:50051` (Nest’s planned client URL).
2. Implement the three RPCs; dispatch `action` strings to the lobby manager + engine.
3. `MAKE_MOVE` → `ValidateMove` / `ApplyMove`; then `Bot.PlayBotTurnsIfNeeded`.
4. `PASS_TURN` → mark passed / `ResolvePasses` (engine already auto-passes when there are no legal moves; keep an explicit pass for the 60s turn timer).
5. `GetGameStateSnapshot` → JSON of `GameState` for that `user_id` (or `NO_ACTIVE_GAME`).

Auth: Nest already authenticates the WebSocket. **Trust `user_id` from Nest** in v1 (internal Docker network). JWT verification inside Go is a later hardening step, not a blocker.

**Done when:** `grpcurl` or a 20-line Go client can create a lobby and read a snapshot. Hotseat CLI stays as-is.

### Step 5 — Gameplay loop + finish callback

- Turn timer (e.g. 60s): if no move, pass or abort per product decision (lobby doc currently says stop the game on timeout).
- Disconnect: keep the seat for a grace period, then bot-takeover or forfeit.
- On `StatusFinished`: compute scores (already in `ComputeScores`) and return them in the snapshot.
- Finish callback to Nest: either Nest reads the finished snapshot after `HandleGameAction`, or add a later RPC / event. Prefer “Nest stores stats from the snapshot” so Go stays DB-free.

**Done when:** `M1P3B` over gRPC plays to scores; illegal moves return engine codes (`EDGE_TOUCH_OWN`, …).

### Step 6 — Hand off to Nest / Docker (game folder only prepares)

Game-side checklist for the other teams (implementation lives outside this folder):

- Nest `GameModules` mock → real gRPC client (`@grpc/grpc-js` + same `.proto`).
- After each RPC, Nest broadcasts the returned `state` on the existing WebSocket.
- Compose: add a `gameserver` service, Nest points at `gameserver:50051`.

### Later (do not block remote play)

- Stronger AI / difficulty levels (optional module polish).
- Re-add official `M2P` / `M3P` if the team wants them.
- gRPC TLS, JWT in Go, server-streaming events, tournaments / spectators.

---

## gRPC research (short)

**What it is.** gRPC is an RPC framework: you define methods + message types in a `.proto` file (Protocol Buffers, use **proto3**). `protoc` generates stubs. The client calls a method as if it were local; the server implements it. Transport is HTTP/2 + binary protobuf — smaller and stricter than JSON REST. Official intro: [grpc.io — Introduction](https://grpc.io/docs/what-is-grpc/introduction/).

**Why it fits this project.** The engine is Go; the public API is NestJS WebSockets. Browsers should **not** speak gRPC (no native support; grpc-web is extra complexity). Internal Nest → Go is exactly what gRPC is for: typed contract, codegen in both languages, one process owns rules.

**Four call types.** Unary (request/response) is enough for v1. Server-streaming would let Go push board events; skip it until unary + Nest broadcast is working.

**Go toolchain** ([Go quick start](https://grpc.io/docs/languages/go/quickstart/)):

```bash
# plugins (once)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
export PATH="$PATH:$(go env GOPATH)/bin"

# generate next to proto (example)
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/game.proto
```

Runtime: `google.golang.org/grpc`. Server listens with `grpc.NewServer()`, registers the generated `GameServiceServer`.

**Nest side (not in this folder).** Nest is the **client**: `ClientsModule` + `Transport.GRPC`, `protoPath` pointing at the shared file, URL `localhost:50051` (Compose: `gameserver:50051`). That replaces the current `gameModules` console mocks.

**Contract advice for our proto sketch**

| Keep | Change |
|------|--------|
| Three RPCs matching Nest `GameModules` | Give `ActionResponse` error + state, not only `success` |
| `user_id` + `action` + JSON `payload` for v1 | Add `package` + `proto3` so both generators agree |
| Unary calls | Deadlines on every Nest call; map engine `MoveError.Code` to `error_code` |

**Pitfalls**

- Sharing the `.proto` is the contract. If Nest and Go copy-paste diverging files, the wire breaks at runtime.
- JSON-in-`payload` is a deliberate shortcut: fast to ship, weaker types. Fine until actions stabilize.
- gRPC status codes (`INVALID_ARGUMENT`, `NOT_FOUND`, …) are for transport; **game** errors stay in the message body so Nest can forward `EDGE_TOUCH_OWN` to the UI.
- Insecure credentials are OK on the Docker internal network; TLS only if this port is ever public.

**Sources:** [gRPC introduction](https://grpc.io/docs/what-is-grpc/introduction/), [Go quick start](https://grpc.io/docs/languages/go/quickstart/), [NestJS gRPC transporter](https://docs.nestjs.com/microservices/grpc). Team sketch: `backend/docs/workflow/grpc.md`.

---

