import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	useEffect(() => {
    	fetch("https://localhost:3000/api/auth/me", {
        credentials: "include",
    	})
        	.then((response) => response.json())
        	.then((data) => {
            	setCurrentUser(data.user);
        	});
	}, []);

    // PLACEHOLDER: frontend structure ready for when the real data arrives
	const lobby: Lobby = {
    	id: "example-lobby-id",
    	maxPlayers: 4,
    	status: "waiting",
    	players: [
        	{
            	userId: "1",
            	username: "You",
            	isReady: true,
            	isHost: true,
        	},
    	],
    	createdAt: "",
	};

	const players = lobby.players;
	const currentPlayer = players.find(
		(player) => player.userId === String(currentUser?.id)
	);

    const handleStartGame = async () => {
        // PLACEHOLDER: exact endpoint will be confirmed later
		/**const response = await fetch(
        	"https://localhost:3000/api/game/lobby/start",
        	{
			    method: "POST",
            	headers: {
                	"Content-Type": "application/json",
            	},
            	credentials: "include",
            	body: JSON.stringify({
                	lobbyId: lobby.id,
            	}),
			}
		);
		const data = await response.json();
		 **/
        navigate("/ready-check");
    };

    const handleLeaveLobby = async () => {
    	// PLACEHOLDER: exact endpoint method will be confirmed later
    	/**const response = await fetch(
        	"https://localhost:3000/api/game/lobby/leave",
        	{
            	method: "POST",
            	headers: {
                	"Content-Type": "application/json",
            	},
            	credentials: "include",
            	body: JSON.stringify({
                	lobbyId: lobby.id,
            	}),
        	}
    	);

    	const data = await response.json(); **/
        navigate("/lobby");
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