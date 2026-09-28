import type { CurrentUser } from "../sockets/GameSessionContext";
import { useState } from "react";

type ProfileInfoProps = { // describes what ProfileInfo will receive from ProfilePage so we don't need to call /me again
	user: CurrentUser;
};

export default function ProfileInfo({user}: ProfileInfoProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);

	return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
                Account information
            </h2>

            <div className="space-y-4">
                <div>
            		<p className="text-sm text-slate-500">Username</p>
                    {isEditing ? (
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    ) : (
                    <p className="text-lg font-medium text-slate-800">
                        {user.username}
                    </p>
                    )}
                </div>

                <div>
                    <p className="text-sm text-slate-500">Email</p>
                    {isEditing ? (
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    ) : (
                    <p className="text-lg font-medium text-slate-800">
                        {user.email}
                    </p>
                    )}
                </div>

                <div>
                    <p className="text-sm text-slate-500">Member since</p>
                    <p className="text-lg font-medium text-slate-800">
                        {new Date(user.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-5 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800"
            >
                Edit profile
            </button>
        </div>
	);
}