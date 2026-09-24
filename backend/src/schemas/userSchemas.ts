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
