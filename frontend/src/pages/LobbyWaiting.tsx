import { useNavigate } from "react-router-dom";

type PlayerColor = "Blue" | "Yellow" | "Red" | "Green";

type Player = {
    color: PlayerColor;
    name: string;
    host: boolean;
};

export default function LobbyWaiting() {
    const navigate = useNavigate();

    // PLACEHOLDER: later the player list will come from the backend.
    const players: Player[] = [
        {
            color: "Blue",
            name: "You",
            host: true,
        },
    ];

    const colors: PlayerColor[] = [
        "Blue",
        "Yellow",
        "Red",
        "Green",
    ];

    const colorClasses = {
        Blue: "bg-blue-500",
        Yellow: "bg-yellow-400",
        Red: "bg-red-500",
        Green: "bg-green-500",
    };

    const handleStartGame = () => {
        // PLACEHOLDER: later the host will send a start-game
        // request to the backend.
        navigate("/ready-check");
    };

    const handleLeaveLobby = () => {
        // PLACEHOLDER: later send LEAVE_LOBBY to the backend.
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
                        Players: {players.length} / 4
                    </p>

                    <p className="text-slate-400 text-sm mt-2">
                        You can start with any number of players.
                        Empty seats will be filled by bots.
                    </p>
                </div>

                <div className="w-full mb-8">
                    {colors.map((color) => {
                        const player = players.find(
                            (player) => player.color === color
                        );

                        return (
                            <div
                                key={color}
                                className="flex items-center justify-between py-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${colorClasses[color]}`}/>

                                    <span className="font-medium text-slate-700">
                                        {player ? player.name : "Empty"}
                                    </span>
                                </div>

                                {player?.host && (
                                    <span className="text-sm text-slate-400">
                                        Host ✓
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleStartGame}
                        className="w-full px-6 py-3 rounded-lg bg-blue-700 text-white hover:bg-blue-800">
                        Start Game
                    </button>

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