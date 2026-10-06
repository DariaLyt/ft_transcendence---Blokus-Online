*This project has been created as part of the 42 curriculum by dlytvync, nmascaro, cwong, vahdekiv, jkorvenp.*

# Blokus Online

## Description

Blokus Online is a browser-based multiplayer board game built for **ft_transcendence, subject version 19.0**. Its goal is to bring one to four human players together on a shared 20×20 board, with bots filling unused colors. Accounts, friends, profiles, spectators and persistent results surround the game.

Each color has 21 pieces. Its first piece covers its starting corner; later pieces must touch its own pieces diagonally, never along an edge. Colors play blue → yellow → red → green. The Go server validates every placement and controls turns, timers and scoring.

## Instructions

### Prerequisites

- Docker Engine and Docker Compose v2 (`docker compose`).
- GNU Make and OpenSSL on the host for the supplied startup command and backend certificate generation.
- Google Chrome for the subject's browser evaluation.
- Available host ports **8080**, **8443** and **5432** (the database port can be changed through `DB_PORT`).
- Network access for the initial image and dependency downloads.

Node.js 22, Go 1.25, PostgreSQL 16 and nginx 1.27 are supplied by the Dockerfiles/Compose; host Node.js and Go installations are unnecessary.

### Configure and launch

1. From the repository root, copy the example configuration:

   ```bash
   cp .env.example .env
   ```

2. Set `DB_PASSWORD`, a long random `JWT_SECRET`, and `DEMO_PASSWORD` in `.env`. Keep `PORT=3000`, since nginx proxies to that port. Compose supplies `DB_HOST=db`, internal `DB_PORT=5432`, and `GO_ENGINE_URL=game:50051`. `.env` is ignored by Git.
3. Build and start all four services:

   ```bash
   make
   ```

   This creates missing backend certificates, builds the applications and runs `docker compose up --build -d`. PostgreSQL becomes healthy before the backend applies migrations, seeds achievements and seeds demo users/results.
4. Open **https://localhost:8443** and accept the local self-signed certificate warning. Use this HTTPS URL directly: the port-8080 redirect does not preserve port 8443.
5. Register an account, or log in as `demo_blue`, `demo_yellow`, `demo_red` or `demo_green` with `DEMO_PASSWORD`. Use separate browser profiles/private sessions for different players.
6. Create a lobby, share its six-character code, mark guests ready, and let the host begin the ready check. Accept within 15 seconds. Select a piece, use **R** to rotate or **F** to flip, then click the board to place it.

Demo users and two synthetic finished matches are seeded automatically. Changing `DEMO_PASSWORD` does not reset existing demo users' passwords.

| Command | Effect |
|---|---|
| `make up` | Same startup as `make` |
| `make status` | Show container status |
| `make logs` | Print container logs; use `docker compose logs -f` to follow |
| `make down` | Stop/remove containers; retain database volume and avatar files |
| `make certs` | Generate/replace backend localhost certificates |
| `make clean` | Remove containers, database volume and Compose images |
| `make fclean` | Also run system-wide Docker pruning of unused resources |
| `make re` | Run `fclean`, then rebuild/start |

Use `make down` for an ordinary shutdown. `clean`, `fclean` and `re` delete stored database data.

## Team Information

All five members are developers. The project was mainly led by dlytvync. Feature ownership describes contributions, not exclusive ownership.

| Member | Assigned roles | Responsibilities |
|---|---|---|
| dlytvync — Daria Lytvynchuk | Product Owner, Project Manager, Developer | Overall project direction and coordination; gameplay scope; Go rules, lobby, bots and timers; game/UI integration and session fixes |
| nmascaro — Núria Mascaró | Frontend Lead, Developer | React interface and navigation; authentication/profile forms, avatars, frontend validation and legal pages |
| cwong — Cheow Yuen Wong | Technical Lead, Backend Lead, Developer | Backend architecture and service integration; Express authentication/API, validation, WebSocket gateway/presence, gRPC client, ORM integration and achievements |
| vahdekiv — Viljam Ahdekivi | Deployment Lead, Developer | Container setup, Go service deployment, nginx/HTTPS entry point and spectator integration |
| jkorvenp — Jenni Korvenpää | Database Lead, Developer | Database schema, migrations and queries; leaderboard, match history, demo data and rules modal |

## Project Management

Git branches and GitHub pull requests were used to combine work across the frontend, backend, database and Go engine. The history shows feature branches, merges and follow-up integration fixes. Work was distributed by components as described above.

**Team confirmation needed:** document the actual planning/task-tracking tools, meeting routine and communication channel. These details are not recorded in the available repository documentation.

## Technical Stack

| Layer | Technology | Reason for the choice in this architecture |
|---|---|---|
| Frontend | TypeScript, React 19, React Router 7, Vite 8 | Typed components, shared session state and client-side routing; Vite builds static assets |
| Styling | Tailwind CSS 4 | Utility classes for a consistent responsive interface |
| Backend | Node.js 22, TypeScript, Express 5 | HTTP middleware/routes with a shared HTTPS server for WebSockets |
| Live transport | `ws`, gRPC and Protocol Buffers | Browser live connection plus a typed service contract between Node and Go |
| Engine | Go 1.25 | Separate authoritative rules service with mutex-protected state and scheduled turns |
| Database | PostgreSQL 16 | Relational data, foreign keys, unique constraints and transactional result writes |
| ORM | Drizzle | Typed schema/query definitions and versioned SQL migrations |
| Authentication | bcrypt, JWT, cookie-parser | Salted password hashes and signed authentication in a secure httpOnly cookie |
| Validation/uploads | Zod, Multer | Server-side payload checks and bounded avatar uploads |
| Deployment | Docker Compose, nginx | One-command service startup, static hosting and same-origin HTTPS/WSS proxying |

```text
Browser ── HTTPS/WSS ── nginx ── HTTPS/WSS ── Express
                                              ├── Drizzle ── PostgreSQL
                                              └── gRPC ── Go engine
```

The browser communicates with nginx on port 8443. nginx forwards `/api/`, `/ws` and `/uploads/` to the backend. gRPC is unencrypted on the internal Compose network. Live boards/lobbies are held in Go memory; PostgreSQL stores accounts, social data, achievements and finished results.

## Database Schema

The authoritative definitions are in [backend/src/db/schema.ts](backend/src/db/schema.ts); migrations are in `backend/drizzle/`.

| Table | Key fields and types | Relations |
|---|---|---|
| `users` | `id serial` PK; unique `username varchar(30)`, `email varchar(254)`; `password_hash varchar(255)`; nullable `avatar_url varchar(2048)`; `created_at timestamp` | Parent of friendships, participation and achievement records |
| `games` | `id varchar(255)` PK (lobby code); `finished_at timestamp` | One finished game has multiple participation rows |
| `game_players` | `id serial` PK; `game_id varchar(255)`; nullable `user_id integer`; `color varchar(20)`; `score integer` | FKs to games/users; null user identifies a bot |
| `friendships` | `id serial` PK; `user_id integer`; `friend_id integer`; `status varchar(20)`; `created_at timestamp` | Both user columns reference users; pending/accepted requests |
| `achievements` | `id serial` PK; unique `code varchar(50)`; `title varchar(100)`; `description text`; `icon_url varchar(255)`; `created_at timestamp` | Achievement definitions |
| `user_achievements` | `id serial` PK; `user_id integer`; `achievement_id integer`; `unlocked_at timestamp` | FKs to users/achievements; unique user/achievement pair |

`users` and `games` have a many-to-many relationship through `game_players`; users and achievements through `user_achievements`. Friendship rows connect two users. Live moves are not stored as a replay log.

## Features List

| Feature | Functionality | Contributors evidenced by Git |
|---|---|---|
| Authentication | Register; email/username login; logout; bcrypt passwords; 24-hour JWT cookie | cwong, nmascaro |
| Profiles | Edit username/email/password; default/custom avatar; public profile preview | nmascaro, cwong, dlytvync |
| Friends/presence | Search, request, accept/decline, remove and online status | cwong, jkorvenp, dlytvync, nmascaro |
| Lobby/ready check | Code-based joining, capacity up to four, host controls and 15-second acceptance | dlytvync, nmascaro, cwong |
| Blokus gameplay | 20×20 board, 21 pieces per color, rotation/flip, server validation, turns/scores | dlytvync, nmascaro, cwong |
| Bots/timers | Fill empty seats; heuristic moves after two seconds; random legal move on human timeout | dlytvync |
| Remote sessions | Shared snapshots, resync, reconnect window, one active socket per account | dlytvync, cwong, vahdekiv |
| Spectators | Logged-in users watch a game by lobby/game ID without occupying a seat | vahdekiv; shared UI/engine integration |
| Statistics | Paginated leaderboard by cumulative score; match dates, results and opponents | jkorvenp, dlytvync |
| Achievements | First match/win, first friend, avatar upload and two completed matches; profile/toast display | cwong; integration by dlytvync |
| Legal/rules pages | Privacy Policy, Terms of Service and game rules | nmascaro, jkorvenp |
| Deployment/demo data | Four containers, HTTPS proxy, migrations and demo accounts/results | vahdekiv, cwong, jkorvenp |

## Modules

The project's selected modules total **15 points: 6 major × 2 + 3 minor × 1**. The subject requires 14. These are claims to demonstrate during evaluation, not a guarantee of validation.

| Selected module | Type / points | Purpose, implementation and contributors |
|---|---|---|
| Frameworks for frontend and backend | Major / 2 | React UI and Express API provide structured application layers; nmascaro, cwong |
| Standard user management and authentication | Major / 2 | Profiles, avatars, friends and presence support player identity; cwong, nmascaro, jkorvenp, dlytvync |
| Complete web-based game | Major / 2 | Blokus engine validates moves and computes outcomes; dlytvync, nmascaro, cwong |
| Remote players | Major / 2 | WSS gateway, gRPC engine and snapshots allow separate browsers/computers to share a game; dlytvync, cwong, vahdekiv |
| Multiplayer game, more than two players | Major / 2 | Up to four humans with independent colors/turns; dlytvync, nmascaro, cwong |
| AI opponent | Major / 2 | Non-perfect heuristic bot evaluates legal moves and fills missing seats; dlytvync |
| ORM | Minor / 1 | Drizzle schema, queries and migrations manage relational persistence; cwong, jkorvenp |
| Game statistics and match history | Minor / 1 | Stored scores, leaderboard, result/opponent history and achievements; jkorvenp, cwong, dlytvync |
| Spectator mode | Minor / 1 | Read-only subscription with live snapshots by game ID; vahdekiv |

Gaming/statistics/spectator claims depend on the working game. Frameworks are counted once as the combined major module. No additional points are counted for chat, tournaments, OAuth, 2FA, gamification or microservices.

## Individual Contributions

- **dlytvync:** built the Go game and lobby flow, bot heuristics, two-second bot delay, minute-long turns and bot takeover; connected game/lobby pages and corrected rotation/placement alignment, stale game routing and multi-tab/reconnect behavior. Integration challenges were addressed through shared snapshot and session fixes.
- **nmascaro:** built the React pages/components and navigation; connected login/registration, protected routes, profile editing and avatars; implemented frontend validation and Privacy Policy/Terms pages. Follow-up fixes addressed authentication redirects, cookie-dependent calls and avatar rendering.
- **cwong:** built authentication, profile/friend endpoints, middleware, socket connection management and the gRPC gateway; converted SQL queries to Drizzle and implemented persistent achievement unlocks/toasts. Follow-up fixes addressed protocol payloads, build errors and achievement delivery.
- **vahdekiv:** added container builds/Compose integration and Go server deployment, served the frontend through nginx over HTTPS, and implemented spectator state lookup/subscriptions across React, Node, protobuf and Go. The spectator work required coordinated changes to the service contract and gateway.
- **jkorvenp:** designed database tables and relations, developed persistence/statistics queries, leaderboard/history UI and demo data, and added the rules modal. Result storage was adapted for string game IDs, bot participants and finished-game-only persistence.

These summaries reflect commits; confirm shared work and personal challenges with the team before presenting them.

## Resources

- [Subject](en.subject.pdf) — mandatory requirements, module definitions and README checklist.
- [Blokus rules](https://www.ultraboardgames.com/blokus/game-rules.php) — reference rules.
- [React](https://react.dev/), [React Router](https://reactrouter.com/), [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/docs) — UI/build/styling references.
- [Express](https://expressjs.com/), [Zod](https://zod.dev/), [Drizzle](https://orm.drizzle.team/docs/overview), [PostgreSQL](https://www.postgresql.org/docs/16/) — API, validation and database references.
- [Go](https://go.dev/doc/), [gRPC](https://grpc.io/docs/), [Docker Compose](https://docs.docker.com/compose/) — engine, service contract and deployment references.
- [Users API](backend/docs/UsersAPI.md), [WebSocket API](backend/docs/WebSocketAPI.md), [database notes](backend/src/db/docs/database.md) — supporting repository documentation; source files remain authoritative.

**AI use:** AI tools assisted with refactoring and debugging during project development. AI was also used to create this README.
