import { useEffect, useRef, useState } from "react";

export type PublicProfile = {
	id: number;
	username: string;
	avatarUrl: string | null;
	createdAt: string;
	online: boolean;
	gamesPlayed: number;
	friendship: "self" | "accepted" | "pending" | "declined" | "none";
};

type FriendProfileModalProps = {
	userId: number | null;
	onClose: () => void;
};

function avatarSrc(url: string | null) {
	return url || "/default-avatar.png";
}

export default function FriendProfileModal({
	userId,
	onClose,
}: FriendProfileModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [profile, setProfile] = useState<PublicProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return;
		}
		if (userId != null && !dialog.open) {
			dialog.showModal();
		} else if (userId == null && dialog.open) {
			dialog.close();
		}
	}, [userId]);

	useEffect(() => {
		if (userId == null) {
			setProfile(null);
			setError("");
			setLoading(false);
			return;
		}

		const controller = new AbortController();
		setLoading(true);
		setSending(false);
		setError("");
		setNotice("");
		setProfile(null);

		void (async () => {
			try {
				const response = await fetch(`/api/users/${userId}/profile`, {
					credentials: "include",
					signal: controller.signal,
				});
				const data = await response.json().catch(() => ({}));
				if (!response.ok) {
					throw new Error(data.error || "Could not load profile.");
				}
				if (controller.signal.aborted) {
					return;
				}
				setProfile(data as PublicProfile);
			} catch (err) {
				if (controller.signal.aborted) {
					return;
				}
				setError(
					err instanceof Error ? err.message : "Could not load profile.",
				);
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		})();

		return () => controller.abort();
	}, [userId]);

	const sendRequest = async () => {
		if (!profile) {
			return;
		}
		setSending(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/friend/request", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ friendId: profile.id }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error || "Could not send friend request.");
			}
			setProfile({ ...profile, friendship: "pending" });
			setNotice(`Request sent to ${profile.username}.`);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not send friend request.",
			);
		} finally {
			setSending(false);
		}
	};

	const friendAction =
		profile?.friendship === "accepted"
			? "Already friends"
			: profile?.friendship === "pending"
				? "Request pending"
				: "Add friend";
	const canSend =
		profile != null &&
		(profile.friendship === "none" || profile.friendship === "declined");

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby="friend-profile-title"
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			className="m-auto w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-xl backdrop:bg-black/50"
		>
			<div className="flex items-center justify-between gap-4">
				<h2
					id="friend-profile-title"
					className="text-2xl font-bold text-blue-800"
				>
					Player profile
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
				>
					Close
				</button>
			</div>

			{loading && (
				<p className="mt-6 text-sm text-slate-500">Loading profile…</p>
			)}
			{error && (
				<p role="alert" className="mt-6 text-sm text-red-600">
					{error}
				</p>
			)}
			{notice && (
				<p className="mt-6 text-sm text-green-700">{notice}</p>
			)}

			{profile && (
				<div className="mt-6 flex flex-col items-center text-center">
					<img
						src={avatarSrc(profile.avatarUrl)}
						alt=""
						className="h-24 w-24 rounded-full object-cover border-2 border-slate-200"
					/>
					<p className="mt-4 text-xl font-bold text-slate-800">
						{profile.username}
					</p>
					<p className="mt-1 text-sm text-slate-500">
						<span
							className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
								profile.online ? "bg-green-500" : "bg-slate-300"
							}`}
						/>
						{profile.online ? "Online" : "Offline"}
					</p>
					<dl className="mt-6 w-full space-y-3 text-left">
						<div>
							<dt className="text-sm text-slate-500">Member since</dt>
							<dd className="font-medium text-slate-800">
								{profile.createdAt
									? new Date(profile.createdAt).toLocaleDateString()
									: "—"}
							</dd>
						</div>
						<div>
							<dt className="text-sm text-slate-500">Games played</dt>
							<dd className="font-medium text-slate-800">
								{profile.gamesPlayed}
							</dd>
						</div>
					</dl>
					{profile.friendship !== "self" && (
						<button
							type="button"
							disabled={!canSend || sending}
							onClick={() => void sendRequest()}
							className={`mt-6 w-full rounded-lg px-4 py-2 ${
								canSend && !sending
									? "bg-blue-700 text-white hover:bg-blue-800"
									: "cursor-not-allowed bg-slate-200 text-slate-500"
							}`}
						>
							{sending ? "Sending…" : friendAction}
						</button>
					)}
				</div>
			)}
		</dialog>
	);
}
