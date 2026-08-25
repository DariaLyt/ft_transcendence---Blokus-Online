import { randomUUID } from 'crypto';
import type { Lobby, Player } from '../types/lobbyTypes.js';

const lobbies = new Map<string, Lobby>();

const userLobbyMap = new Map<number, string>();

export function createLobby(hostUserId: number, username: string, maxPlayers: number): Lobby {
	leaveCurrentLobby(hostUserId);

	const lobbyId = randomUUID();

	const hostPlayer: Player = {
		userId: hostUserId,
		username,
		isReady: true,
		isHost: true,
	};

	const newLobby: Lobby = {
		id: lobbyId,
		maxPlayers,
		status: 'WAITING',
		players: [hostPlayer],
		createdAt: new Date(),
	};

	lobbies.set(lobbyId, newLobby);
	userLobbyMap.set(hostUserId, lobbyId);
	return newLobby;
}

export function joinLobby(userId: number, username: string, lobbyId: string): { lobby?: Lobby; error?: string } {
	const lobby = lobbies.get(lobbyId);

	if (!lobby) return { error: 'Lobby not found' };
	if (lobby.status !== 'WAITING') return { error: 'Game already in progress' };
	if (lobby.players.length >= lobby.maxPlayers) return { error: 'Lobby is full' };
	if (lobby.players.some((p) => p.userId === userId)) return { error: 'Already in this lobby' };

	leaveCurrentLobby(userId);

	const newPlayer: Player = {
		userId,
		username,
		isReady: false,
		isHost: false,
	};

	lobby.players.push(newPlayer);
	userLobbyMap.set(userId, lobbyId);
	return { lobby };
}

export function togglePlayerReady(userId: number, lobbyId: string): Lobby | null {
	const lobby = lobbies.get(lobbyId);
	if (!lobby) return null;

	const player = lobby.players.find((p) => p.userId === userId);
	if (player && !player.isHost) {
		player.isReady = !player.isReady;
	}

	return lobby;
}

export function leaveCurrentLobby(userId: number): { lobbyId?: string; updatedLobby?: Lobby } {
	const lobbyId = userLobbyMap.get(userId);
	if (!lobbyId) return {};

	const lobby = lobbies.get(lobbyId);
	userLobbyMap.delete(userId);

	if (!lobby) return {};

	lobby.players = lobby.players.filter((p) => p.userId !== userId);

	if (lobby.players.length === 0) {
		lobbies.delete(lobbyId);
		return { lobbyId };
	}

	const hasHost = lobby.players.some((p) => p.isHost);
	if (!hasHost && lobby.players.length > 0) {
		const newHost = lobby.players[0];

		if (newHost) {
			newHost.isHost = true;
			newHost.isReady = true;
		}
	}

	return { lobbyId, updatedLobby: lobby };
}

export function getLobbyById(lobbyId: string): Lobby | undefined {
  	return lobbies.get(lobbyId);
}

export function getUserLobby(userId: number): Lobby | undefined {
	const lobbyId = userLobbyMap.get(userId);
	return lobbyId ? lobbies.get(lobbyId) : undefined;
}

export function getAllWaitingLobbies(): Lobby[] {
  	return Array.from(lobbies.values()).filter((l) => l.status === 'WAITING');
}