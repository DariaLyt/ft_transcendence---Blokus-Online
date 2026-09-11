import { db } from "../conn.js";
import { users, games, gamePlayers } from "../schema";
import { eq, and, count, sum, avg, desc } from "drizzle-orm";

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
            and(
                eq(games.id, gamePlayers.gameId),
                eq(games.status, "finished")
            )
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
            and(
                eq(games.id, gamePlayers.gameId),
                eq(games.status, "finished")
            )
        )
        .groupBy(users.id, users.username)
        .orderBy(desc(sum(gamePlayers.score)));

    return result;
}
    // returns:
    //[
    //     {
    //         userId: 4,
    //         username: "Harry",
    //         gamesPlayed: 8,
    //         totalScore: "210",
    //         averageScore: "26.25"
    //     },
    //     {
    //         userId: 7,
    //         username: "Hermione",
    //         gamesPlayed: 6,
    //         totalScore: "185",
    //         averageScore: "30.83"
    //     }
    // ]