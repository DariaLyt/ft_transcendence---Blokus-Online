export default function GameStatus() {
	return (
		<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md text-center w-full max-w-2xl">
			<p className="font-bold text-lg">Your turn</p> {/* PLACEHOLDER: this will dynamically change, for other players it will display Blue (or other) player's turn*/}
			<p className="text-sm text-slate-500 mt-1">Place a piece on the board</p> {/* PLACEHOLDER: this will dynamically change, for other players it will display Waiting for them to make their move*/}
		</div>
	);
}