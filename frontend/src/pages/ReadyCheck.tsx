import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGameSession } from "../sockets/GameSessionContext";
import Navbar from "../components/NavBar";

function secondsLeft(deadline?: string | null): number {
    if (!deadline) {
        return 0;
    }
    const ms = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
}

export default function ReadyCheck() {
    const navigate = useNavigate();
    const { currentUser, lobby, game, lastError, sendLobby } = useGameSession();
    const [countdown, setCountdown] = useState(() => secondsLeft(lobby?.readyDeadline));

    useEffect(() => {
        if (lobby?.status === "waiting") {
            navigate(lobby.id ? `/lobby/waiting/${lobby.id}` : "/lobby/waiting");
        }
        if (lobby?.status === "in_game" || game?.status === "active") {
            navigate("/game");
        }
    }, [lobby?.status, lobby?.id, game?.status, navigate]);

    useEffect(() => {
        setCountdown(secondsLeft(lobby?.readyDeadline));
        const id = window.setInterval(() => {
            setCountdown(secondsLeft(lobby?.readyDeadline));
        }, 250);
        return () => window.clearInterval(id);
    }, [lobby?.readyDeadline]);

    const players = lobby?.players ?? [];
    const currentPlayer = players.find(
        (player) => player.userId === String(currentUser?.id)
    );

    const handleAccept = () => {
        if (!lobby?.id) {
            return;
        }
        sendLobby("ACCEPT_READY_CHECK", { lobbyId: lobby.id });
    };

    const handleDecline = () => {
        if (!lobby?.id) {
            return;
        }
        sendLobby("DECLINE_READY_CHECK", { lobbyId: lobby.id });
    };

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
                {lastError && (
                    <p className="text-red-600 text-sm mb-4">{lastError}</p>
                )}

                <div className="w-full mb-8">
                    {players.map((player) => (
                        <div
                            key={player.userId}
                            className="flex justify-between items-center py-3 border-b border-slate-200">
                            <span className="font-medium text-slate-700">
                                {player.username || `Player ${player.userId}`}
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
                        disabled={Boolean(currentPlayer?.accepted)}
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
