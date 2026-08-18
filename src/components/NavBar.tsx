export default function Navbar() {
  return (
      <header className="bg-white border-b border-sky-100 px-6 py-4 flex items-center justify-between shadow-sm">
        {/* Left side: logo and title */}
        <div className="flex items-center gap-3">
          <img
            src="/blokus_logo.png"
            alt="Blokus logo"
            className="w-11 h11 rounded-lg object-contain"
          />
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Blokus <span className="text-blue-600">Online</span>
          </span>
        </div>

        {/* Right side: navigation links & user avatar */}
        <nav className="flex items-center gap-6">
          <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
            Play
          </a>
          <a href="#" className="font-medium text-slate-600 hover:text-slate-900">
            Leaderboard
          </a>
          <a href="#" className="font-medium text-slate-600 hover:text-slate-900">
            Profile
          </a>

          {/* USER AVATAR PLACEHOLDER */}
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-semibold text-slate-600 cursor-pointer hover:bg-slate-300">
            NM
          </div>
        </nav>
      </header>
  );
}