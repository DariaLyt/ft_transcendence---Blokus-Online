import Navbar from "../components/NavBar";
import Board from "../components/Board";
import PiecesTray from "../components/PiecesTray";
import GameStatus from "../components/GameStatus";
import PlayersInfo from "../components/PlayersInfo";
import type { GameState } from "../data/game";
import { useEffect, useState } from "react";

export default function GamePage() {
	const [currentUser, setCurrentUser] = useState<any>(null);
	useEffect(() => {
		fetch("https://localhost:3000/api/auth/me", {
			credentials: "include",
		})
			.then((response) => response.json())
			.then((data) => {
				setCurrentUser(data.user);
			})
	}, []);
	const gameState: GameState = { // PLACEHOLDER: fake data for now but following the structure from backend
		id:"example-game-id",
		mode: "M3P1B",
		board: Array.from({ length: 20}, () =>
			Array.from({length: 20}, () => null)
		),
		seats: [
			{
				color: "blue",
				kind: "human",
				userId: 1,
			},
			{
				color: "yellow",
				kind: "human",
				userId: 2,
			},
			{
				color: "red",
				kind: "human",
				userId: 3,
			},
			{
				color: "green",
				kind: "bot",
			},
		],
		remaining: {
			blue: [],
			yellow: [],
			red: [],
			green: [],
		},
		currentColor: "blue",
		passed: {
			blue: false,
			yellow: false,
			red: false,
			green: false,
		},
		status: "active",
		scores: {
			blue: 0,
			yellow: 0,
			red: 0,
			green: 0,
		}
	};
	return (
		<div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col"> 
		<Navbar />
  
		{/* Main content area */}
	  	<main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 max-w-7xl mx-auto w-full">
			<GameStatus
				gameState={gameState}
				currentUserId={currentUser?.id}
			/>
		
			<div className="grid grid-cols-1 min-[1400px]:grid-cols-[auto_400px] gap-6 w-full justify-center">
				<Board />
			<div className="flex flex-col gap-6">
				<PlayersInfo />
				<PiecesTray />
			</div>
			</div>
	  </main>
		</div>
  );
}