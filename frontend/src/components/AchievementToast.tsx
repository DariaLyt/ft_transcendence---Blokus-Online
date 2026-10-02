// import { useGameSession } from '../sockets/GameSessionContext';

// export default function AchievementToast() {
//     const { activeAchievement, clearAchievementPopup } = useGameSession();

//     if (!activeAchievement) return null;

//     return (
//         <div className="fixed bottom-6 right-6 z-50 animate-bounce">
//             <div className="flex items-center space-x-3 bg-slate-900 text-white border border-slate-700 p-4 rounded-xl shadow-2xl max-w-sm">
//                 {activeAchievement.iconUrl ? (
//                     <img 
//                         src={activeAchievement.iconUrl} 
//                         alt={activeAchievement.title} 
//                         className="w-12 h-12 object-contain flex-shrink-0 animate-pulse" 
//                     />
//                 ) : (
//                     <div className="text-3xl">🏆</div>
//                 )}
//                 <div className="flex-1">
//                     <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
//                         Achievement Unlocked!
//                     </span>
//                     <h4 className="font-semibold text-sm">{activeAchievement.title}</h4>
//                     <p className="text-xs text-slate-300 mt-0.5">{activeAchievement.description}</p>
//                 </div>
//                 <button 
//                     onClick={clearAchievementPopup}
//                     className="text-slate-400 hover:text-white text-xs px-2 py-1"
//                 >
//                     ✕
//                 </button>
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from 'react';
import { WS_URL } from '../sockets/frames';
import { useGameSession } from '../sockets/GameSessionContext';

type ToastItem = {
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
};

export default function AchievementToast() {
    const { currentUser } = useGameSession();
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        const socket = new WebSocket(WS_URL);

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.event === 'ACHIEVEMENT_UNLOCKED') {
                    const data = msg.payload || msg;
                    const newToast: ToastItem = {
                        code: data.code,
                        title: data.title,
                        description: data.description,
                        iconUrl: data.iconUrl,
                    };

                    setToasts((prev) => {
                        if (prev.some((t) => t.code === newToast.code)) return prev;
                        return [...prev, newToast];
                    });

                    window.setTimeout(() => {
                        setToasts((prev) => prev.filter((t) => t.code !== newToast.code));
                    }, 5000);
                }
            } catch {
                // Ignore parse errors
            }
        };

        return () => {
            socket.close();
        };
    }, [currentUser]);

    const dismissToast = (code: string) => {
        setToasts((prev) => prev.filter((t) => t.code !== code));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <div 
                    key={toast.code}
                    className="pointer-events-auto flex items-center space-x-3 bg-slate-900 text-white border border-slate-700 p-4 rounded-xl shadow-2xl animate-bounce"
                >
                    {toast.iconUrl ? (
                        <img 
                            src={toast.iconUrl} 
                            alt={toast.title} 
                            className="w-12 h-12 object-contain flex-shrink-0 animate-pulse" 
                        />
                    ) : (
                        <div className="text-3xl">🏆</div>
                    )}
                    <div className="flex-1">
                        <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                            Achievement Unlocked!
                        </span>
                        <h4 className="font-semibold text-sm">{toast.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">{toast.description}</p>
                    </div>
                    <button 
                        onClick={() => dismissToast(toast.code)}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}