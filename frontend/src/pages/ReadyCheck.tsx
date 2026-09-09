import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { sendMessage, onMessage } from "../websocket/socket";


type Player = {
    userId: string
    username: string;
    accepted: boolean;
	isHost: boolean;
};

type User = {
	id: number;
	username: string;
}

export default function ReadyCheck() {
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [lobbyId, setLobbyId] = useState("");

    useEffect(() => {
    	fetch("https://localhost:3000/api/auth/me", {
        credentials: "include",
    	})
        	.then((response) => response.json())
        	.then((data) => {
            	setCurrentUser(data.user);
        	});
	}, []);

    // PLACEHOLDER: this will come from the backend as readyDeadline
	// If readyDeadline is reached, backend will cancel the ready check. 
	// The lobby returns to "waiting".Players who did not accept are removed.
	// The remaining players stay in the lobby.
    const [countdown, setCountdown] = useState(15);
	/**
	 * Frontend will calculate time remaining = readyDeadline - current time
	 * something like:
	 * const [readyDeadline, set ReadyDeadline] = useState("");
	 * useEffect(() => {
	 *  // calculate the remaining time from readyDeadline
	 * }, [readyDeadline]);
	 */

    const currentPlayer = players.find(
		(player) => player.userId === String(currentUser?.id)
	);
    useEffect(() => { 
		const unsubscribe = onMessage((message) => {
        	if (message.event === "GAME_STATE_SNAPSHOT") { // when the page opens it gets the players in that lobby
            	const payload = message.payload as {
                	state: string;
            	};

            	const state = JSON.parse(payload.state);
            	if (state.lobby) {
                	setPlayers(state.lobby.players);
                    setLobbyId(state.lobby.id);
            	}
        	}
            if (message.event === "READY_CHECK_ACCEPTED") {
                const payload = message.payload as {
                	state: string;
            	};

            	const state = JSON.parse(payload.state);
            	if (state.lobby) {
                	setPlayers(state.lobby.players); //update players' status
            	}
                if (state.game) {
                    navigate("/game"); // if everyone accepted game is ready to start
                }
            }
    	});

        sendMessage({
            category: "RESYNC",
        });

		return unsubscribe;
	}, []);
    
    const handleAccept = () => {
        sendMessage({
            category: "LOBBY",
            payload: {
                type: "ACCEPT_READY_CHECK",
                lobbyId: lobbyId,
            },
        });
    };
  
    // PLACEHOLDER: later send DECLINE_READY_CHECK + lobbyID to backend
    const handleDecline = async () => {
       /** const response = await fetch(
            "https://localhost:3000/api/game/ready-check/decline",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    lobbyId: "PLACEHOLDER_LOBBY_ID",
                }),
            }
        );

        const data = await response.json(); */
    };

    // PLACEHOLDER: the backend will tell us when the ready check succeeds and the game starts
	// When the backend sends GameState with status "active", navigate to the game
	// If a player leaves during the ready check, backend treats this as a decline and stops the ready check.

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[400px] bg-white p-10 rounded-xl shadow-md flex flex-col items-center justify-center">

                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Ready to play?
                </h1>

                <p className="text-slate-500 text-lg mb-8">
                    The game is ready to start. Confirm you want to start playing now.
                </p>

                <div className="w-full mb-8">
                    {players.map((player) => (
                        <div
                            key={player.userId}
                            className="flex justify-between items-center py-3 border-b border-slate-200">
                            <span className="font-medium text-slate-700">
                                {player.username}
                            </span>
         
                            <span
                                className={
                                    player.accepted
                                        ? "text-green-600 font-medium"
                                        : "text-slate-400"
                                }
                            >
                                {player.accepted
                                    ? "Accepted ✓"
                                    : "Waiting..."}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-6">
                    <p className="text-slate-500">
                        Game will start when everyone accepts
                    </p>

                    <p className="text-3xl font-bold text-slate-800">
                        {countdown} seconds remaining
                    </p>
                </div>

				<div className="flex gap-4">
    				<button
        				type="button"
        				onClick={handleAccept}
        				disabled={currentPlayer?.accepted}
        				className={`px-6 py-3 rounded-lg text-white ${
            			currentPlayer?.accepted
                			? "bg-green-600 cursor-default"
                			: "bg-slate-700 hover:bg-slate-800"
        				}`}
    				>
        				{currentPlayer?.accepted
            				? "Accepted ✓"
            				: "Accept"}
    				</button>

    				<button
        				type="button"
        				// onClick={handleDecline}
        				className="px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700">
        					Decline
    				</button>
				</div>
            </div>
        </div>
    );
}