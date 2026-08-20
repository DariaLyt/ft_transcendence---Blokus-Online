import { z } from 'zod';

export const registerSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(30, 'Username must be at most 30 characters'),
	email: z.email(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
	identifier: z
		.string()
		.min(1, 'Email or username is required'),
	password: z
		.string()
		.min(1, 'Password is required'),
});
