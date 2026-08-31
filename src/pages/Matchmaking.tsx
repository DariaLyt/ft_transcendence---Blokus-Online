import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; // runs code when its dependencies change
type PlayerColor = "Blue" | "Yellow" | "Red" | "Green"; // allowed colors
type Player = {
    color: PlayerColor;
    name: string;
    ready: boolean;
};

//We will use states so the information can appear and disappear accordingly, right now there's
// placeholder buttons that make the state change, once the backend is connected it will be substituted
// with WebSocket that will listen for message from backend

export default function Matchmaking() {
	const navigate = useNavigate();
	const [status, setStatus] = useState("searching");
	const [countdown, setCountdown] = useState<number | null>(null); // value can be a number or null
	const [players, setPlayers] = useState<Player[]>([ // PLACEHOLDER: later data will come from backend
    	{ color: "Blue", name: "Player 1", ready: false },
    	{ color: "Yellow", name: "Player 2", ready: false },
    	{ color: "Red", name: "Player 3", ready: false },
    	{ color: "Green", name: "Player 4", ready: false },
	]);

    const colorClasses = {
        Blue: "bg-blue-500",
        Yellow: "bg-yellow-400",
        Red: "bg-red-500",
        Green: "bg-green-500",
    };

	const currentPlayer = players.find( // PLACEHOLDER: pretending to be blue player and changing the state to true manually. This will be through a socket also
        (player) => player.color === "Blue"
    );
	useEffect(() => {
    	if (status !== "readyCheck") {
        	return;
    	}
    	// PLACEHOLDER: simulates the backend starting the ready-check countdown
    	setCountdown(15);
	}, [status]);

	useEffect(() => { // decreases number
    if (countdown === null || countdown <= 0) {
        return;
    	}

    	const timer = setTimeout(() => {
        	setCountdown(countdown - 1);
    	}, 1000);

    	return () => clearTimeout(timer);
	}, [countdown]);

	const handleReady = () => { 
    setPlayers((currentPlayers) =>
        currentPlayers.map((player) =>
            player.color === "Blue"
                ? { ...player, ready: true }
                : player
        )
    	);
	};
	const handleSimulatePlayerReady = (color: PlayerColor) => { // PLACEHOLDER: simulates the backend telling us that another player is ready
    setPlayers((currentPlayers) =>
        currentPlayers.map((player) =>
            player.color === color
                ? { ...player, ready: true }
                : player
        )
    );
};

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[400px] bg-white p-10 rounded-xl shadow-md flex flex-col items-center justify-center">
			{status === "searching" && (
				<>
                	<h1 className="text-3xl font-bold text-slate-800 mb-4">
                    	Finding a game
                	</h1>

                	<p className="text-slate-500 text-lg mb-8">
                    	Looking for opponents...
                	</p>

                	<div className="text-slate-400 mb-8">
                    	Searching...
                	</div>
					<button
						type="button"
						onClick={() => setStatus("readyCheck")}
						className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 mb-4">
						Simulate game found
					</button>

					<button
                   		type="button"
						onClick={() => navigate("/menu")}
                    	className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                    	Cancel
                	</button>
				</>
			)}

			{status === "readyCheck" && (
    			<>
        			<h1 className="text-3xl font-bold text-slate-800 mb-4">
            			Game found!
        			</h1>

        			<p className="text-slate-500 text-lg mb-8">
            			Get ready to play!
        			</p>

        		<div className="w-full mb-8">
            		{players.map((player) => (
                		<div
                    		key={player.color}
                    		className="flex justify-between items-center py-3 border-b border-slate-200">
						<div className="flex items-center gap-3">
    						<div
        						className={`w-4 h-4 rounded-full ${colorClasses[player.color]}`}></div>
							<span className="font-medium text-slate-700">
        						{player.color}
    						</span>
						</div>
                    		<div className="flex items-center gap-3">
    							<span className="text-slate-500">
        							{player.name}
    							</span>
    							<span
        							className={player.ready ? "text-green-600 font-medium" : "text-slate-400"}>
        							{player.ready ? "Ready ✓" : "Waiting..."}
    							</span>
							</div>
                		</div>
            		))}
       			</div>
				{/* PLACEHOLDER: backend will decide when all players are ready, when the ready check times out, and when the game should start.*/}
				{countdown !== null && ( 
    				<div className="text-center mb-6">
       					<p className="text-slate-500">
            				Ready check
        				</p>
        			<p className="text-3xl font-bold text-slate-800">
            			{countdown} seconds remaining
        			</p>
    				</div>
				)}
				<button
    				type="button"
    				onClick={handleReady}
    				disabled={currentPlayer?.ready}
    				className={`px-6 py-3 rounded-lg text-white ${
        			currentPlayer?.ready ? "bg-green-600 cursor-default" : "bg-slate-700 hover:bg-slate-800"}`}>
    				{currentPlayer?.ready ? "Ready ✓" : "Ready"}
				</button>
				{/* PLACEHOLDER: remove when WebSocket is connected */}
				<div className="flex gap-2 mt-4">
    				<button
        				type="button"
        				onClick={() => handleSimulatePlayerReady("Yellow")}
        				className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">
        				Simulate Yellow ready
    				</button>
    				<button
        				type="button"
        				onClick={() => handleSimulatePlayerReady("Red")}
        				className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">
        				Simulate Red ready
    				</button>
    				<button
        				type="button"
        				onClick={() => handleSimulatePlayerReady("Green")}
        				className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">
        				Simulate Green ready
    				</button>
				</div>
				</>
			)}
            </div>
        </div>
    );
}

