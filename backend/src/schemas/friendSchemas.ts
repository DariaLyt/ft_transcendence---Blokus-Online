import { z } from 'zod';

export const friendRequestSchema = z.object({
	friendId: z
		.number()
		.int('friendId must be an integer')
		.positive('friendId must be a positive user ID'),
});

export const friendResponseSchema = z.object({
	requestId: z
		.number()
		.int('friendId must be an integer')
		.positive('friendId must be a positive user ID'),
	status: z
		.enum(['accepted', 'declined']),
});