import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import Footer from "../components/Footer";
import { useGameSession } from "../sockets/GameSessionContext";

export default function Menu() {
   const navigate = useNavigate();
   const { game, leaveCurrentGame } = useGameSession();
   const inActiveGame = game?.status === "active";

    return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
        <div className="flex-1 flex items-center justify-center bg-slate-100 px-4 py-6">
            <div className="w-full max-w-[600px] min-h-[600px] bg-white p-6 sm:p-10 rounded-xl shadow-md flex flex-col">
                
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2">
                        WELCOME!
                    </h1>
                    <p className="text-slate-500">
                        What would you like to do?
                    </p>
                </div>

                <div className="flex flex-col gap-6 flex-1">
					{inActiveGame && (
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
							<p className="text-slate-600 text-sm">
								You are still in a game. Leaving gives your seat to a bot.
							</p>
							<div className="flex flex-col sm:flex-row gap-3">
								<button
									type="button"
									onClick={() => navigate("/game")}
									className="flex-1 px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
								>
									Return to game
								</button>
								<button
									type="button"
									onClick={() => {
										leaveCurrentGame();
									}}
									className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
								>
									Leave game
								</button>
							</div>
						</div>
					)}
					<button
    					type="button"
    					onClick={() => navigate("/lobby")}
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
    					onClick={() => navigate("/spectate")}
    					className="w-full flex-1 p-8 rounded-xl bg-slate-100 border border-slate-200 text-left hover:bg-slate-200 flex flex-col">
    				<h2 className="text-3xl font-bold text-slate-800 mb-6">
        				Spectate
    				</h2>

    				<p className="text-slate-500 text-lg">
        				Watch an ongoing game.
    				</p>
					</button>
                </div>
            </div>
        </div>
		<Footer/>
		</div>
    );
}
