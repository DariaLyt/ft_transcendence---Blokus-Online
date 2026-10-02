import { z } from 'zod';

export const friendRequestSchema = z
	.object({
		friendId: z
			.number()
			.int('friendId must be an integer')
			.positive('friendId must be a positive user ID')
			.optional(),
		username: z
			.string()
			.trim()
			.min(1, 'Username is required')
			.max(30, 'Username must be at most 30 characters')
			.optional(),
	})
	.refine((data) => data.friendId != null || Boolean(data.username), {
		message: 'username or friendId is required',
	});

export const friendResponseSchema = z.object({
	status: z.enum(['accepted', 'declined']),
});