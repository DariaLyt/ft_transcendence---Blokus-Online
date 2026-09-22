import Navbar from "../components/NavBar";
import Board from "../components/Board";
import PiecesTray from "../components/PiecesTray";
import GameStatus from "../components/GameStatus";
import PlayersInfo from "../components/PlayersInfo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "../sockets/GameSessionContext";
import { PIECES } from "../data/pieces";
import { findPiece } from "../data/pieceTransform";
import type { Rotation } from "../data/pieceTransform";

export default function GamePage() {
	const navigate = useNavigate();
	const { currentUser, lobby, game, lastError, sendGame } = useGameSession();
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const [rotation, setRotation] = useState<Rotation>(0);
	const [flip, setFlip] = useState(false);

	const currentSeat = game?.seats.find((seat) => seat.userId === currentUser?.id);
	const remaining = currentSeat ? game?.remaining[currentSeat.color] ?? [] : [];

	useEffect(() => {
		if (game) {
			return;
		}
		const inThisLobby = Boolean(
			currentUser &&
			lobby?.players.some((player) => player.userId === String(currentUser.id))
		);
		if (!inThisLobby) {
			return;
		}
		if (lobby?.status === "waiting") {
			navigate(lobby.id ? `/lobby/waiting/${lobby.id}` : "/lobby/waiting");
			return;
		}
		if (lobby?.status === "ready_check") {
			navigate("/ready-check");
		}
	}, [currentUser, game, lobby, navigate]);

	useEffect(() => {
		if (selectedPiece && !remaining.includes(selectedPiece)) {
			setSelectedPiece(null);
			setRotation(0);
			setFlip(false);
		}
	}, [remaining, selectedPiece]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			const target = event.target as HTMLElement | null;
			const tag = target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
				return;
			}
			if (event.code === "KeyR" || event.key === "r" || event.key === "R") {
				event.preventDefault();
				setRotation((current) => ((current + 90) % 360) as Rotation);
				return;
			}
			if (event.code === "KeyF" || event.key === "f" || event.key === "F") {
				event.preventDefault();
				setFlip((current) => !current);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);
	const isYourTurn =
		game?.status === "active" &&
		Boolean(currentSeat) &&
		currentSeat?.color === game.currentColor;
	const piece = selectedPiece ? findPiece(PIECES, selectedPiece) : null;

	const handlePlace = (x: number, y: number) => {
		if (!game || !currentSeat || !selectedPiece || !isYourTurn) {
			return;
		}
		sendGame("MAKE_MOVE", {
			color: currentSeat.color,
			pieceId: selectedPiece,
			originX: x,
			originY: y,
			rotation,
			flip,
		});
	};

	const handlePass = () => {
		if (!currentSeat || !isYourTurn) {
			return;
		}
		sendGame("PASS_TURN", { color: currentSeat.color });
	};

	if (!game) {
		return (
			<div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col">
				<Navbar />
				<main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
					<p className="text-slate-500">No active game yet.</p>
					<button
						type="button"
						onClick={() => navigate("/lobby")}
						className="px-6 py-3 rounded-lg bg-blue-700 text-white"
					>
						Back to lobby
					</button>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col"> 
		<Navbar />
  
	  	<main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 max-w-7xl mx-auto w-full">
			<GameStatus
				gameState={game}
				currentUserId={currentUser?.id}
			/>
			{lastError && (
				<p className="text-red-600 text-sm">{lastError}</p>
			)}
		
			<div className="grid grid-cols-1 min-[1400px]:grid-cols-[auto_400px] gap-6 w-full justify-center">
				<Board
					board={game.board}
					selectedPiece={piece}
					rotation={rotation}
					flip={flip}
					canPlace={Boolean(isYourTurn && selectedPiece)}
					ghostColor={currentSeat?.color ?? "blue"}
					onPlace={handlePlace}
				/>
			<div className="flex flex-col gap-6">
				<PlayersInfo gameState={game} />
				{isYourTurn && (
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setRotation((r) => ((r + 90) % 360) as Rotation)}
							className="flex-1 px-3 py-2 rounded-lg bg-slate-200 text-sm"
						>
							Rotate (R)
						</button>
						<button
							type="button"
							onClick={() => setFlip((f) => !f)}
							className="flex-1 px-3 py-2 rounded-lg bg-slate-200 text-sm"
						>
							Flip (F) {flip ? "on" : "off"}
						</button>
						<button
							type="button"
							onClick={handlePass}
							className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
						>
							Pass
						</button>
					</div>
				)}
				<PiecesTray 
					gameState={game}
					currentUserId={currentUser?.id}
					selectedPiece={selectedPiece}
					onSelect={(pieceId) => {
						setSelectedPiece(pieceId);
						setRotation(0);
						setFlip(false);
					}}
					canSelect={Boolean(isYourTurn)}
				/>
			</div>
			</div>
	  </main>
		</div>
  );
}
