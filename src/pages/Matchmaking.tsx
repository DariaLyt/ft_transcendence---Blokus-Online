import { useNavigate } from "react-router-dom";

export default function Matchmaking() {
	const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-[600px] min-h-[400px] bg-white p-10 rounded-xl shadow-md flex flex-col items-center justify-center">
                
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
					onClick={() => navigate("/menu")}
                    className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                    Cancel
                </button>

            </div>
        </div>
    );
}