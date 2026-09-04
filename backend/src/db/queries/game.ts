import { db } from "../index";
import { games } from "../schema";
import { eq } from "drizzle-orm";

export async function createGame() {
    const [result] = await db
        .insert(games)
        .values({})
        .returning();

    return result;
}

export async function findGameById(id: number) {
    const [result] = await db
        .select()
        .from(games)
        .where(eq(games.id, id));

    return result || null;
}

export async function updateGameStatus(id: number, status: string) {
    const [result] = await db
        .update(games)
        .set({ status })
        .where(eq(games.id, id))
        .returning();

    return result || null;
}

//finishGame
//findGamesByUserId
//findActiveGames
//findFinishedGames