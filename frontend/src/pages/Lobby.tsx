import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { sendMessage, onMessage } from "../websocket/socket";
import Navbar from "../components/NavBar";

export default function Lobby() {
    const navigate = useNavigate();
    const [showJoin, setShowJoin] = useState(false);
    const [lobbyId, setLobbyId] = useState("");

    useEffect(() => { // when a message arrives, check what event it is
        const unsubscribe = onMessage((message) => {
            if (message.event === "LOBBY_CREATED") {
                const payload = message.payload as {
                    state: string; // we get this from backend as a string
                };
                const state = JSON.parse(payload.state); // turn it into object
                const lobbyId = state.lobby.id;
                navigate(`/lobby/waiting/${lobbyId}`); // navigate to the lobby with the id
            }
            if (message.event === "LOBBY_JOINED") {
                navigate(`/lobby/waiting/${lobbyId}`);
            }
        });
        return unsubscribe; // stop listening when lobby page closes
    }, []); // happens once when the components mounts

    const handleCreateLobby = async () => {
    	const response = await fetch(
        	"https://localhost:3000/api/auth/me",
        	{
            	credentials: "include",
        	}
    	);

    	const data = await response.json();
        sendMessage({
            category: "LOBBY",
            payload: {
                type: "CREATE_LOBBY",
                userName: data.user.username,
                maxPlayers: 4,
            },
        });
    };

    const handleJoinLobby = async () => {
    	const response = await fetch(
        	"https://localhost:3000/api/auth/me",
        	{
            	credentials: "include",
        	}
    	);

    	const data = await response.json();
        sendMessage({
            category: "LOBBY",
            payload: {
                type: "JOIN_LOBBY",
                userName: data.user.username,
                lobbyId: lobbyId,
            },
        });
    };

    return (
        <div>
            <Navbar />
    
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[450px] bg-white p-10 rounded-xl shadow-md flex flex-col">

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2">
                        GAME LOBBY
                    </h1>

                    <p className="text-slate-500">
                        How would you like to play?
                    </p>
                </div>

                {!showJoin ? (
                    <div className="flex flex-col gap-5 flex-1">

                        <button
                            type="button"
                            onClick={handleCreateLobby}
                            className="w-full flex-1 p-8 rounded-xl bg-slate-100 border border-slate-200 text-left hover:bg-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">
                                Create Lobby
                            </h2>

                            <p className="text-slate-500">
                                Start a new game and become the host.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowJoin(true)}
                            className="w-full flex-1 p-8 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100">
                            <h2 className="text-2xl font-bold text-blue-800 mb-3">
                                Join Lobby
                            </h2>

                            <p className="text-slate-500">
                                Join an existing game lobby.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/menu")}
                            className="w-full px-6 py-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">
                            Back
                        </button>

                    </div>
                ) : (
                    <div className="flex flex-col flex-1"> 

                        <div className="mb-8">
                            <label
                                htmlFor="lobbyId"
                                className="block text-sm font-medium text-slate-700 mb-2">
                                Lobby ID
                            </label>

                            <input
                                id="lobbyId"
                                type="text"
                                value={lobbyId}
                                onChange={(event) =>
                                    setLobbyId(event.target.value)
                                }
                                placeholder="Enter lobby ID"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mt-auto flex flex-col gap-3">

                            <button
                                type="button"
                                onClick={handleJoinLobby} // TODO: I need from backend a way to get all the currently available lobbies so i can display them
                                disabled={!lobbyId.trim()}
                                className={`w-full px-6 py-3 rounded-lg text-white ${
                                    lobbyId.trim()
                                        ? "bg-blue-700 hover:bg-blue-800"
                                        : "bg-slate-300 cursor-not-allowed"
                                }`}
                            >
                                Join
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowJoin(false)}
                                className="w-full px-6 py-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">
                                Back
                            </button>

                        </div>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}