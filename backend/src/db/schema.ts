import {
  pgTable, //define table
  serial, // autoIncreasing int
  varchar, //text
  timestamp, //date+time
  integer,
} from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: varchar("id", { length: 255 }).primaryKey(),

  //status: varchar("status", { length: 20 })
	//.notNull()
	//.default("waiting"),

//   createdAt: timestamp("created_at")
// 	.defaultNow()
// 	.notNull(),

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

	avatarUrl: varchar("avatar_url", { length: 2048 }),

	createdAt: timestamp("created_at")
	.defaultNow()
	.notNull(),
	
});

export const gamePlayers = pgTable("game_players", {
	id: serial("id").primaryKey(),

	gameId: varchar("game_id", { length: 255 })
		.notNull()
		.references(() => games.id),

	userId: integer("user_id")
		.references(() => users.id),

	color: varchar("color", { length: 20 })
		.notNull(),

	score: integer("score"),
});

export const friendships = pgTable("friendships", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),

	friendId: integer("friend_id")
		.notNull()
		.references(() => users.id),

	status: varchar("status", { length: 20 })
	.notNull()
	.default("pending"),

	createdAt: timestamp("created_at")
	.defaultNow()
	.notNull(),
});
