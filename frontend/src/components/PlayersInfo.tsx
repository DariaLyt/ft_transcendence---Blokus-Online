import type { Color, GameState } from "../data/game";

type PlayersInfoProps = {
	gameState: GameState
}

const colorClasses: Record<Color, string> = {
	blue:"bg-blue-600",
	yellow:"bg-yellow-400",
	red:"bg-red-600",
	green:"bg-green-600",
};

export default function PlayersInfo({ gameState}: PlayersInfoProps) {
	const finished = gameState.status === "finished";
	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl">
			<div className="flex flex-col gap-2">
				{gameState.seats.map((seat) => (
					<div key={seat.color} className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<div className={`w-3.5 h-3.5 ${colorClasses[seat.color]} rounded-full`} />
							<span className="font-bold text-slate-800">
								{seat.kind === "bot" ? "Bot" : `Player ${seat.userId}`}
							</span>
							{gameState.currentColor === seat.color && gameState.status === "active" && (
								<span className="text-xs text-slate-400">to move</span>
							)}
						</div>
						{finished && gameState.scores && (
							<span className="text-sm font-semibold text-slate-600">
								{gameState.scores[seat.color] ?? 0}
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
