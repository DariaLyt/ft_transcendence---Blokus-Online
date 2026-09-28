import { z } from 'zod';
import { profanity } from '@2toad/profanity';

const reservedUsernames = ['admin', 'root', 'support', 'system', 'moderator', 'api'];

export const registerSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, 'Username must be at least 3 characters')
		.max(30, 'Username must be at most 30 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes')
		.refine(
			(val) => !reservedUsernames.includes(val.toLowerCase()), 
			{ message: 'This username is reserved and cannot be used' }
    	)
		.refine(
			(val) => !profanity.exists(val),
			{ message: 'This username is not allowed' }
		),
	email: z.email(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(100, 'Password must be at most 100 characters'),
});

export const loginSchema = z.object({
	identifier: z
		.string()
		.min(1, 'Email or username is required'),
	password: z
		.string()
		.min(1, 'Password is required'),
});
