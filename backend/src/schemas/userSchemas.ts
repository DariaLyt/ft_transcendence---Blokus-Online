import { z } from 'zod';

export const changePasswordSchema = z.object({
	currentPassword: z
		.string()
		.min(1, 'Current password is required'),
	newPassword: z
		.string()
		.min(8, 'New password must be at least 8 characters')
		.max(100, 'Password must be at most 100 characters'),
});

export const updateProfileSchema = z.object({
	username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            'Username can only contain letters, numbers, underscores, and dashes'
        ),
    email: z.string().email('Invalid email address'),
});