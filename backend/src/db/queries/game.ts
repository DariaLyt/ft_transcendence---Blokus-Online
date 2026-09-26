import { db } from "../conn.js";
import { games } from "../schema.js";
import { gamePlayers } from "../schema.js";
import { users } from "../schema.js";
import { eq, ne, and, desc, inArray } from "drizzle-orm";


// export async function createGame(){
//     const [result] = await db
//         .insert(games)
//         .values({})
//         .returning();
//     return result;
// }

// export async function updateGameStatus(id: number, status: string){
//     const [result] = await db
//         .update(games)
//         .set({ status })
//         .where(eq(games.id, id))
//         .returning();
//     return result || null;
// }

// export async function finishGame(id: number){
//     const [result] = await db
//         .update(games)
//         .set({
//             status: "finished",
//             finishedAt: new Date()
//         })
//         .where(eq(games.id, id))
//         .returning();
//     return result || null;
// }

export async function findGameById(id: string){
    const [result] = await db
        .select()
        .from(games)
        .where(eq(games.id, id));
    return result || null;
}
type FinishedParticipant = {
    userId: number | null;
    color: "blue" | "yellow" | "red" | "green";
    score: number;
};

export async function finishGame(
    gameId: string,
    participants: FinishedParticipant[],
) {
    return db.transaction(async tx => {
        const [newGame] = await tx
            .insert(games)
            .values({
                id: gameId,
                finishedAt: new Date(),
            })
            .onConflictDoNothing({
                target: games.id,
            })
            .returning();

        if (!newGame) {
            const [existingGame] = await tx
                .select()
                .from(games)
                .where(eq(games.id, gameId));

            if (!existingGame) {
                throw new Error("Could not retrieve finished game");
            }

            return existingGame;
        }

        await tx.insert(gamePlayers).values(
            participants.map(player => ({
                gameId,
                userId: player.userId,
                color: player.color,
                score: player.score,
            })),
        );

        return newGame;
    });
}
export async function findGamesByUserId(
    //returns:
// {
//     gameId,
//     finishedAt,
//     yourScore,
//     opponents: [{ userId, username, score }]
// }
    userId: number,
    limit = 20,
    offset = 0,
) {
    const matches = await db
        .select({
            gameId: games.id,
            finishedAt: games.finishedAt,
            yourScore: gamePlayers.score,
        })
        .from(games)
        .innerJoin(
            gamePlayers,
            eq(games.id, gamePlayers.gameId),
        )
        .where(eq(gamePlayers.userId, userId))
        .orderBy(desc(games.finishedAt), desc(games.id))
        .limit(limit)
        .offset(offset);

    if (matches.length === 0) return [];

    const participants = await db
        .select({
            gameId: gamePlayers.gameId,
            userId: gamePlayers.userId,
            username: users.username,
            color: gamePlayers.color,
            score: gamePlayers.score,
        })
        .from(gamePlayers)
        .leftJoin(users, eq(gamePlayers.userId, users.id))
        .where(
            inArray(
                gamePlayers.gameId,
                matches.map(match => match.gameId),
            ),
        )
        .orderBy(gamePlayers.gameId, gamePlayers.color);

    return matches.map(match => {
        const players = participants.filter(
            player => player.gameId === match.gameId,
        );

        let result: "win" | "loss" | "draw" | "unknown" = "unknown";

        const complete =
            players.length === 4 &&
            new Set(players.map(player => player.color)).size === 4 &&
            players.every(player => player.score !== null);

        if (complete && match.yourScore !== null) {
            let bestScore = match.yourScore;

            for (const player of players) {
                if (player.score !== null && player.score > bestScore) {
                    bestScore = player.score;
                }
            }

            let winnerCount = 0;

            for (const player of players) {
                if (player.score === bestScore) {
                    winnerCount++;
                }
            }

            if (match.yourScore < bestScore) {
                result = "loss";
            } else if (winnerCount > 1) {
                result = "draw";
            } else {
                result = "win";
            }
        }

        return {
            gameId: match.gameId,
            finishedAt: match.finishedAt,
            yourScore: match.yourScore,
            result: result,
            opponents: players
                .filter(player => player.userId !== userId)
                .map(player => ({
                    userId: player.userId,
                    username:
                        player.username ?? `Bot (${player.color})`,
                    score: player.score,
                })),
        };
    });
}
// export async function findFinishedGames(){
//     const result = await db
//         .select(games)
//         .from(games)
//         .where(eq(games.status, "finished"))
//     return result;
// }

// export async function findActiveGames(){
//     const result = await db
//         .select(games)
//         .from(games)
//         .where(ne(games.status, "finished"))
//     return result;
// }




//older findGamesbyuserid:
// export async function findGamesByUserId(userId: number)
//{
//     const result = await db
//         .select({ games })
//         .from(games)
//         .innerJoin(
//             gamePlayers,
//             eq(games.id, gamePlayers.gameId)
//         )
//         .where(eq(gamePlayers.userId, userId));

//     return result;
// }
