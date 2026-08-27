import Navbar from '../components/NavBar';
import ProfileAvatar from '../components/ProfileAvatar';
import ProfileInfo from '../components/ProfileInfo';
import ChangePassword from '../components/ChangePassword';
import FriendsList from '../components/FriendsList';

import { useEffect, useState } from 'react';
type User = {
    id: number;
    username: string;
    email: string;
    created_at: string;
};

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProfile = async () => {
            const response = await fetch("http://localhost:3000/api/auth/me", {
                method:"GET",
                credentials:"include",
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                const data = await response.json();
                setError(data.error);
            }
            setLoading(false);
        };
        getProfile();
    }, []); // runs once when the page loads

    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />
            <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-8">
                {loading && (
                    <p className="text-slate-500 text-center">
                        Loading profile...
                    </p>
                )}

                {error && (
                    <p className="text-red-500 text-center">
                        {error}
                    </p>
                )}

               {user && (
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Profile</h1>
                        <ProfileAvatar />
                        <ProfileInfo user={user} />
                        <ChangePassword />
                        <FriendsList />
                    </div>
               )}
            </div>
        </div>
    );
}