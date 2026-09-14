# Database

## Overview

The project uses PostgreSQL as the database and Drizzle as the ORM.

## Tables

### users

Stores registered users.

| Column | Description |
| --- | --- |
| id | Unique user ID |
| username | Unique username |
| password_hash | Hashed password |
| email | Unique email |
| created_at | Time the user was created |

### games

Stores individual games.

| Column | Description |
| --- | --- |
| id | Unique game ID |
| status | Current status of the game |
| created_at | Time the game was created |
| finished_at | Time the game finished |

### game_players

Connects users to games.

| Column | Description |
| --- | --- |
| id | Unique entry ID |
| game_id | References games.id |
| user_id | References users.id |
| color | Player's color |
| score | Player's score |


### friendships

Stores friendship relationships between users.

| Column | Description |
| --- | --- |
| id | Unique friendship ID |
| user_id | References users.id |
| friend_id | References users.id |
| status | Current friendship/request status |
| created_at | Time the friendship/request was created |


## Relationships

BASICS:
- A user can participate in many games.
- A game can have multiple players.
- game_players connects users to games.
- A user can have friendships with other users.
- A user has player statistics.


## queries/
│
├── users.ts
│   ├── createUser
│   ├── findUserById
│   ├── findUserByUsername
│   ├── findUserByEmail
│   ├── updateUser
│   └── deleteUser
│
├── games.ts
│   ├── createGame
│   ├── findGameById
│   ├── findGamesByUserId
│   ├── findActiveGames
│   ├── findFinishedGames
│   ├── updateGameStatus
│   └── finishGame
│
├── gamePlayers.ts
│   ├── addGamePlayer
│   ├── findGamePlayers
│   ├── findPlayerInGame
│   ├── updatePlayerResult
│   └── removeGamePlayer
│
├── friendships.ts
│   ├── createFriendRequest
│   ├── findUserFriends
│   ├── findPendingFriendRequests
│   ├── acceptFriendRequest
│   └── removeFriendship
│
└── statistics.ts              ← query file, NOT a table
	├── getUserStats
	└── getLeaderboard