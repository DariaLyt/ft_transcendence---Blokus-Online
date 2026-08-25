import { z } from 'zod';

export const createLobbySchema = z.object({
	type: z.literal('CREATE_LOBBY'),
	maxPlayers: z.number().int().min(2).max(4).default(4),
});

export const joinLobbySchema = z.object({
	type: z.literal('JOIN_LOBBY'),
	lobbyId: z.uuid(),
});

export const toggleReadySchema =  z.object({
	type: z.literal('TOGGLE_READY'),
	lobbyId: z.uuid(),
});

export const leaveLobbySchema = z.object({
	type: z.literal('LEAVE_LOBBY'),
	lobbyId: z.uuid(),
});
