import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { sendMessage, onMessage } from "../websocket/socket";

type LobbyPlayer = {
	userId: string;
	username: string;
	isReady: boolean;
	isHost: boolean;
}

type Lobby = {
	id: string;
	maxPlayers: number;
	status: "waiting" | "in_game";
	players: LobbyPlayer[];
	createdAt: string;
}

type User = {
	id: number;
	username: string;
}

export default function LobbyWaiting() {
    const navigate = useNavigate();
	const { lobbyId } = useParams();
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [lobby, setLobby] = useState<Lobby | null>(null);

	useEffect(() => {
    	fetch("https://localhost:3000/api/auth/me", {
        credentials: "include",
    	})
        	.then((response) => response.json())
        	.then((data) => {
            	setCurrentUser(data.user);
        	});
	}, []);
	
	useEffect(() => { // TODO: backend should broadcast a lobby update to all players when
		// another player joins or leaves
		const unsubscribe = onMessage((message) => { // listens for answer
        	if (message.event === "GAME_STATE_SNAPSHOT") {
            	const payload = message.payload as {
                	state: string;
            	};

            	const state = JSON.parse(payload.state);
            	if (state.lobby) {
                	setLobby(state.lobby);
            	}
        	}
			if (message.event === "READY_CHECK_BEGUN") {
				navigate("/ready-check");
			}
			if (message.event === "LOBBY_LEFT") {
				navigate("/lobby");
			}
    	});

    	sendMessage({
        	category: "RESYNC", // request current state of the lobby I'm in
    	});
		return unsubscribe;
	}, []);

	if (!lobby) {
		return <div>Loading lobby...</div>
	}
	const players = lobby.players;

	const currentPlayer = players.find(
		(player) => player.userId === String(currentUser?.id)
	);

    const handleStartGame = () => {
		sendMessage({
            category: "LOBBY",
            payload: {
                type: "BEGIN_READY_CHECK",
				lobbyId: lobby.id,
            },
        });
    };

    const handleLeaveLobby = () => {
		sendMessage({
            category: "LOBBY",
            payload: {
                type: "LEAVE_LOBBY",
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[500px] bg-white p-10 rounded-xl shadow-md flex flex-col">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2">
                        GAME LOBBY
                    </h1>

                    <p className="text-slate-500">
                        Players: {players.length} / {lobby.maxPlayers}
                    </p>
					<div className="mt-6 p-4 bg-slate-100 rounded-lg">
						<p className="text-sm text-slate-500 mb-1">
            				Lobby ID
        				</p>
						<p className="text-xl font-bold text-slate-800">
            				{lobbyId}
        				</p>
        				<p className="text-sm text-slate-400 mt-1">
            				Share this ID with other players.
        				</p>
    				</div>

                    <p className="text-slate-400 text-sm mt-2">
                        You can start with any number of players.
                        Empty seats will be filled by bots.
                    </p>
            </div>

                <div className="w-full mb-8">
                    {players.map((player) => (
                        <div
							key={player.userId}
							className="flex items-center justify-between py-4 border-b border-slate-200">
							<span className="">
								{player.username}
							</span>
							<div className="flex items-center gap-4">
								{player.isReady && (
									<span className="text-sm text-green-600">
										Joined ✓
									</span>
								)}
								{player.isHost && (
									<span className="text-sm text-green-400">
										Host ✓
									</span>
								)}
							</div>
						</div>
                    ))}
                </div>

                <div className="mt-auto flex flex-col gap-3">
					{currentPlayer?.isHost && (
                    <button
                        type="button"
                        onClick={handleStartGame}
                        className="w-full px-6 py-3 rounded-lg bg-blue-700 text-white hover:bg-blue-800">
                        Start Game
                    </button>
					)}

                    <button
                        type="button"
                        onClick={handleLeaveLobby}
                        className="w-full px-6 py-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">
                        Leave Lobby
                    </button>
                </div>

            </div>
        </div>
    );
}