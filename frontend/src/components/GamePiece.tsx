import type { Piece } from "../data/pieces";
import type { Color } from "../data/game";

type GamePieceProps = {
	piece: Piece;
	isAvailable: boolean;
	color?: Color;
};

const fill: Record<Color, string> = {
	blue: "bg-blue-600 border-blue-700",
	yellow: "bg-yellow-400 border-yellow-500",
	red: "bg-red-600 border-red-700",
	green: "bg-green-600 border-green-700",
};

export default function GamePiece({ piece, isAvailable, color = "blue" }: GamePieceProps) {
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
                                        ? `${fill[color]} border`
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
