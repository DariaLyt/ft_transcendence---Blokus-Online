import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserByUsername, findUserByEmailOrUsername } from '../db/userQueries';
import { getJwtSecret } from '../config/env';

export async function register(req: Request, res: Response) {
	const validated = req.body;

	const [existingEmail, existingUsername] = await Promise.all([
		findUserByEmail(validated.email),
		findUserByUsername(validated.username)
	]);

	if (existingEmail) {
		return res.status(400).json({ error: 'Email already in use' });
	}

	if (existingUsername) {
		return res.status(400).json({ error: 'Username already in use' });
	}

	const passwordHash = await bcrypt.hash(validated.password, 10);
	const newUser = await createUser(validated.username, validated.email, passwordHash);

	return res.status(201).json({ message: 'User registered successfully', user: newUser });
}

export async function login(req: Request, res: Response) {
	const validated = req.body;

	const user = await findUserByEmailOrUsername(validated.identifier);
	if (!user) {
		return res.status(401).json({ error: 'Invalid credentials' });
	}

	const validPassword = await bcrypt.compare(validated.password, user.password_hash);
	if (!validPassword) {
		return res.status(401).json({ error: 'Invalid credentials' });
	}

	const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '24h' });

	res.cookie('auth_token', token, {
	httpOnly: true,
	secure: true,
	sameSite: 'lax',
	maxAge: 24 * 60 * 60 * 1000, // 24 hours
	});

	return res.status(200).json({
		message: 'Logged in successfully',
		user: { id: user.id, username: user.username, email: user.email },
	});
}

export function logout(req: Request, res: Response) {
  	res.clearCookie('auth_token');
  	return res.status(200).json({ message: 'Logged out successfully' });
}