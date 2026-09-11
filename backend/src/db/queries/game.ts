import { db } from "../conn.js";
import { games } from "../schema";
import { gamePlayers } from "../schema";
import { eq, ne } from "drizzle-orm";

export async function createGame(){
    const [result] = await db
        .insert(games)
        .values({})
        .returning();
    return result;
}

export async function updateGameStatus(id: number, status: string){
    const [result] = await db
        .update(games)
        .set({ status })
        .where(eq(games.id, id))
        .returning();
    return result || null;
}

export async function finishGame(id: number){
    const [result] = await db
        .update(games)
        .set({
            status: "finished",
            finishedAt: new Date()
        })
        .where(eq(games.id, id))
        .returning();
    return result || null;
}

export async function findGameById(id: number){
    const [result] = await db
        .select()
        .from(games)
        .where(eq(games.id, id));
    return result || null;
}

export async function findFinishedGames(){
    const result = await db
        .select(games)
        .from(games)
        .where(eq(games.status, "finished"))
    return result;
}

export async function findActiveGames(){
    const result = await db
        .select(games)
        .from(games)
        .where(ne(games.status, "finished"))
    return result;
}

export async function findGamesByUserId(userId: number){
    const result = await db
        .select({ games })
        .from(games)
        .innerJoin(
            gamePlayers,
            eq(games.id, gamePlayers.gameId)
        )
        .where(eq(gamePlayers.userId, userId));

    return result;
}
