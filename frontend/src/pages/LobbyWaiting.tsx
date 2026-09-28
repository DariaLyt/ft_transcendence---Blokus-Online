import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useGameSession } from "../sockets/GameSessionContext";
import Navbar from "../components/NavBar";

export default function LobbyWaiting() {
    const navigate = useNavigate();
    const { lobbyId: lobbyIdParam } = useParams();
    const { currentUser, connected, lobby, lastError, sendLobby, clearSnapshot } = useGameSession();
    const joinSentFor = useRef<string>("");
    const inThisLobby = Boolean(
        currentUser &&
        lobby?.players.some((player) => player.userId === String(currentUser.id))
    );

    useEffect(() => {
        if (!inThisLobby) {
            return;
        }
        if (lobby?.status === "ready_check") {
            navigate("/ready-check");
        }
        if (lobby?.status === "in_game") {
            navigate("/game");
        }
    }, [inThisLobby, lobby?.status, navigate]);

    const players = lobby?.players ?? [];
    const currentPlayer = players.find(
        (player) => player.userId === String(currentUser?.id)
    );
    const displayLobbyId = lobby?.id || lobbyIdParam || "";

    useEffect(() => {
        if (!currentUser || !connected || !lobbyIdParam) {
            return;
        }
        const alreadyIn = lobby?.players.some(
            (player) => player.userId === String(currentUser.id)
        );
        if (alreadyIn) {
            joinSentFor.current = lobbyIdParam;
            return;
        }
        if (joinSentFor.current === lobbyIdParam) {
            return;
        }
        joinSentFor.current = lobbyIdParam;
        sendLobby("JOIN_LOBBY", {
            userName: currentUser.username,
            lobbyId: lobbyIdParam,
        });
    }, [connected, currentUser, lobby?.players, lobbyIdParam, sendLobby]);

    const handleStartGame = () => {
        if (!lobby?.id) {
            return;
        }
        sendLobby("BEGIN_READY_CHECK", { lobbyId: lobby.id });
    };

    const handleToggleReady = () => {
        if (!lobby?.id) {
            return;
        }
        sendLobby("TOGGLE_READY", { lobbyId: lobby.id });
    };

    const handleLeaveLobby = () => {
        clearSnapshot();
        sendLobby("LEAVE_LOBBY");
        navigate("/lobby");
    };

    return (
        <div>
            <Navbar disablePlay/>

        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[500px] bg-white p-10 rounded-xl shadow-md flex flex-col">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2">
                        GAME LOBBY
                    </h1>

                    <p className="text-slate-500">
                        Players: {players.length} / {lobby?.maxPlayers ?? 4}
                    </p>
                    {displayLobbyId && (
                        <div className="mt-6 p-4 bg-slate-100 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">
                                Lobby ID
                            </p>
                            <p className="text-2xl font-bold text-slate-800 font-mono tracking-[0.35em]">
                                {displayLobbyId}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                Share this ID with other players.
                            </p>
                        </div>
                    )}

                    <p className="text-slate-400 text-sm mt-2">
                        You can start with any number of players.
                        Empty seats will be filled by bots.
                    </p>
                    {lastError && (
                        <p className="text-red-600 text-sm mt-2">{lastError}</p>
                    )}
                </div>

                <div className="w-full mb-8">
                    {players.map((player) => (
                        <div
                            key={player.userId}
                            className="flex items-center justify-between py-4 border-b border-slate-200">
                            <span className="">
                                {player.username || `Player ${player.userId}`}
                            </span>
                            <div className="flex items-center gap-4">
                                {player.isReady && (
                                    <span className="text-sm text-green-600">
                                        Ready ✓
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
                    {players.length === 0 && (
                        <p className="text-slate-400 text-sm">Waiting for lobby data…</p>
                    )}
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    {!currentPlayer?.isHost && (
                    <button
                        type="button"
                        onClick={handleToggleReady}
                        disabled={!lobby?.id}
                        className="w-full px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700">
                        {currentPlayer?.isReady ? "Not ready" : "Ready"}
                    </button>
                    )}
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
        </div>
    );
}
