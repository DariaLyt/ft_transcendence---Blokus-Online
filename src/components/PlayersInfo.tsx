export default function PlayersInfo() {
	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl">
			<p className="font-bold">Players</p>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<div className="w-3.5 h-3.5 bg-blue-600 rounded-full"/> {/* PLACEHOLDER: PLAYER NAME AND COLOR */}
					<span className="font-bold text-slate-800">Your name</span> 
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3.5 h-3.5 bg-green-600 rounded-full"/>
					<span className="text-slate-800">Player 2</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3.5 h-3.5 bg-red-600 rounded-full"/>
					<span className="text-slate-800">Player 3</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3.5 h-3.5 bg-yellow-600 rounded-full"/>
					<span className="text-slate-800">Player 4</span>
				</div>
			</div>
		</div>
	);
}