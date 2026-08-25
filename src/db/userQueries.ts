import { pool } from './conn.js';
import type { User } from '../types/userTypes.js'

export async function findUserById(id: number): Promise<Omit<User, 'password_hash'> | null> {
	const result = await pool.query(
		'SELECT id, username, email, created_at FROM users WHERE id = $1',
		[id]
	);
	return result.rows[0] || null;
}

export async function findUserByEmail(email: string): Promise<{ id: number } | null> {
  	const result = await pool.query(
    	'SELECT id FROM users WHERE email = $1',
    	[email]
  	);
  	return result.rows[0] || null;
}

export async function findUserByUsername(username: string): Promise<{ id: number } | null> {
  	const result = await pool.query(
    	'SELECT id FROM users WHERE username = $1',
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

export async function createUser(username: string, email: string, passwordHash: string): Promise<Omit<User, 'password_hash'>> {
	const result = await pool.query(
		`INSERT INTO users (username, email, password_hash) 
		 VALUES ($1, $2, $3)
		 RETURNING id, username, email, created_at`,
		[username, email, passwordHash]
	);
	return result.rows[0];
}

export async function getUserPasswordHash(id: number): Promise<string | null> {
	const result = await pool.query(
		'SELECT password_hash FROM users WHERE id = $1',
		[id]
	);
	return result.rows[0]?.password_hash || null;
}

export async function updateUserPassword(newPasswordHash: string, id: number): Promise<boolean> {
	const result = await pool.query(
		'UPDATE users SET password_hash = $1 WHERE id = $2',
		[newPasswordHash, id]
	);
	return (result.rowCount ?? 0) > 0;
}
