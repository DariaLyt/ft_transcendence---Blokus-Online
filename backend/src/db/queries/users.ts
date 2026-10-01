import { db } from '../conn.js';
import type { User } from '../../types/userTypes.js'
import { eq, or, and, ne, sql } from 'drizzle-orm';
import { users } from '../schema.js';

export async function findUserById(id: number): Promise<Omit<User, 'password_hash'> | null> {
	const result = await db
		.select({
			id: users.id,
			username: users.username,
			email: users.email,
			avatar_url: users.avatarUrl,
			created_at: users.createdAt,
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1);
	return result[0] || null;
}

export async function findUserByEmail(email: string): Promise<{ id: number } | null> {
	const result = await db
		.select({
			id: users.id,
		})
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	return result[0] || null;
}

export async function findUserByUsername(username: string): Promise<{ id: number } | null> {
	const result = await db
		.select({
			id: users.id,
		})
		.from(users)
		.where(eq(users.username, username))
		.limit(1)
	return result[0] || null;
}

function escapeLike(value: string) {
	return value.replace(/[%_\\]/g, '\\$&');
}

export async function findUserIdByUsernameInsensitive(username: string) {
	const trimmed = username.trim();
	if (!trimmed) {
		return null;
	}
	const [result] = await db
		.select({
			id: users.id,
		})
		.from(users)
		.where(sql`${users.username} ILIKE ${escapeLike(trimmed)} ESCAPE '\\'`)
		.limit(1);
	return result || null;
}

export async function searchUsersByUsername(
	query: string,
	excludeUserId: number,
	limit = 8,
) {
	const trimmed = query.trim();
	if (trimmed.length < 1) {
		return [];
	}
	return db
		.select({
			id: users.id,
			username: users.username,
			avatarUrl: users.avatarUrl,
		})
		.from(users)
		.where(
			and(
				sql`${users.username} ILIKE ${`${escapeLike(trimmed)}%`} ESCAPE '\\'`,
				ne(users.id, excludeUserId),
			),
		)
		.limit(limit);
}

export async function findUserByEmailOrUsername(identifier: string) {
	const result = await db
		.select({
			id: users.id,
			username: users.username,
			email: users.email,
			password_hash: users.passwordHash,
			avatar_url: users.avatarUrl,
			created_at: users.createdAt,
		})
		.from(users)
		.where(
			or(
				eq(users.username, identifier),
				eq(users.email, identifier)
			)
		)
		.limit(1)
	return result[0] || null;
}

export async function createUser(username: string, email: string, passwordHash: string): Promise<Omit<User, 'password_hash'>> {
	const result = await db
		.insert(users)
		.values({
			username,
			email,
			passwordHash,
		})
		.returning({
			id: users.id,
			username: users.username,
			email: users.email,
			avatar_url: users.avatarUrl,
			created_at: users.createdAt,
		})
	return result[0]!;
}

export async function getUserPasswordHash(id: number): Promise<string | null> {
	const result = await db
		.select({
			password_hash: users.passwordHash
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1)
	return result[0]?.password_hash || null;
}

export async function updateUserPassword(newPasswordHash: string, id: number): Promise<boolean> {
	const result = await db
		.update(users)
		.set({
			passwordHash: newPasswordHash,
		})
		.where(eq(users.id, id));
	return (result.rowCount ?? 0) > 0;
}

export async function getAvatar(id: number) {
	const result = await db
		.select({
			avatar_url: users.avatarUrl
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1)
	return result[0]?.avatar_url || null;
}

export async function updateNewAvatar(id: number, avatarUrl: string) {
	const [result] = await db
		.update(users)
		.set({
			avatarUrl
		})
		.where(eq(users.id, id))
		.returning();
	return result || null;
}