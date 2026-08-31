type Friend = {
	id: number;
	username: string;
	online: boolean;
}

export default function FriendsList() {
	    // PLACEHOLDER: this data will come from the backend later
    const friends: Friend[] = [
        { id: 1, username: "Player 2", online: true },
        { id: 2, username: "Player 3", online: false },
    ];

    return (
        <div className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
                Friends
            </h2>

            <div className="space-y-3">
                {friends.map((friend) => (
                    <div
                        key={friend.id}
                        className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-3 h-3 rounded-full ${friend.online ? "bg-green-500" : "bg-slate-300"}`}
                            />
                            <span className="font-medium text-slate-700">
                                {friend.username}
                            </span>
                        </div>

                        <span className="text-sm text-slate-500">
                            {friend.online ? "Online" : "Offline"}
                        </span>
                    </div>
                ))}
            </div>

            {/* PLACEHOLDER: connect to friends endpoint later */}
            <button
                type="button"
                className="mt-5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
                Add friend
            </button>
        </div>
    );
}