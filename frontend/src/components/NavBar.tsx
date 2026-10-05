import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "../sockets/GameSessionContext";
import RulesModal from "./Rules";

type NavbarProps = {
    disablePlay?: boolean;
};

export default function Navbar({ disablePlay = false}: NavbarProps) {
  const [isDropdownOPen, setIsDropdownOPen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser , game, updateCurrentUser, disconnect} = useGameSession();

  const handleLogout = async () => {
	  disconnect();

      const response = await fetch("/api/auth/logout", {
        method:"POST",
        credentials:"include",
      });
      if (response.ok) {
        updateCurrentUser(null);
        navigate("/");
      }
  };


  return (
      <header className="bg-white border-b border-sky-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 shadow-sm">
        {/* Left side: logo and title */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/blokus_logo.png"
            alt="Blokus logo"
            className="w-11 h11 rounded-lg object-contain shrink-0"
          />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900">
            Blokus <span className="text-blue-600">Online</span>
          </span>
        </div>

        {/* Right side: navigation links & user avatar with dropdown */}
        <nav className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            disabled={disablePlay}
            onClick={() => navigate("/menu")}
            className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          > Play</button>
            <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="font-medium text-red-600 hover:text-slate-900 cursor-pointer"
          >
             Rules
          </button>
          <button
            type="button"
            onClick={() => navigate("/leaderboard")}
            className="font-medium text-green-600 hover:text-slate-900 cursor-pointer"
          > Leaderboard</button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOPen(!isDropdownOPen)}
              className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-semibold text-slate-600 cursor-pointer hover:bg-slate-300 overflow-hidden"
              >
                <img
                  src={
                    currentUser?.avatar_url
                      ? currentUser.avatar_url
                      : "/default-avatar.png"
                }
                alt="Profile avatar"
                className="w-full h-full object-cover"
            />
            </button>

            {isDropdownOPen && (
              <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 rounded-lg shadow-md py-2">
                <button 
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="w-full text-center px-4 py-2 text-slate-700 hover:bg-slate-100"
                > Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center px-4 py-2 text-red-600 hover:bg-slate-100"
                >Log out</button>
              </div>
            )}
          </div>
        </nav>
        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          isPlaying={game?.status === "active"}
/>
      </header>
  );
}
