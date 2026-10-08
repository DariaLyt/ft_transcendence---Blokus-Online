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
        .where(eq(users.id, userId))
        .groupBy(users.id, users.username);

    return result || null;
}


export async function getLeaderboard(limit: number, offset: number){
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
        .groupBy(users.id, users.username)
        .orderBy(desc(sum(gamePlayers.score)), users.id)
        .limit(limit)
        .offset(offset);

    return result;
}
