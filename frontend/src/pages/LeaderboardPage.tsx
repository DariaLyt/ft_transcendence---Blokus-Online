import { useEffect, useState } from 'react';
import Navbar from '../components/NavBar';
import FriendProfileModal from '../components/FriendProfileModal';

type LeaderboardEntry = {
    userId: number;
    username: string;
    gamesPlayed: number;
    totalScore: string;
    averageScore: string;
};

type LeaderboardResponse = {
    hasNext: boolean;
    entries: LeaderboardEntry[];
};

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileUserId, setProfileUserId] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadLeaderboard() {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `/api/leaderboard?page=${page}`,
                    {
                        credentials: 'include',
                        signal: controller.signal,
                    },
                );
                if (!response.ok) {
                    throw new Error('Could not load leaderboard.');
                }
                const data: LeaderboardResponse = await response.json();
                if (controller.signal.aborted)
                    return;
                setLeaderboard(data.entries);
                setHasNext(data.hasNext);
            } catch (error) {
                if (controller.signal.aborted)
                    return;
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Could not load leaderboard.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadLeaderboard();

        return () => controller.abort();
    }, [page]);

    function changePage(nextPage: number) {
        setLoading(true);
        setError('');
        setPage(nextPage);
    }

return (
    <div className="min-h-screen bg-slate-100">
        <Navbar />

        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
                Leaderboard
            </h1>

            {loading && (
                <p className="text-slate-500 text-center">
                    Loading leaderboard...
                </p>
            )}

            {error && (
                <p className="text-red-500 text-center">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="grid grid-cols-5 font-bold text-slate-700 border-b pb-3">
                        <p>Rank</p>
                        <p>Player</p>
                        <p>Games</p>
                        <p>Total score</p>
                        <p>Average</p>
                    </div>

                    {leaderboard.length === 0 && (
                        <p className="text-slate-400 text-sm py-6 text-center">
                            No finished games yet. Play a match to the end to appear here.
                        </p>
                    )}
                    {leaderboard.map((player, index) => (
                        <div
                            key={player.userId}
                            className="grid grid-cols-5 py-3 border-b"
                        >
                            <p>{(page - 1) * 10 + index + 1}</p>
                            <p>
                                <button
                                    type="button"
                                    onClick={() => setProfileUserId(player.userId)}
                                    className="font-medium text-slate-800 hover:text-blue-700 hover:underline"
                                >
                                    {player.username}
                                </button>
                            </p>
                            <p>{player.gamesPlayed}</p>
                            <p>{player.totalScore}</p>
                            <p>{player.averageScore}</p>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        disabled={page === 1 || loading}
                        onClick={() => changePage(page - 1)}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="text-slate-600">
                        Page {page}
                    </span>

                    <button
                        type="button"
                        disabled={!hasNext || loading || Boolean(error)}
                        onClick={() => changePage(page + 1)}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
        </div>
        <FriendProfileModal
            userId={profileUserId}
            onClose={() => setProfileUserId(null)}
        />
    </div>
);
}
