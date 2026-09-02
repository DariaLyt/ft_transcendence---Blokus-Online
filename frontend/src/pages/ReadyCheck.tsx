import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

type PlayerColor = "Blue" | "Yellow" | "Red" | "Green";

type Player = {
    color: PlayerColor;
    name: string;
    ready: boolean;
};

export default function ReadyCheck() {
    const navigate = useNavigate();

    // PLACEHOLDER: later this information will come from the backend.
    const [players, setPlayers] = useState<Player[]>([
        { color: "Blue", name: "You", ready: false },
        { color: "Yellow", name: "Player 2", ready: true },
        { color: "Red", name: "Player 3", ready: true },
        { color: "Green", name: "Player 4", ready: true },
    ]);

    // PLACEHOLDER: the backend will control the ready-check timer.
    const [countdown, setCountdown] = useState(15);

    const colorClasses = {
        Blue: "bg-blue-500",
        Yellow: "bg-yellow-400",
        Red: "bg-red-500",
        Green: "bg-green-500",
    };

    useEffect(() => {
        // PLACEHOLDER: simulate the 15 second ready-check locally.
        // Later the backend will tell us when the ready-check starts
        // and when it ends.
        if (countdown <= 0) {
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((current) => current - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    const currentPlayer = players[0];

    const handleReady = () => {
        // PLACEHOLDER: later send the ready action through WebSocket.
        setPlayers((currentPlayers) =>
            currentPlayers.map((player, index) =>
                index === 0
                    ? { ...player, ready: true }
                    : player
            )
        );
    };

    const allReady = players.every((player) => player.ready);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[400px] bg-white p-10 rounded-xl shadow-md flex flex-col items-center justify-center">

                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Ready check
                </h1>

                <p className="text-slate-500 text-lg mb-8">
                    Confirm you're ready to play.
                </p>

                <div className="w-full mb-8">
                    {players.map((player) => (
                        <div
                            key={player.color}
                            className="flex justify-between items-center py-3 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${colorClasses[player.color]}`}/>

                                <span className="font-medium text-slate-700">
                                    {player.name}
                                </span>
                            </div>

                            <span
                                className={
                                    player.ready
                                        ? "text-green-600 font-medium"
                                        : "text-slate-400"
                                }
                            >
                                {player.ready
                                    ? "Ready ✓"
                                    : "Waiting..."}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-6">
                    <p className="text-slate-500">
                        Ready check
                    </p>

                    <p className="text-3xl font-bold text-slate-800">
                        {countdown} seconds remaining
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleReady}
                    disabled={currentPlayer.ready}
                    className={`px-6 py-3 rounded-lg text-white ${
                        currentPlayer.ready
                            ? "bg-green-600 cursor-default"
                            : "bg-slate-700 hover:bg-slate-800"
                    }`}
                >
                    {currentPlayer.ready
                        ? "Ready ✓"
                        : "Ready"}
                </button>

                {/* PLACEHOLDER: the backend will decide when everyone
                    is ready and will tell us when the game starts. */}
                {allReady && (
                    <button
                        type="button"
                        onClick={() => navigate("/game")}
                        className="mt-4 px-6 py-3 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
                    >
                        Simulate game starting
                    </button>
                )}

            </div>
        </div>
    );
}