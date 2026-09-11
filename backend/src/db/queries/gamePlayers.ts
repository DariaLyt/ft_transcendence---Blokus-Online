import { db } from "../conn.js";
import { gamePlayers } from "../schema";
import { eq, and } from "drizzle-orm";

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

export async function removeGamePlayer(gameId: number, userId: number){
    const [result] = await db
        .delete(gamePlayers)
        .where(
            and(
                eq(gamePlayers.gameId, gameId),
                eq(gamePlayers.userId, userId)
            )
        )
        .returning();

    return result || null;
}

export async function findGamePlayers(gameId: number){
	const result = await db
		.select()
		.from(gamePlayers)
		.where(eq(gamePlayers.gameId, gameId));
	return result;
}

export async function findPlayerInGame(gameId: number, userId: number){
	const [result] = await db
		.select()
		.from(gamePlayers)
		.where(
			and(
				eq(gamePlayers.gameId, gameId),
				eq(gamePlayers.userId, userId)
			)
		);
	return result || null;
}

export async function updatePlayerScore(gameId: number, userId: number, score: number){
	const [result] = await db
		.update(gamePlayers)
		.set({score})
		.where(
			and(
				eq(gamePlayers.gameId, gameId),
				eq(gamePlayers.userId, userId)
			)
		)
		.returning();
	return result || null;
}
