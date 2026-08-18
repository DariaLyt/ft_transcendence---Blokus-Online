import { PIECES } from '../data/pieces';

export default function PiecesTray() {
	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl w-full lg:w-[450px] flex-shrink-0">
			<div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
				{/* Left Side: circle + name */}
				<div className="flex items-center gap-2">
					<div className="w-3.5 h-3.5 bg-blue-600 rounded-full"/>
					<span className="font-bold text-slate-800">Player 1 (Blue)</span>  {/* PLACEHOLDER: PLAYER NAME AND COLOR */}
				</div>
				{/* Right Side: pieces left */}
				<span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
					21 left {/* PLACEHOLDER: PIECES LEFT COUNT */}
				</span>
			</div>
			{/* Section label */}
			<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
				Available pieces
			</h3>
			{/* Pieces box */}
			<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[300px]">
				<div className="flex flex-wrap gap-3">
					{PIECES.map((piece) => (
						<div key={piece.id}
						className="group p-1.5 w-fit h-fit flex flex-col cursor-pointer transition-transform duration-150 hover:scale-110">
							{piece.shape.map((row, rowIndex) => (
								<div key={rowIndex} className="flex flex-row">
									{row.map((cell, cellIndex) => (
										<div key={cellIndex}
										className={`w-6 h-6 box-border ${cell === 1 ? 'bg-blue-600 border border-blue-700' : 'opacity-0'}`}/> 
									))}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}