import { pool } from './index';

export async function findUserByEmail(email: string) {
  	const result = await pool.query(
    	'SELECT * FROM users WHERE email = $1',
    	[email]
  	);
  	return result.rows[0] || null;
}

export async function findUserByUsername(username: string) {
  	const result = await pool.query(
    	'SELECT * FROM users WHERE username = $1',
    	[username]
  	);
  	return result.rows[0] || null;
}

export async function findUserByEmailOrUsername(identifier: string) {
  	const result = await pool.query(
    	'SELECT * FROM users WHERE username = $1 OR email = $1',
    	[identifier]
  	);
  	return result.rows[0] || null;
}

export async function createUser(username: string, email: string, passwordHash: string) {
	const result = await pool.query(
		`INSERT INTO users (username, email, password_hash) 
		 VALUES ($1, $2, $3)
		 RETURNING id, username, email, created_at`,
		[username, email, passwordHash]
	);
	return result.rows[0];
}
