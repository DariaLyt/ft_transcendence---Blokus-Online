import { useEffect, useRef } from "react";

type RulesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    isPlaying?: boolean;
};

export default function RulesModal({
    isOpen,
    onClose,
    isPlaying = false,
}: RulesModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="rules-title"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-xl backdrop:bg-black/50"
        >
            <div className="flex items-center justify-between gap-4">
                <h2
                    id="rules-title"
                    className="text-2xl font-bold text-blue-800"
                >
                    How to play Blokus
                </h2>

                <button
                    type="button"
                    autoFocus
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                    Close
                </button>
            </div>

            {isPlaying && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    The game continues while you read. Your turn timer
                    does not pause.
                </p>
            )}

            <div className="mt-6 space-y-6">
                <section>
                    <h3 className="mb-2 text-lg font-semibold text-yellow-700">
                        Goal
                    </h3>
                    <p>
                        Place as many of your pieces as possible on the
                        board. Each color starts with 21 pieces. The
                        highest final score wins:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>
                            Each square in your remaining pieces counts
                            as −1 point.
                        </li>
                        <li>
                            Placing every piece earns 15 points.
                        </li>
                     </ul>
                </section>

                <section>
                    <h3 className="mb-2 text-lg font-semibold text-red-700">
                        First move
                    </h3>
                    <p>
                        Your first piece must cover your color’s starting
                        corner.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Blue: top-left corner.</li>
                        <li>Yellow: top-right corner.</li>
                        <li>Red: bottom-right corner.</li>
                        <li>Green: bottom-left corner.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="mb-2 text-lg font-semibold text-green-700">
                        Placing pieces
                    </h3>
                    <ul className="list-disc space-y-2 pl-5">
                        <li>
                            Each new piece must
                            touch one of your existing pieces at a corner.
                        </li>
                        <li>
                            Separate pieces of your own color must never
                            share an edge.
                        </li>
                        <li>
                            Your pieces may touch other colors at edges
                            or corners.
                        </li>
                        <li>
                            Pieces cannot overlap or extend outside the
                            board.
                        </li>
                        <li>
                            You can rotate [R] and flip [F] pieces before placing
                            them.
                        </li>
                    </ul>
                </section>

                <section>
                    <h3 className="mb-2 text-lg font-semibold text-blue-700">
                        Turns and passing
                    </h3>
                    <ul className="list-disc space-y-2 pl-5">
                        <li>
                            You have 60 seconds per turn. When time runs
                            out, the game attempts a random legal move
                            for you.
                        </li>
                        <li>
                            If you have no legal moves, your color is
                            automatically skipped.
                        </li>
                        <li>
                            Choosing Pass ends your color’s turns for
                            the rest of the match.
                        </li>
                    </ul>
                </section>

                <section>
                    <h3 className="mb-2 text-lg font-semibold text-red-700">
                        Ending
                    </h3>
                    <p>
                        The match ends when nobody can play or all
                        colors have passed.
                    </p>

                </section>
            </div>
        </dialog>
    );
}