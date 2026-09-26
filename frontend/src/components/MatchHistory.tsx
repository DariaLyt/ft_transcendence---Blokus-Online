import { useEffect, useState } from "react";

type Match = {
    gameId: string;
    finishedAt: string | null;
    yourScore: number | null;
    result: "win" | "loss" | "draw" | "unknown";
    opponents: {
        userId: number | null;
        username: string;
        score: number | null;
    }[];
};

export default function MatchHistory() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadHistory() {
            try {
                const response = await fetch("/api/users/me/history", {
                    credentials: "include",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Could not load match history.");
                }

                const data: Match[] = await response.json();

                if (controller.signal.aborted) return;

                setMatches(data);
            } catch (error) {
                if (controller.signal.aborted) return;

                setError(
                    error instanceof Error
                        ? error.message
                        : "Could not load match history."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadHistory();

        return () => controller.abort();
    }, []);

    return (
        <section className="border-t border-slate-200 pt-8 mt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
                Match history
            </h2>

            {loading && (
                <p className="text-slate-500">
                    Loading match history...
                </p>
            )}

            {error && (
                <p role="alert" className="text-red-600">
                    {error}
                </p>
            )}

            {!loading && !error && matches.length === 0 && (
                <p className="text-slate-500">
                    You haven’t completed any matches yet.
                </p>
            )}

            {!loading && !error && matches.length > 0 && (
                <ul className="divide-y divide-slate-200">
                    {matches.map(match => (
                        <li key={match.gameId} className="py-4">
                            <div className="flex justify-between gap-4">
                                <p className="font-medium text-slate-800">
                                    Match #{match.gameId}
                                </p>

                                <p className="text-sm text-slate-500">
                                    {match.finishedAt
                                        ? new Date(
                                              match.finishedAt
                                          ).toLocaleDateString()
                                        : "Date unavailable"}
                                </p>
                            </div>

                            <p className="mt-2 font-semibold text-slate-800">
                                {{
                                    win: "Win",
                                    loss: "Loss",
                                    draw: "Draw",
                                    unknown: "Result unavailable",
                                }[match.result]}
                            </p>

                            <p className="mt-2 text-slate-700">
                                Your score: {match.yourScore ?? "—"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {match.opponents.length > 0
                                    ? match.opponents
                                          .map(
                                              opponent =>
                                                  `${opponent.username}: ${
                                                      opponent.score ?? "—"
                                                  }`
                                          )
                                          .join(" · ")
                                    : "No opponents recorded"}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}