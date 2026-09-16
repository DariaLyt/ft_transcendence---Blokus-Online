import { pool } from './conn.js';

export async function checkExistingFriendship(userId: number, friendId: number) {
	const query = `
		SELECT status 
		FROM friendships 
		WHERE (user_id = $1 AND friend_id = $2)
		OR (user_id = $2 AND friend_id = $1);
	`;
	const { rows } = await pool.query(query, [userId, friendId]);
	return rows[0]?.status || null;
}

export async function createFriendRequest(userId: number, friendId: number) {
	const query = `
		INSERT INTO friendships (user_id, friend_id, status)
		VALUES($1, $2, 'pending');
	`;
	await pool.query(query, [userId, friendId]);
}

export async function updateFriendRequest(requestId: number, status: string) {
	const query = `
		UPDATE friendships
		SET status = $2
		WHERE id = $1;
	`;
	await pool.query(query, [requestId, status]);
}

export async function fetchFriendsList(userId: number) {
	const query = `
		SELECT 
			u.id,
			u.username,
			u.avatar_url
		FROM friendships f
		JOIN users u
		ON u.id = CASE
			WHEN f.user_id = $1 THEN f.friend_id
			ELSE f.user_id
		END
		WHERE (f.user_id = $1 OR f.friend_id = $1)
		AND f.status = 'accepted';
	`;
	const { rows } = await pool.query(query, [userId]);
	return rows;
}

export async function fetchPendingList(userId: number) {
	const query = `
		SELECT 
			f.id,
			f.user_id,
			u.username,
			u.avatar_url,
			f.created_at
		FROM friendships f
		JOIN users u
		ON u.id = f.user_id
		WHERE f.friend_id = $1
		AND f.status = 'pending';
	`;
	const { rows } = await pool.query(query, [userId]);
	return rows;
}

export async function deleteFriend(userId: number, friendId: number) {
	const query = `
		DELETE FROM friendships
		WHERE (user_id = $1 AND friend_id = $2)
		OR (user_id = $2 AND friend_id = $1);
	`;
	await pool.query(query, [userId, friendId]);
}
