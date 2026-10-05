import { useGameSession, type CurrentUser } from "../sockets/GameSessionContext";
import { useState } from "react";

type ProfileInfoProps = { // describes what ProfileInfo will receive from ProfilePage so we don't need to call /me again
	user: CurrentUser;
};

export default function ProfileInfo({user}: ProfileInfoProps) {
    const { updateProfile } = useGameSession();
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setError(null);
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
            setError("Username must be between 3 and 30 characters");
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            setError("Username can only contain letters, numbers, underscores, and dashes");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("Invalid email address");
            return;
        }

        try {
            await updateProfile(trimmedUsername, trimmedEmail);
            setIsEditing(false);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
        }
    };
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
            {isEditing ? (
                <>
                    {error && (
                        <p className="mt-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}
                    <div className="mt-5 flex gap-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800"
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                            setUsername(user.username);
                            setEmail(user.email);
                            setIsEditing(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800"
                        >
                            Cancel
                    </button>
                </div>
                </>
            ) : (
            <button
                type="button"
                onClick={() => {
                    setError(null);
                    setIsEditing(true)
                    }}
                className="mt-5 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800"
            >
                Edit profile
            </button>
            )}
        </div>
	);
}