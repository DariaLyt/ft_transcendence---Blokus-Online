import Navbar from "../components/NavBar";
import Board from "../components/Board";
import PiecesTray from "../components/PiecesTray";
import GameStatus from "../components/GameStatus";

export default function GamePage() {
  return (
	<div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col"> 
	<Navbar />
  
	{/* Main content area */}
	  <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 max-w-7xl mx-auto w-full">
		<GameStatus />
		<div className="flex flex-col lg:flex-row gap-6 items-center w-full">
		<Board />
		<PiecesTray />
		</div>
	  </main>
	</div>
  );
}