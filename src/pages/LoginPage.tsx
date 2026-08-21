export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Log in</h1>
                <p className="text-slate-500 mb-6">Enter your details to continue</p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="password" className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                </div>
                <button type="button" className="w-full bg-blue-700 text-white rounded-lg px-3 py-2 font-medium">Log in</button>
                <p className="text-sm text-slate-500 text-center mt-4">Don't have an account? Register here</p>
            </div>
        </div>
    );
}