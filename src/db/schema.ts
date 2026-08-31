import {
  pgTable, //define table
  serial, // autoIncreasing int
  varchar, //text
  timestamp, //date+time
  integer,
} from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),

  status: varchar("status", { length: 20 })
	.notNull()
	.default("waiting"),

  createdAt: timestamp("created_at")
	.defaultNow()
	.notNull(),

  finishedAt: timestamp("finished_at"),
});

export const users = pgTable("users",{
	id: serial ("id").primaryKey(),

	username: varchar ("username", {length: 30})
	.notNull()
	.unique(),

	passwordHash: varchar ("password_hash", {length: 255})
	.notNull(),

	email: varchar ("email", {length: 254})
	.notNull()
	.unique(),

	createdAt: timestamp("created_at")
	.defaultNow()
	.notNull(),
});

export const gamePlayers = pgTable("game_players", {
	id: serial("id").primaryKey(),

	gameId: integer("game_id")
		.notNull()
		.references(() => games.id),

	userId: integer("user_id")
		.notNull()
		.references(() => users.id),

	color: varchar("color", { length: 20 })
		.notNull(),

	score: integer("score"),
});

