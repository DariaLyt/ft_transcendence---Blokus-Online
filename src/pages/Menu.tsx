//import { useNavigate } from "react-router-dom";

export default function Menu() {
   // const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[600px] bg-white p-10 rounded-xl shadow-md flex flex-col">
                
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2">
                        WELCOME!
                    </h1>
                    <p className="text-slate-500">
                        What would you like to do?
                    </p>
                </div>

                <div className="flex flex-col gap-6 flex-1">
					<button
    					type="button"
    					//onClick={() => navigate("/game-finder")} // TODO: build the game browser page
    					className="w-full flex-1 p-8 rounded-xl bg-slate-100 border border-slate-200 text-left hover:bg-slate-200 flex flex-col">
    				<h2 className="text-3xl font-bold text-slate-800 mb-6">
        				Play
    				</h2>

    				<p className="text-slate-500 text-lg">
        				Start a new game or join an existing one.
    				</p>
					</button>

					<button
    					type="button"
						//onClick={() => navigate("/tournament")}// TODO: add a tournament page
    					className="w-full flex-1 p-8 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 flex flex-col">
    				<h2 className="text-3xl font-bold text-blue-800 mb-6">
        				Tournament
    				</h2>

    				<p className="text-slate-500 text-lg">
        				Compete against other players in a tournament.
    				</p>
					</button>
                </div>
            </div>
        </div>
    );
}