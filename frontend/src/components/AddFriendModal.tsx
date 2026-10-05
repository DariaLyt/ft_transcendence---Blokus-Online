import { useEffect, useRef, useState } from "react";

type SearchHit = {
	id: number;
	username: string;
	avatarUrl: string | null;
	status: "pending" | "accepted" | "declined" | null;
};

type AddFriendModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSent: () => void;
};

function avatarSrc(url: string | null) {
	return url || "/default-avatar.png";
}

function actionLabel(status: SearchHit["status"]) {
	if (status === "accepted") {
		return "Already friends";
	}
	if (status === "pending") {
		return "Request sent";
	}
	return "Send request";
}

export default function AddFriendModal({
	isOpen,
	onClose,
	onSent,
}: AddFriendModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchHit[]>([]);
	const [loading, setLoading] = useState(false);
	const [sendingId, setSendingId] = useState<number | null>(null);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return;
		}
		if (isOpen && !dialog.open) {
			dialog.showModal();
		} else if (!isOpen && dialog.open) {
			dialog.close();
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		setQuery("");
		setResults([]);
		setError("");
		setNotice("");
		setLoading(false);
		setSendingId(null);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		const trimmed = query.trim();
		if (trimmed.length < 1) {
			setResults([]);
			setLoading(false);
			setError("");
			return;
		}
		if (trimmed.length > 30) {
			setResults([]);
			setLoading(false);
			setError("Username must be at most 30 characters");
			return;
		}

		const controller = new AbortController();
		setLoading(true);
		const timer = window.setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/friend/search?username=${encodeURIComponent(trimmed)}`,
					{ credentials: "include", signal: controller.signal },
				);
				if (!response.ok) {
					throw new Error("Could not search users.");
				}
				const data: SearchHit[] = await response.json();
				if (controller.signal.aborted) {
					return;
				}
				setResults(data);
				setError("");
			} catch (err) {
				if (controller.signal.aborted) {
					return;
				}
				setError(
					err instanceof Error ? err.message : "Could not search users.",
				);
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		}, 250);

		return () => {
			controller.abort();
			window.clearTimeout(timer);
		};
	}, [isOpen, query]);

	const handleSend = async (user: SearchHit) => {
		setSendingId(user.id);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/friend/request", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ friendId: user.id }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error || "Could not send friend request.");
			}
			setResults((current) =>
				current.map((row) =>
					row.id === user.id ? { ...row, status: "pending" } : row,
				),
			);
			setNotice(`Request sent to ${user.username}.`);
			onSent();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not send friend request.",
			);
		} finally {
			setSendingId(null);
		}
	};

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby="add-friend-title"
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-xl backdrop:bg-black/50"
		>
			<div className="flex items-center justify-between gap-4">
				<h2
					id="add-friend-title"
					className="text-2xl font-bold text-blue-800"
				>
					Add friend
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
				>
					Close
				</button>
			</div>

			<label className="mt-6 block">
				<span className="mb-2 block text-sm font-medium text-slate-700">
					Search by username
				</span>
				<input
					type="text"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Start typing a username"
					autoComplete="off"
					spellCheck={false}
					className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</label>

			{error && (
				<p role="alert" className="mt-3 text-sm text-red-600">
					{error}
				</p>
			)}
			{notice && (
				<p className="mt-3 text-sm text-green-700">{notice}</p>
			)}

			<div className="mt-4 space-y-2">
				{loading && (
					<p className="text-sm text-slate-500">Searching…</p>
				)}
				{!loading && query.trim() && results.length === 0 && (
					<p className="text-sm text-slate-500">No users found.</p>
				)}
				{results.map((user) => {
					const disabled =
						user.status === "accepted" ||
						user.status === "pending" ||
						sendingId === user.id;
					return (
						<div
							key={user.id}
							className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
						>
							<div className="flex min-w-0 items-center gap-3">
								<img
									src={avatarSrc(user.avatarUrl)}
									alt=""
									className="h-10 w-10 rounded-full object-cover"
								/>
								<p className="truncate font-medium text-slate-800">
									{user.username}
								</p>
							</div>
							<button
								type="button"
								disabled={disabled}
								onClick={() => void handleSend(user)}
								className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
									disabled
										? "cursor-not-allowed bg-slate-200 text-slate-500"
										: "bg-blue-700 text-white hover:bg-blue-800"
								}`}
							>
								{sendingId === user.id
									? "Sending…"
									: actionLabel(user.status)}
							</button>
						</div>
					);
				})}
			</div>
		</dialog>
	);
}
