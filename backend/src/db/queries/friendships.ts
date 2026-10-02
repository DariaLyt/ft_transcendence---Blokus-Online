import { db } from "../conn.js";
import { friendships, users } from "../schema.js";
import { eq, and, or, ne } from "drizzle-orm";

export async function createFriendRequest(userId: number, friendId: number){
    // if (userId === friendId)
    //     return null;
    // const [existing] = await db
    //     .select()
    //     .from(friendships)
    //     .where(
    //         or(
    //             and(
    //                 eq(friendships.userId, userId),
    //                 eq(friendships.friendId, friendId)
    //             ),
    //             and(
    //                 eq(friendships.userId, friendId),
    //                 eq(friendships.friendId, userId)
    //             )
    //         )
    //     );
    // if (existing)
    //     return null;
    const [result] = await db
        .insert(friendships)
        .values({
            userId,
            friendId,
        })
        .returning();
    return result;
}

export async function removeFriendship(userId: number, friendId: number){
    const [result] = await db
        .delete(friendships)
        .where(
            or(
                and(
                    eq(friendships.userId, userId),
                    eq(friendships.friendId, friendId)
                ),
                and(
                    eq(friendships.userId, friendId),
                    eq(friendships.friendId, userId)
                )
            )
        )
        .returning();
    return result || null;
}

export async function findUserFriends(userId: number){
    const result = await db
        .select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
        })
        .from(friendships)
        .innerJoin(
            users,
            or(
                eq(users.id, friendships.userId),
                eq(users.id, friendships.friendId)
            )
        )
        .where(
            and(
                eq(friendships.status, "accepted"),
                or(
                    eq(friendships.userId, userId),
                    eq(friendships.friendId, userId)
                ),
                ne(users.id, userId)
            )
        );
    return result;
}

// export async function acceptFriendRequest(userId: number, friendId: number){
//     const [result] = await db
//         .update(friendships)
//         .set({ status: "accepted" })
//         .where(
//             and(
//                 eq(friendships.userId, userId),
//                 eq(friendships.friendId, friendId),
//                 eq(friendships.status, "pending")
//             )
//         )
//         .returning();
//     return result || null;
// }

export async function findPendingFriendRequests(userId: number){
    const result = await db
        .select({
            id: friendships.id,
            userId: friendships.userId,
            username: users.username,
            avatarUrl: users.avatarUrl,
            createdAt: friendships.createdAt,
        })
        .from(friendships)
        .innerJoin(users, eq(users.id, friendships.userId))
        .where(
            and(
                eq(friendships.friendId, userId),
                eq(friendships.status, "pending")
            )
        );
    return result;
}

export async function checkExistingFriendship(userId: number, friendId: number) {
    const [existing] = await db
        .select({ status: friendships.status })
        .from(friendships)
        .where(
            or(
                and(
                    eq(friendships.userId, userId),
                    eq(friendships.friendId, friendId)
                ),
                and(
                    eq(friendships.userId, friendId),
                    eq(friendships.friendId, userId)
                )
            )
        );
    return existing?.status || null;
}

export async function updateFriendRequest(requestId: number, status: string) {
    const [result] = await db
        .update(friendships)
        .set({ status })
        .where(eq(friendships.id, requestId))
        .returning();
    return result || null;
}

export async function respondToFriendRequest(
    requestId: number,
    userId: number,
    status: 'accepted' | 'declined',
) {
    const [request] = await db
        .select()
        .from(friendships)
        .where(eq(friendships.id, requestId))
        .limit(1);

    if (!request || request.status !== 'pending') {
        return { ok: false as const, reason: 'NOT_FOUND' as const };
    }
    if (request.friendId !== userId) {
        return { ok: false as const, reason: 'FORBIDDEN' as const };
    }

    if (status === 'declined') {
        await db.delete(friendships).where(eq(friendships.id, requestId));
        return { ok: true as const, request };
    }

    const [updated] = await db
        .update(friendships)
        .set({ status: 'accepted' })
        .where(eq(friendships.id, requestId))
        .returning();

    return { ok: true as const, request: updated ?? request };
}

