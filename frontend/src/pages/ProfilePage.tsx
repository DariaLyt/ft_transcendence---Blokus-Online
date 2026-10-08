import Navbar from '../components/NavBar';
import ProfileAvatar from '../components/ProfileAvatar';
import ProfileInfo from '../components/ProfileInfo';
import ChangePassword from '../components/ChangePassword';
import FriendsList from '../components/FriendsList';
import { useGameSession } from '../sockets/GameSessionContext';
import MatchHistory from '../components/MatchHistory';
import AchievementsList from '../components/AchievementsList';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const { currentUser, authLoading, activeAchievement } = useGameSession();
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	useEffect(() => {
        if (activeAchievement) {
            setRefreshTrigger(prev => prev + 1);
        }
    }, [activeAchievement]);

    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />
            <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-8">
                {authLoading && (
                    <p className="text-slate-500 text-center">
                        Loading profile...
                    </p>
                )}

               {currentUser && (
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Profile</h1>
                        <ProfileAvatar user={currentUser}/>
                        <ProfileInfo user={currentUser} />
                        <ChangePassword />
                        <FriendsList />
                        <MatchHistory />
						<AchievementsList key={refreshTrigger} />
                    </div>
               )}
            </div>
        </div>
    );
}
