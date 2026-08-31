type User = {
    id: number;
    username: string;
    email: string;
    created_at: string;
};

type ProfileInfoProps = { // describes what ProfileInfo will receive from ProfilePage so we don't need to call /me again
	user: User;
};

export default function ProfileInfo({user}: ProfileInfoProps) {
	return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
                Account information
            </h2>

            <div className="space-y-4">
                <div>
            		<p className="text-sm text-slate-500">Username</p>
                    <p className="text-lg font-medium text-slate-800">
                        {user.username}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-lg font-medium text-slate-800">
                        {user.email}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-slate-500">Member since</p>
                    <p className="text-lg font-medium text-slate-800">
                        {new Date(user.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* PLACEHOLDER: edit profile endpoint not available yet */}
            <button
                type="button"
                className="mt-5 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800"
            >
                Edit profile
            </button>
        </div>
	);
}