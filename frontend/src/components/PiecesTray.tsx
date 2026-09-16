import { PIECES } from '../data/pieces';
import GamePiece from './GamePiece';
import type { Color, GameState } from '../data/game';

type PiecesTrayProps = {
	gameState: GameState;
	currentUserId?: number;
	selectedPiece: string | null;
	onSelect: (pieceId: string) => void;
	canSelect: boolean;
};

export default function PiecesTray({
	gameState,
	currentUserId,
	selectedPiece,
	onSelect,
	canSelect,
}: PiecesTrayProps) {
	const currentPlayer = gameState.seats.find(
		(seat) => seat.userId === currentUserId
	);
	const currentColor: Color | undefined = currentPlayer?.color;
	const remainingPieces = currentColor ? gameState.remaining[currentColor] : [];

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

			<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[300px]">
				<div className="flex flex-wrap gap-3">
					{PIECES.map((piece) => {
						const isAvailable = remainingPieces.includes(piece.id);
						const isSelected = selectedPiece === piece.id;

    					return (
        					<div
            					key={piece.id}
								onClick={() => {
									if (isAvailable && canSelect) {
										onSelect(piece.id);
									}
								}}
            					className={`group p-1.5 w-fit h-fit flex flex-col transition-transform duration-150 ${
                                    isAvailable && canSelect
                                        ? 'cursor-pointer hover:scale-110' 
                                        : 'cursor-default'
                                } ${
									isSelected
										? 'ring-2 ring-slate-800 rounded-md'
										: ''
								}`}
                            	>
									<GamePiece
										piece={piece}
										isAvailable={isAvailable}
										color={currentColor}
									/>
        					</div>
    					);
					})}
				</div>
			</div>
		</div>
	);
}
