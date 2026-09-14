import { pool } from '../db/conn.js';
import { sendToUsers } from '../sockets/broadcaster.js';

export async function notifyFriendsStatusChange(userId: number, isOnline: boolean): Promise<void> {
	try {
		const query = `
			SELECT CASE 
				WHEN user_id = $1 THEN friend_id 
				ELSE user_id 
			END AS friend_id
			FROM friendships
			WHERE (user_id = $1 OR friend_id = $1) AND status = 'ACCEPTED';
		`;
		const { rows } = await pool.query(query, [userId]);
		const friendIds: number[] = rows.map((r) => r.friend_id);

		if (friendIds.length === 0) return;

		sendToUsers(friendIds, 'FRIEND_STATUS_CHANGE', {
			userId,
			isOnline,
		});
	} catch (err) {
		console.error(`[Presence] Error notifying friends for user ${userId}:`, err);
	}
}