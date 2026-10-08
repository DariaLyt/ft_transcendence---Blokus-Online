import { useCallback, useEffect, useState } from "react";
import AddFriendModal from "./AddFriendModal";
import FriendProfileModal from "./FriendProfileModal";

type Friend = {
	id: number;
	username: string;
	avatarUrl: string | null;
	online: boolean;
};

type PendingRequest = {
	requestId: number;
	requesterId: number;
	username: string;
	avatarUrl: string | null;
	createdAt: string;
};

function avatarSrc(url: string | null) {
	return url || "/default-avatar.png";
}

export default function FriendsList() {
	const [friends, setFriends] = useState<Friend[]>([]);
	const [pending, setPending] = useState<PendingRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [profileUserId, setProfileUserId] = useState<number | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setError("");
		try {
			const [friendsRes, pendingRes] = await Promise.all([
				fetch("/api/friend", { credentials: "include" }),
				fetch("/api/friend/pending", { credentials: "include" }),
			]);
			if (!friendsRes.ok || !pendingRes.ok) {
				throw new Error("Could not load friends.");
			}
			const friendsData: Friend[] = await friendsRes.json();
			const pendingData: PendingRequest[] = await pendingRes.json();
			setFriends(friendsData);
			setPending(pendingData);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not load friends.",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const respond = async (
		requestId: number,
		status: "accepted" | "declined",
	) => {
		setBusyId(requestId);
		setError("");
		try {
			const response = await fetch(`/api/friend/response/${requestId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error || "Could not update request.");
			}
			await load();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not update request.",
			);
		} finally {
			setBusyId(null);
		}
	};

	const removeFriend = async (friend: Friend) => {
		if (!window.confirm(`Remove ${friend.username} from your friends?`)) {
			return;
		}
		setBusyId(friend.id);
		setError("");
		try {
			const response = await fetch(`/api/friend/${friend.id}`, {
				method: "DELETE",
				credentials: "include",
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error || "Could not remove friend.");
			}
			await load();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not remove friend.",
			);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<div className="border-t border-slate-200 pt-8">
			<h2 className="text-xl font-bold text-slate-800 mb-4">Friends</h2>

			{error && (
				<p role="alert" className="mb-4 text-sm text-red-600">
					{error}
				</p>
			)}

			{pending.length > 0 && (
				<div className="mb-6">
					<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
						Friend requests
					</h3>
					<div className="space-y-3">
						{pending.map((request) => (
							<div
								key={request.requestId}
								className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<img
										src={avatarSrc(request.avatarUrl)}
										alt=""
										className="h-10 w-10 rounded-full object-cover"
									/>
									<div className="min-w-0">
										<p className="truncate font-medium text-slate-800">
											{request.username}
										</p>
										<p className="text-xs text-slate-500">
											wants to be friends
										</p>
									</div>
								</div>
								<div className="flex shrink-0 gap-2">
									<button
										type="button"
										disabled={busyId === request.requestId}
										onClick={() =>
											void respond(request.requestId, "accepted")
										}
										className="rounded-lg bg-blue-700 px-3 py-2 text-sm text-white hover:bg-blue-800 disabled:bg-slate-300"
									>
										Accept
									</button>
									<button
										type="button"
										disabled={busyId === request.requestId}
										onClick={() =>
											void respond(request.requestId, "declined")
										}
										className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
									>
										Decline
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{loading && <p className="text-slate-500">Loading friends…</p>}

			{!loading && friends.length === 0 && pending.length === 0 && (
				<p className="text-slate-500">
					You have no friends yet. Search for a username to send a request.
				</p>
			)}

			{!loading && friends.length === 0 && pending.length > 0 && (
				<p className="text-slate-500">No friends yet.</p>
			)}

			<div className="space-y-3">
				{friends.map((friend) => (
					<div
						key={friend.id}
						className="flex items-center justify-between gap-3"
					>
						<div className="flex min-w-0 items-center gap-3">
							<img
								src={avatarSrc(friend.avatarUrl)}
								alt=""
								className="h-8 w-8 rounded-full object-cover"
							/>
							<div
								className={`h-2.5 w-2.5 shrink-0 rounded-full ${
									friend.online ? "bg-green-500" : "bg-slate-300"
								}`}
							/>
							<button
								type="button"
								onClick={() => setProfileUserId(friend.id)}
								className="truncate font-medium text-slate-700 hover:text-blue-700 hover:underline"
							>
								{friend.username}
							</button>
						</div>
						<div className="flex shrink-0 items-center gap-3">
							<span className="text-sm text-slate-500">
								{friend.online ? "Online" : "Offline"}
							</span>
							<button
								type="button"
								disabled={busyId === friend.id}
								onClick={() => void removeFriend(friend)}
								className="text-sm text-red-600 hover:text-red-700 disabled:text-slate-400"
							>
								Remove
							</button>
						</div>
					</div>
				))}
			</div>

			<button
				type="button"
				onClick={() => setModalOpen(true)}
				className="mt-5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
			>
				Add friend
			</button>

			<AddFriendModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				onSent={() => void load()}
			/>
			<FriendProfileModal
				userId={profileUserId}
				onClose={() => setProfileUserId(null)}
			/>
		</div>
	);
}
