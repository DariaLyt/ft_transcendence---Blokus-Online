import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isDropdownOPen, setIsDropdownOPen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
      const response = await fetch("http://localhost:3000/api/auth/logout", {
        method:"POST",
        credentials:"include",
      });
      if (response.ok) {
        navigate("/");
      }
  };

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

        {/* Right side: navigation links & user avatar with dropdown */}
        <nav className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          > Play</button>
          <button
            type="button"
           // onClick={() => navigate("/leaderboard")} TODO: add a leaderboard page
            className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          > Leaderboard</button>

          <div className="relative">
            <button
              type="button" //PLACEHOLDER for what will later be avatar
              onClick={() => setIsDropdownOPen(!isDropdownOPen)}
              className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-semibold text-slate-600 cursor-pointer hover:bg-slate-300"
              > NM
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
      </header>
  );
}