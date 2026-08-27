import { useState } from "react";

export default function ChangePassword() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleChangePassword = async () => {
    	const response = await fetch("http://localhost:3000/api/auth/me/password",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            setMessage(data.message);
            setError("");
            setCurrentPassword("");
            setNewPassword("");
        } else {
            setError(data.error);
            setMessage("");
        }
    };

    return (
        <div className="border-t border-slate-200 pt-8 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
                Change password
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Current password
                    </label>
                    <input
                        type="password"
						value={currentPassword}
						onChange={(e) => {
							setCurrentPassword(e.target.value);
							setError("");
							setMessage("");
						}}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        New password
                    </label>
                    <input
                        type="password"
						value={newPassword}
						onChange={(e) => {
							setNewPassword(e.target.value);
							setError("");
							setMessage("");
						}}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                </div>

				{error && (
					<p className="text-red-600 text-sm">
                        {error}
                    </p>
				)}

				
				{message && (
					<p className="text-red-600 text-sm">
                        {message}
                    </p>
				)}

                <button
                    type="button"
					onClick={handleChangePassword}
                    className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
                >
                    Change password
                </button>
            </div>
        </div>
    );
}