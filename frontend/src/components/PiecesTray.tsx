import { PIECES } from '../data/pieces';
import type { GameState } from '../data/game';
import { useState } from 'react';


type PiecesTrayProps = {
	gameState: GameState;
	currentUserId?: number;
};

export default function PiecesTray({ gameState, currentUserId }: PiecesTrayProps) {
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

	const currentPlayer = gameState.seats.find(
		(seat) => seat.userId === currentUserId
	);
	const currentColor = currentPlayer?.color;

	const remainingPieces = currentColor? gameState.remaining[currentColor] : []; // eventually this will show the pieces ID that the color still has

	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl w-full flex-shrink-0">
			<div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
				<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
					Available pieces
				</h3>
				<span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
					{remainingPieces.length} left
				</span>
			</div>

			{/* Pieces box */}
			<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[300px]">
				<div className="flex flex-wrap gap-3">
					{PIECES.map((piece) => {

						const isAvailable = remainingPieces.includes(piece.id); // we know if the player still has the piece or not
						const isSelected = selectedPiece === piece.id;

    					return (
        					<div
            					key={piece.id}
								onClick={() => {
									if (isAvailable) {
										setSelectedPiece(piece.id); // remember what piece we click
									}
								}}
            					className={`group p-1.5 w-fit h-fit flex flex-col transition-transform duration-150 ${
                                    isAvailable
                                        ? 'cursor-pointer hover:scale-110' 
                                        : 'cursor-default' // not clickable if not available
                                } ${
									isSelected
										? 'ring-2 ring-slate-800 rounded-md' // highlighted if available and selected
										: ''
								}`}
                            	>
            					{piece.shape.map((row, rowIndex) => (
                					<div key={rowIndex} className="flex flex-row">
                    					{row.map((cell, cellIndex) => (
                        					<div
                            					key={cellIndex}
												className={`w-6 h-6 box-border ${ // draws the shape and also puts it in gray if needed
    												cell === 1
        												? isAvailable
            												? 'bg-blue-600 border border-blue-700'
            												: 'bg-slate-300 border border-slate-400'
        												: 'opacity-0'
												}`}
											/>
                    					))}
                					</div>
            					))}
        					</div>
    					);
					})}
				</div>
			</div>
		</div>
	);
}