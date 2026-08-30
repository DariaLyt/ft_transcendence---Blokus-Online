import {
  pgTable, //define table
  serial, // autoIncrease columIndex
  varchar, //text
  timestamp, //date+time
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

