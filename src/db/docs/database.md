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

### moves

Stores moves made during a game.

| Column | Description |
| --- | --- |
| id | Unique move ID |
| game_id | References games.id |
| user_id | References users.id |
| move_number | Order of the move |
| created_at | Time the move was made |

## Relationships

- A user can participate in many games.
- A game can have multiple players.
- A game can have many moves.
- Each move belongs to a game and a user.