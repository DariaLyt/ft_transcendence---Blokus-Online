import { db } from "../index";
import { friendships } from "../schema";
import { eq, ne, and, or } from "drizzle-orm";

export async function createFriendRequest(userId: number, friendId: number){
    if (userId === friendId)
        return null;
    const [existing] = await db
        .select()
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
    if (existing)
        return null;
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
        .select()
        .from(friendships)
        .where(
            and(
                eq(friendships.status, "accepted"),
                or(
                    eq(friendships.userId, userId),
                    eq(friendships.friendId, userId)
                )
            )
        );
    return result;
}
export async function acceptFriendRequest(userId: number, friendId: number){
    const [result] = await db
        .update(friendships)
        .set({ status: "accepted" })
        .where(
            and(
                eq(friendships.userId, userId),
                eq(friendships.friendId, friendId),
                eq(friendships.status, "pending")
            )
        )
        .returning();
    return result || null;
}
export async function findPendingFriendRequests(userId: number){
    const result = await db
        .select()
        .from(friendships)
        .where(
            and(
                eq(friendships.friendId, userId),
                eq(friendships.status, "pending")
            )
        );
    return result;
}
