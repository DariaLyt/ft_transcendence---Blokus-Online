import { db } from "../index";
import { games } from "../schema";
import { eq } from "drizzle-orm";

export async function createGame() {
  const result = await db
    .insert(games)
    .values({})
    .returning();
  return result[0];
}

export async function findGameById(id: number) {
  const result = await db
    .select()
    .from(games)
    .where(eq(games.id, id));
  return result[0] || null;
}
//updateGameStatus
//finishGame
//findGamesByUserId
//findActiveGames
//findFinishedGames