import { useEffect, useState } from 'react';
import Navbar from '../components/NavBar';

type LeaderboardEntry = {
    userId: number;
    username: string;
    gamesPlayed: number;
    totalScore: string;
    averageScore: string;
};

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const getLeaderboard = async () => {
            const response = await fetch("http://localhost:3000/api/leaderboard", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data);
            }
            else {
                const data = await response.json();
                setError(data.error);
            }
            setLoading(false);
        };

        getLeaderboard();
    }, []);

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

                    {leaderboard.map((player, index) => (
                        <div
                            key={player.userId}
                            className="grid grid-cols-5 py-3 border-b"
                        >
                            <p>{index + 1}</p>
                            <p>{player.username}</p>
                            <p>{player.gamesPlayed}</p>
                            <p>{player.totalScore}</p>
                            <p>{player.averageScore}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);
}