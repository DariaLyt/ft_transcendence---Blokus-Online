import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGameSession } from "../sockets/GameSessionContext";
import Navbar from "../components/NavBar";

export default function Lobby() {
    const navigate = useNavigate();
    const { currentUser, sendLobby, connected, clearSnapshot } = useGameSession();
    const [showJoin, setShowJoin] = useState(false);
    const [lobbyId, setLobbyId] = useState("");
    const [error, setError] = useState("");

    const handleCreateLobby = () => {
        if (!currentUser) {
            setError("You need to be logged in to create a lobby.");
            return;
        }
        clearSnapshot();
        sendLobby("CREATE_LOBBY", {
            userName: currentUser.username,
            maxPlayers: 4,
        });
        navigate("/lobby/waiting");
    };

    const handleJoinLobby = () => {
        if (!currentUser) {
            setError("You need to be logged in to join a lobby.");
            return;
        }
        const code = lobbyId.trim().toUpperCase();
        if (!code) {
            return;
        }
        navigate(`/lobby/waiting/${code}`);
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
                    {!connected && (
                        <p className="text-amber-600 text-sm mt-2">
                            Connecting to the game server…
                        </p>
                    )}
                    {error && (
                        <p className="text-red-600 text-sm mt-2">{error}</p>
                    )}
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
                                    setLobbyId(event.target.value.toUpperCase())
                                }
                                placeholder="e.g. 7K3M2P"
                                maxLength={8}
                                autoCapitalize="characters"
                                autoComplete="off"
                                spellCheck={false}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mt-auto flex flex-col gap-3">

                            <button
                                type="button"
                                onClick={handleJoinLobby}
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
