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

export const GameActionSchema = z.object({
	category: z.literal('GAME'),
	action: z.enum(['MAKE_MOVE', 'PASS_TURN']), //temp
	payload: z.record(z.string(), z.any()), //temp
});

// const GameActionSchema = z.discriminatedUnion('action', [
//   z.object({
//     category: z.literal('GAME'),
//     action: z.literal('MAKE_MOVE'),
//     payload: z.object({
//       from: z.string(),
//       to: z.string(),
//     }),
//   }),

//   z.object({
//     category: z.literal('GAME'),
//     action: z.literal('PASS_TURN'),
//     payload: z.object({}),
//   }),
// ]);

export const ResyncActionSchema = z.object({
  	category: z.literal('RESYNC'),
});

export const LobbyFrameSchema = z.object({
	category: z.literal('LOBBY'),
	payload: z.discriminatedUnion('type', [
		createLobbySchema,
		joinLobbySchema,
		toggleReadySchema,
		leaveLobbySchema,
	]),
});

export const IncomingFrameSchema = z.discriminatedUnion('category', [
	LobbyFrameSchema,
	GameActionSchema,
	ResyncActionSchema,
]);

export type IncomingFrame = z.infer<typeof IncomingFrameSchema>;

export interface GameModules {
	handleLobbyAction: (userId: number, action: string, payload: any) => void;
	handleGameAction: (userId: number, action: string, payload: any) => void;
	getGameStateSnapshot: (userId: number) => any;
}

