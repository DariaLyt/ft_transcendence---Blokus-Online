import { useEffect, useState } from 'react';

interface Achievement {
    id: string;
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
    unlockedAt: string;
}

export default function AchievementsList() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/achievements', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.achievements)) {
                    setAchievements(data.achievements);
                }
            })
            .catch(err => console.error('Failed to load achievements:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-sm text-slate-400 py-4">Loading achievements...</div>;
    if (achievements.length === 0) return null;

    return (
        <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Achievements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                    <div 
                        key={ach.id} 
                        className="flex items-start space-x-3 bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-sm"
                    >
                        {ach.iconUrl ? (
                            <img 
                                src={ach.iconUrl} 
                                alt={ach.title} 
                                className="w-10 h-10 object-contain flex-shrink-0 mt-0.5" 
                            />
                        ) : (
                            <div className="text-2xl">🏆</div>
                        )}
                        <div>
                            <h3 className="font-medium text-slate-800">{ach.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{ach.description}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">
                                Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
