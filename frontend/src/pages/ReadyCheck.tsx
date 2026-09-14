import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { sendMessage, onMessage } from "../websocket/socket";
import Navbar from "../components/NavBar";


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
    const [readyDeadline, setReadyDeadline] = useState("");

    useEffect(() => {
    	fetch("https://localhost:3000/api/auth/me", {
        credentials: "include",
    	})
        	.then((response) => response.json())
        	.then((data) => {
            	setCurrentUser(data.user);
        	});
	}, []);

    const [countdown, setCountdown] = useState(15);

    // TODO: backend should notify players when the ready check expires
    // so the frontend can handle the updated lobby state.
	useEffect(() => {
	  if (!readyDeadline) return;

      const timer = setInterval(() => { // run every second
        const remaining = Math.max( // prevents negative numbers
            0,
            Math.ceil(
                (new Date(readyDeadline).getTime() - Date.now()) / 1000 // get the seconds remaining
            )
        );
        setCountdown(remaining);
      }, 1000);
      return () => clearInterval(timer); // stop timer
	}, [readyDeadline]); // effect depends on readyDeadline


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
                    setReadyDeadline(state.lobby.readyDeadline);
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
            if (message.event === "READY_CHECK_DECLINED") {
                navigate(`/lobby/waiting/${lobbyId}`);
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

    const handleDecline = () => {
        sendMessage({
            category: "LOBBY",
            payload: {
                type: "DECLINE_READY_CHECK",
                lobbyId: lobbyId,
            },
        });
    };

// TODO: backend should notify the other players when a player
// declines and the ready check is aborted.

    return (
        <div>
            <Navbar disablePlay/>
        
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
        				onClick={handleDecline}
        				className="px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700">
        					Decline
    				</button>
				</div>
            </div>
        </div>
        </div>
    );
}