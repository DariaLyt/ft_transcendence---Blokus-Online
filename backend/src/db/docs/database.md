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

### statistics

Stores player statistics used for profiles and the leaderboard.

| Column | Description |
| --- | --- |
| id | Unique statistics ID |
| user_id | References users.id |
| games_played | Number of games played |
| games_won | Number of games won |
| games_lost | Number of games lost |
| total_score | Player's accumulated score |

### tournaments

Stores tournaments.

| Column | Description |
| --- | --- |
| id | Unique tournament ID |
| status | Current status of the tournament |
| created_at | Time the tournament was created |
| finished_at | Time the tournament finished |

### tournament_players

Connects users to tournaments.

| Column | Description |
| --- | --- |
| id | Unique entry ID |
| tournament_id | References tournaments.id |
| user_id | References users.id |

### tournament_matches

Connects games to tournaments.

| Column | Description |
| --- | --- |
| id | Unique tournament match ID |
| tournament_id | References tournaments.id |
| game_id | References games.id |
| round | Tournament round |


## Relationships

BASICS:
- A user can participate in many games.
- A game can have multiple players.
- game_players connects users to games.
- A user can have friendships with other users.
- A user has player statistics.

TOURNAMENT:
- A user can participate in many tournaments.
- A tournament can have multiple players.
- tournament_players connects users to tournaments.
- A tournament can contain multiple matches.
- Each tournament match references a game.

