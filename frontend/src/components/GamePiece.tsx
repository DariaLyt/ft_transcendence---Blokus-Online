
//This is like the individual pieces, so we can separate the dragging and rotating logic
// without making pieces tray huge

import type { Piece } from "../data/pieces";

type GamePieceProps = {
	piece: Piece;
	isAvailable: boolean;
}

export default function GamePiece({ piece, isAvailable }: GamePieceProps) {
    return (
        <div>
            {piece.shape.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-row">
                    {row.map((cell, cellIndex) => (
                        <div
                            key={cellIndex}
                            className={`w-6 h-6 box-border ${
                                cell === 1
                                    ? isAvailable
                                        ? "bg-blue-600 border border-blue-700"
                                        : "bg-slate-300 border border-slate-400"
                                    : "opacity-0"
                            }`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}