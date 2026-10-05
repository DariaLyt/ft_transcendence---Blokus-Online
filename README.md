*This project has been created as part of the 42 curriculum by dlytvync, nmascaro, cwong, vahdekiv, jkorvenp.*

# Blokus Online

## Description

**Blokus Online** is a real-time multiplayer Blokus game in the browser. Two to four people play on one 20×20 board. Empty seats are filled by a bot. Each color has 21 pieces and must follow the corner-touch rules.

What the app does today:

- Accounts with email or username login, hashed passwords, and an httpOnly cookie
- Profile page: change username and email, change password, upload an avatar (a default avatar is used otherwise)
- Friends: search by username, send a request, accept or decline, remove a friend, see who is online
- Click a player on the profile, in a game, or on the leaderboard to open a short public profile (no email) with their achievements
- Lobby with a 6-character code. The host starts a ready check. Players who do not accept in 15 seconds are removed from the lobby
- Live game for 1–4 humans. Missing colors are bots
- Rotate (R) and flip (F) the selected piece, then click a square to place it
- 60-second turn timer. If it runs out, a random legal piece is placed
- If a player drops and does not return, that seat becomes a bot
- Finished games are stored and show up in match history and on the leaderboard
- Achievements: Block Party, First Blood, Social Butterfly, Fashionista, Veteran
- Spectate a live game by its lobby id
- Privacy Policy and Terms of Service, linked from the footer

## Modules

Major = 2 points. Minor = 1 point. The subject requires 14.

| Module | Type | Points | In the code |
|---|---|---:|---|
| Web-based game (Blokus) | Major | 2 | Yes. Go engine, 20×20, 21 pieces, corner rules, scores |
| Remote players | Major | 2 | Yes. WebSocket through nginx to the backend, then gRPC to Go. Reconnect loads the current game. A dropped player becomes a bot |
| Multiplayer (3+ players) | Major | 2 | Yes. A lobby holds up to 4 humans |
| Frontend and backend frameworks | Major | 2 | Yes. React and Express |
| Standard user management | Major | 2 | Yes. Profile, avatar, friends, online status |
| AI opponent | Major | 2 | Yes. Heuristic bot for empty seats and for a disconnected player |
| ORM | Minor | 1 | Yes. Drizzle with PostgreSQL |
| Game statistics and match history | Minor | 1 | Yes. Leaderboard, per-user history, achievements |
| Spectator mode | Minor | 1 | Yes. `/spectate`, watch by lobby id, live updates |

Implemented modules add up to **15 points**.

### How the modules are implemented

**Game.** `game/` is a Go service. It owns the board, the lobby, move checks, scoring, and bots. The browser never applies a move by itself. A move goes browser → WebSocket → Express → gRPC (`game:50051`) → Go. Go accepts the move or returns an error code such as `FIRST_CORNER_REQUIRED` or `NO_CORNER_TOUCH`.

Colors play in order: blue, yellow, red, green. Corners are top-left, top-right, bottom-right, bottom-left. The first piece of a color must cover that corner. Later pieces must touch your own color by a corner and must not share an edge with your own color. A color with no legal move is passed automatically. The game ends when every color is stuck.

Scoring at the end: each square still in your hand is −1. Placing every piece is +15.

**Remote play and 3+ players.** The lobby id is the game id. One human means three bots, two humans means two bots, three humans means one bot, four humans means no bots. The browser asks the server for a fresh snapshot several times a second during a live game, so other players and bots show up on the board. A human turn lasts 60 seconds. A bot waits 2 seconds, then plays.

**Frameworks.** The UI is React, built with Vite and styled with Tailwind. The API and WebSocket server are Express. Nginx in the frontend container serves the built site and proxies `/api/`, `/ws`, and `/uploads/` to the backend.

**Users.** Register and login go through Zod checks on the server. Passwords are hashed with bcrypt. The session is a JWT in an httpOnly cookie. Friends and presence use the WebSocket connection list.

**AI.** The bot is not a separate program. It is the same engine playing a seat marked `bot`. It lists every legal placement, scores them, and plays one of the best:

- bigger pieces score higher
- squares nearer the center score higher
- free diagonal spots next to the piece score higher, because those are future corners
- playing near the previous piece scores higher
- a small random amount breaks ties

So the bot can win, and it does not play a perfect game.

**Database.** Drizzle talks to PostgreSQL 16. Finished games are written when a game reaches `finished`. Bots are stored with no user id.

**Statistics.** The leaderboard sums human scores. Match history lists each finished game, the result, and the opponents. Achievements unlock from games, an accepted friend request, and an avatar upload.

**Spectator.** A logged-in user opens `/spectate`, enters the lobby id, and receives read-only board updates about once a second.

## Instructions

Prerequisites: Docker and Docker Compose.

```bash
cp .env.example .env
```

Set `DB_PASSWORD` and `JWT_SECRET` in `.env` to values of your own. The other values in `.env.example` match this project. Docker Compose sets `DB_HOST` to `db` and `GO_ENGINE_URL` to `game:50051` for the backend container, so those two do not need to be changed for a normal run.

```bash
make
```

`make` is `docker compose up --build`. The same command is `make up`.

Open `https://localhost:8443` and accept the self-signed certificate warning. Port 8080 redirects to HTTPS.

Useful Make targets:

| Command | What it does |
|---|---|
| `make down` | Stop the containers |
| `make logs` | Follow container logs |
| `make status` | Show container status |
| `make certs` | Write a localhost certificate into `backend/certs/` |
| `make clean` | Stop containers and delete the database volume and images |

The database volume is kept across `make down`. `make clean` deletes it.

## Technical stack

| Part | Choice |
|---|---|
| UI | React, Vite, Tailwind CSS |
| HTTP and WebSocket | Express, `ws` |
| Validation on the server | Zod |
| Passwords | bcrypt |
| Session | JWT in an httpOnly cookie |
| Database | PostgreSQL 16 |
| ORM | Drizzle |
| Rules, lobby, bots | Go, gRPC on port 50051 |
| Public entry | nginx, ports 8080 and 8443 |

The browser talks only to nginx. Nginx talks to Express. Express talks to Postgres and to the Go game server. The Go server keeps the live board in memory. Postgres stores users, friends, achievements, and finished games.

## Database schema

- `users` — id, unique username, unique email, password hash, avatar URL, created time
- `games` — id is the lobby code, plus the time the game finished
- `game_players` — game, user (empty for a bot), color, score
- `friendships` — requester, recipient, status `pending` or `accepted`
- `achievements` — code, title, description, icon
- `user_achievements` — user, achievement, unlock time. One row per user and achievement

## Resources

- [Blokus rules](https://www.ultraboardgames.com/blokus/game-rules.php) — board, pieces, corner contact, scoring
- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [Drizzle](https://orm.drizzle.team/)
- [gRPC](https://grpc.io/docs/what-is-grpc/introduction/)
- `game/README.md` — the Go engine: files, rules, and the bot

AI tools were used while building the project for boilerplate, refactors, and debugging. 

## Contributors

