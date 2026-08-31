import { z } from 'zod';
import {
    createLobbySchema,
    joinLobbySchema,
    toggleReadySchema,
    leaveLobbySchema,
} from './gatewayTypes.js';

export interface Player {
	userId: number;
	username: string;
	isReady: boolean;
	isHost: boolean;
	connectionState?: 'CONNECTED' | 'DISCONNECTED';
}

export interface Lobby {
	id: string;
	maxPlayers: number;
	status: 'WAITING' | 'IN_GAME'
	players: Player[];
	createdAt: Date;
}

export type InboundSocketMessage =
    | z.infer<typeof createLobbySchema>
    | z.infer<typeof joinLobbySchema>
    | z.infer<typeof toggleReadySchema>
    | z.infer<typeof leaveLobbySchema>;
