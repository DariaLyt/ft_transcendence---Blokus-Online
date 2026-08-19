import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../schemas/authSchemas';
import { createUser, findUserByEmailOrUsername } from '../db/userQueries';

function getJwtSecret(): string {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
    	throw new Error('JWT_SECRET is not configured');
  	}

  	return secret;
}

const JWT_SECRET = getJwtSecret();

export async function register(req: Request, res: Response) {
  	try {
    	const validated = registerSchema.parse(req.body);

		const existingUser = await findUserByEmailOrUsername(validated.email, validated.username);
		if (existingUser) {
			return res.status(400).json({ error: 'Username or email already in use.' });
		}

		const passwordHash = await bcrypt.hash(validated.password, 10);
		const newUser = await createUser(validated.username, validated.email, passwordHash);

		return res.status(201).json({ message: 'User registered successfully', user: newUser });
  	} catch (err: any) {
		if (err.name === 'ZodError') {
			return res.status(400).json({ error: err.errors });
		}
    	return res.status(500).json({ error: 'Internal server error' });
  	}
}

export async function login(req: Request, res: Response) {
  	try {
		const validated = loginSchema.parse(req.body);

		const user = await findUserByEmailOrUsername(validated.email, validated.email);
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials.' });
		}

		const validPassword = await bcrypt.compare(validated.password, user.password_hash);
		if (!validPassword) {
			return res.status(401).json({ error: 'Invalid credentials.' });
		}

		const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

		res.cookie('auth_token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
		});

		return res.status(200).json({
			message: 'Logged in successfully',
			user: { id: user.id, username: user.username, email: user.email },
		});
	} catch (err: any) {
		if (err.name === 'ZodError') {
			return res.status(400).json({ error: err.errors });
		}
		return res.status(500).json({ error: 'Internal server error' });
	}
}

export function logout(req: Request, res: Response) {
  	res.clearCookie('auth_token');
  	return res.status(200).json({ message: 'Logged out successfully' });
}