import { db } from "../conn.js";
import { users, games, gamePlayers } from "../schema.js";
import { eq, count, sum, avg, desc } from "drizzle-orm";

export async function getUserStats(userId: number){
    const [result] = await db
        .select({
            userId: users.id,
            username: users.username,
            gamesPlayed: count(gamePlayers.id),
            totalScore: sum(gamePlayers.score),
            averageScore: avg(gamePlayers.score),
        })
        .from(users)
        .innerJoin(
            gamePlayers,
            eq(users.id, gamePlayers.userId)
        )
        .innerJoin(
            games,
            eq(games.id, gamePlayers.gameId),
        )
        .where(eq(users.id, userId))
        .groupBy(users.id, users.username);

    return result || null;
}


export async function getLeaderboard(){
    const result = await db
        .select({
            userId: users.id,
            username: users.username,
            gamesPlayed: count(gamePlayers.id),
            totalScore: sum(gamePlayers.score),
            averageScore: avg(gamePlayers.score),
        })
        .from(users)
        .innerJoin(
            gamePlayers,
            eq(users.id, gamePlayers.userId)
        )
        .innerJoin(
            games,
            eq(games.id, gamePlayers.gameId),
        )
        .groupBy(users.id, users.username)
        .orderBy(desc(sum(gamePlayers.score)));

    return result;
}
