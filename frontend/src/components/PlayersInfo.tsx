import { useState } from "react";
import type { Color, GameState, Seat } from "../data/game";
import FriendProfileModal from "./FriendProfileModal";

type NamedPlayer = {
	userId: string;
	username: string;
};

type PlayersInfoProps = {
	gameState: GameState;
	players?: NamedPlayer[];
};

function seatLabel(seat: Seat, players?: NamedPlayer[]): string {
	if (seat.kind === "bot") {
		return "Bot";
	}
	if (seat.username?.trim()) {
		return seat.username.trim();
	}
	const fromLobby = players?.find(
		(player) => String(player.userId) === String(seat.userId),
	);
	if (fromLobby?.username?.trim()) {
		return fromLobby.username.trim();
	}
	return "Player";
}

const colorClasses: Record<Color, string> = {
	blue: "bg-blue-600",
	yellow: "bg-yellow-400",
	red: "bg-red-600",
	green: "bg-green-600",
};

export default function PlayersInfo({ gameState, players }: PlayersInfoProps) {
	const finished = gameState.status === "finished";
	const [profileUserId, setProfileUserId] = useState<number | null>(null);

	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl">
			<div className="flex flex-col gap-2">
				{gameState.seats.map((seat) => {
					const label = seatLabel(seat, players);
					const canOpen = seat.kind !== "bot" && seat.userId != null;
					return (
						<div
							key={seat.color}
							className="flex items-center justify-between gap-2"
						>
							<div className="flex items-center gap-2">
								<div
									className={`w-3.5 h-3.5 ${colorClasses[seat.color]} rounded-full`}
								/>
								{canOpen ? (
									<button
										type="button"
										onClick={() => setProfileUserId(seat.userId!)}
										className="font-bold text-slate-800 hover:text-blue-700 hover:underline"
									>
										{label}
									</button>
								) : (
									<span className="font-bold text-slate-800">{label}</span>
								)}
								{gameState.currentColor === seat.color &&
									gameState.status === "active" && (
										<span className="text-xs text-slate-400">to move</span>
									)}
							</div>
							{finished && gameState.scores && (
								<span className="text-sm font-semibold text-slate-600">
									{gameState.scores[seat.color] ?? 0}
								</span>
							)}
						</div>
					);
				})}
			</div>
			<FriendProfileModal
				userId={profileUserId}
				onClose={() => setProfileUserId(null)}
			/>
		</div>
	);
}
