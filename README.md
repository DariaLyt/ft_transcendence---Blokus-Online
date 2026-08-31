# Blokus Online — Notes

## Description

**Blokus Online** is a real-time multiplayer web application that brings the classic Blokus board game to the browser. Up to four players place polyomino pieces on a shared 20×20 board under the official corner-touch rules, with support for remote play, AI opponents, tournaments, and player progression.

- Classic Blokus rules (4 colors, 21 pieces each, corner-adjacency)
- Real-time multiplayer (2–4 players) across separate machines
- Lobby, matchmaking, and reconnection handling
- AI opponent to fill empty seats or play solo
- User accounts, profiles, avatars, friends, online status
- Match history, statistics, and leaderboards
- Tournament brackets
- Spectator mode for live games
- Privacy Policy and Terms of Service

## Goal

Ship a production-ready, containerized web app that meets all mandatory ft_transcendence requirements and earns **at least 14 module points** (target: **16** for evaluation buffer).

## Modules

Major = 2 pts · Minor = 1 pt · **Target total: 16 pts**

| # | Category | Module | Type | Pts | Status |
|---|----------|--------|------|-----|--------|
| 1 | Gaming | Complete web-based game (Blokus) | Major | 2 | Planned |
| 2 | Gaming | Remote players | Major | 2 | Planned |
| 3 | Gaming | Multiplayer (3+ players) | Major | 2 | Planned |
| 4 | Web | Frontend + backend frameworks | Major | 2 | Planned |
| 5 | User Management | Standard user management | Major | 2 | Planned |
| 6 | Artificial Intelligence | AI Opponent | Major | 2 | Planned |
| 7 | Web | ORM for the database | Minor | 1 | Planned |
| 8 | User Management | Game statistics & match history | Minor | 1 | Planned |
| 9 | Gaming | Tournament system | Minor | 1 | Planned |
| 10 | Gaming | Spectator mode | Minor | 1 | Planned |

**Total: 16 points** (14 required to pass; +2 buffer if one module is rejected).

## Module justification

- **Blokus as core game** — clear win/loss rules, turn-based sync, strong fit for a web game module.
- **Remote + Multiplayer 3+** — Blokus is designed for four players; these modules align with the product instead of being bolted on.
- **Frameworks + ORM** — NestJS, React, and Prisma cover architecture quality with low extra risk.
- **User management + stats** — accounts, friends, and history make matches persistent and social.
- **AI Opponent** — enables play without four humans; must be explainable at evaluation.
- **Tournament + Spectator** — competition and watching live boards without needing a second game.

## Milestones

| Date | Milestone | Definition of done |
|------|-----------|-------------------|
| **17.08** | Kickoff lock | PDF studied by all; roles, stack, and module list agreed; repo + board created |
| **01.10** | Feature freeze | All claimed modules working end-to-end; only small fixes after this |
| **14.10** | Evaluation | Dry-run done; README complete; everyone can explain their parts |

## Roadmap

### Phase 0 — Kickoff (now → 17.08)

**Goal:** Shared understanding and locked decisions.

- [ ] Everyone reads `project.pdf` (mandatory + modules + README rules)
- [ ] Confirm product: classic Blokus (20×20, 4 players, corner-touch)
- [ ] Lock 16-point module list (see Modules)
- [ ] Assign Game / Frontend / Backend / Docker / Database (+ PO / PM / Tech Lead)
- [ ] Lock tech stack
- [ ] Agree weekly meeting slot


### Phase 1 — Foundation (≈ 18.08 → 31.08)

**Goal:** Runnable skeleton; auth and empty board.

| Owner | Work |
|-------|------|
| Tech Lead | Monorepo or `frontend/` + `backend/`; Docker Compose (app + Postgres + reverse proxy); HTTPS local/dev certs |
| Platform | Signup/login API + JWT; password hashing; basic user table via Prisma |
| Game | Piece definitions (21 shapes × 4 colors); empty 20×20 board UI; rotate/flip controls |
| PO/PM | Backlog grooming; Blokus rules checklist for acceptance tests |
| All | Privacy Policy + Terms of Service pages (footer links) |

**Deliverables**

- `docker compose up` starts the stack
- User can register and log in
- Board renders with piece tray (no full validation yet)
- Chrome-only happy path; no console errors on shell pages

**Weekly demo:** login + empty board in Docker.

### Phase 2 — Local Blokus engine (≈ 01.09 → 14.09)

**Goal:** Correct single-session game logic (server-authoritative).

| Owner | Work |
|-------|------|
| Game | Placement validation (first move corner, later corner-touch, no edge-share with own color); scoring; win/pass when no moves |
| Game | Unit tests for legal/illegal placements |
| Platform | Persist game + moves; basic “create local/hotseat or vs AI stub” flow |
| Tech Lead | Shared TypeScript types for `Piece`, `Move`, `GameState` |
| PO | Rule acceptance: play full 4-color game manually |

**Deliverables**

- Complete game vs hotseat or scripted players
- Server rejects illegal moves
- Match ends with correct scores

**Weekly demo:** full offline/hotseat Blokus match.

*Module progress: Web-based game (Major) largely complete.*

### Phase 3 — Real-time multiplayer (≈ 15.09 → 28.09)

**Goal:** Remote 2–4 player games with robust sockets.

| Owner | Work |
|-------|------|
| Game + Tech Lead | Socket.IO rooms; turn broadcast; board sync; latency-friendly UX |
| Platform | Lobby create/join; invite by code or friends list (minimal) |
| Game | Disconnect grace + reconnect resume; forfeit / timeout policy |
| Platform | Concurrent users: multiple active games without race corruption |
| All | Load-smoke: 2 simultaneous matches |

**Deliverables**

- Two browsers / two machines play live
- Four-player match works
- Reconnect mid-game restores state

**Weekly demos:** remote 1v1, then 4-player.

*Module progress: Remote players + Multiplayer 3+.*

### Phase 4 — Accounts, social, stats (≈ 22.09 → 05.10, overlaps Phase 3/5)

**Goal:** Standard user management + statistics.

| Owner | Work |
|-------|------|
| Platform | Profile page; edit display name; avatar upload + default avatar |
| Platform | Friends add/remove; online status |
| Platform | Match history, wins/losses, ranking/level, leaderboard |
| Tech Lead | Secure file storage for avatars; validation FE+BE |
| PO | UX pass on profile and post-game screen |

**Deliverables**

- Friends list and online indicators
- After each game, stats update and history shows opponent/result

*Module progress: Standard user management + Game statistics.*

### Phase 5 — AI, tournaments, spectators (≈ 29.09 → 01.10)

**Goal:** Remaining claimed modules; feature freeze.

| Owner | Work |
|-------|------|
| Game | AI opponent: heuristic / search that wins sometimes, not perfect; explainable design doc in README |
| Platform | Tournament registration, bracket, match progression |
| Game + Platform | Spectator mode: join room read-only; live board updates |
| All | Wire AI into lobby (“fill with bots”); tournament uses real game rooms |

**Deliverables**

- Play vs AI at least at one difficulty that can win occasionally
- Run a small tournament (4 or 8 players) end-to-end
- Spectate an ongoing match from a third client

**01.10 feature freeze:** no new modules after this date.

*Module progress: AI Opponent + Tournament + Spectator → **16 pts claimed**.*

### Phase 6 — Hardening & eval prep (≈ 02.10 → 14.10)

**Goal:** Stability, docs, evaluation readiness.

- [ ] Bug bash: illegal moves, socket edge cases, avatar limits, tournament edge cases
- [ ] Chrome pass: no console warnings/errors on main flows
- [ ] Responsive layout check (desktop + mobile)
- [ ] Finalize README (logins, contributions, schema diagram, how each module works)
- [ ] Resources section: docs used + honest AI usage notes
- [ ] Eval rehearsal: each member demos and explains their modules
- [ ] Practice a small live code change (eval-style)
- [ ] Confirm `.env.example`, Docker one-liner, and HTTPS

**14.10:** Peer evaluation.

### Roadmap overview

```
                Aug          Sep                Oct
                |17     |31 |14    |28|     |01|        |14
Kickoff         ████
Foundation           ████████
Local engine              ████████
Realtime multiplayer           ████████████
Accounts / stats                  ████████████
AI / tournament / spectator            ████████
Feature freeze                              ◆ 01.10
Hardening / README                             ████████
Evaluation                                              ◆ 14.10
Weekly meetings ◆────◆────◆────◆────◆────◆────◆────◆────◆
```
