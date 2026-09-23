import type { CurrentUser } from "../sockets/GameSessionContext";
import { useRef } from "react";
import type { ChangeEvent } from "react";
import { useGameSession } from "../sockets/GameSessionContext";

type ProfileAvatarProps = {
    user: CurrentUser;
}

export default function ProfileAvatar({ user }: ProfileAvatarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { updateCurrentUser} = useGameSession();

    const handleAvatarChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]; //get file user selected
        if (!file)
            return;
        const formData = new FormData();
        formData.append("avatar", file);
        const response = await fetch ( // send to backend
            "/api/users/me/avatar",
            {
                method: "POST",
                credentials: "include",
                body: formData,
            }
        );
        if (!response.ok)
            return;

        const data = await response.json(); // get url returned by backend
        updateCurrentUser({ // update the shared user
            ...user,
            avatar_url: data.avatarUrl,
        });
    }

	return (
		<div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 rounded-full bg-slate-200 border-2 border-slate-300 overflow-hidden flex items-center justify-center">
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src="/default-avatar.png"
                        alt="Default profile avatar"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                Change avatar
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
            />
        </div>
	);
}