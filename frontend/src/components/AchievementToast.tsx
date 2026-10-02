import { useGameSession } from '../sockets/GameSessionContext';

export default function AchievementToast() {
    const { activeAchievement, clearAchievementPopup } = useGameSession();

    if (!activeAchievement) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="flex items-center space-x-3 bg-slate-900 text-white border border-slate-700 p-4 rounded-xl shadow-2xl max-w-sm">
                {activeAchievement.iconUrl ? (
                    <img 
                        src={activeAchievement.iconUrl} 
                        alt={activeAchievement.title} 
                        className="w-12 h-12 object-contain flex-shrink-0 animate-pulse" 
                    />
                ) : (
                    <div className="text-3xl">🏆</div>
                )}
                <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                        Achievement Unlocked!
                    </span>
                    <h4 className="font-semibold text-sm">{activeAchievement.title}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{activeAchievement.description}</p>
                </div>
                <button 
                    onClick={clearAchievementPopup}
                    className="text-slate-400 hover:text-white text-xs px-2 py-1"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}