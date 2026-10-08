# Database

## Overview

The project uses PostgreSQL as the database and Drizzle as the ORM.

The database stores users, completed games, participants, friendships,
and achievements. Active game state is managed by the Go game engine.

Statistics and leaderboard results are calculated from stored game
participation records, rather than stored in separate tables.

## Tables

### users

Stores registered users.

| Column | Description |
| --- | --- |
| id | Unique, automatically generated user ID |
| username | Unique username |
| password_hash | Hashed password |
| email | Unique email |
| avatar_url | Avatar URL; nullable when no custom avatar is provided |
| created_at | Time the user was created |

### games

Stores completed games. Active game status is not stored in this table.

| Column | Description |
| --- | --- |
| id | String game ID supplied by the game engine |
| finished_at | Time the game finished; nullable in the schema |

### game_players

Stores participants and their scores for each completed game.
Human participants reference a user; bots have a null user_id.

| Column | Description |
| --- | --- |
| id | Unique, automatically generated entry ID |
| game_id | References games.id |
| user_id | References users.id; null for bots |
| color | Participant's color |
| score | Participant's final score; nullable in the schema |

### friendships

Stores friendship requests and accepted friendships.

| Column | Description |
| --- | --- |
| id | Unique, automatically generated friendship ID |
| user_id | Request sender; references users.id |
| friend_id | Request recipient; references users.id |
| status | Request status; defaults to pending |
| created_at | Time the request was created |

Accepted requests have the status accepted.
Declined requests are deleted by the current query implementation.

### achievements

Stores the available achievement definitions.

| Column | Description |
| --- | --- |
| id | Unique, automatically generated achievement ID |
| code | Unique achievement code |
| title | Achievement name |
| description | Description of the achievement |
| icon_url | Achievement icon URL |
| created_at | Time the achievement definition was created |

### user_achievements

Records which achievements each user has unlocked.

| Column | Description |
| --- | --- |
| id | Unique, automatically generated entry ID |
| user_id | References users.id |
| achievement_id | References achievements.id |
| unlocked_at | Time the achievement was unlocked |

The combination of user_id and achievement_id is unique,
so a user cannot receive the same achievement twice.

## Relationships

- A user can participate in many games.
- A game has multiple participants, including humans and bots.
- game_players connects human users to games and stores participant scores.
- Each friendship connects two users: the sender and the recipient.
- A user can unlock multiple achievements.
- An achievement can be unlocked by multiple users.
- user_achievements connects users to their unlocked achievements.

