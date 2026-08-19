import { z } from 'zod';

export const registerSchema = z.object({
	username: z.string().min(3).max(30),
	email: z.email(),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	email: z.email(),
	password: z.string(),
});
