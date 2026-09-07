
// findGamePlayers
// findPlayerInGame
// updatePlayerScore
// removeGamePlayer

import { db } from "../index";
import { games } from "../schema";
import { gamePlayers } from "../schema";
import { eq, ne } from "drizzle-orm";

export async function addGamePlayer(gameId: number, userId: number, color: string){
    const [result] = await db
        .insert(gamePlayers)
        .values({
            gameId,
            userId,
            color
        })
        .returning();
    return result;
}