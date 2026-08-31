export default function ProfileAvatar() {
	return (
		<div className="flex flex-col items-center mb-8">
            {/* PLACEHOLDER: this will come from the backend later */}
            <div className="w-28 h-28 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-3xl font-bold text-slate-500">
                NM
            </div>
            {/* PLACEHOLDER: connect to avatar upload endpoint later */}
            <button
                type="button"
                className="mt-4 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                Change avatar
            </button>
        </div>
	);
}