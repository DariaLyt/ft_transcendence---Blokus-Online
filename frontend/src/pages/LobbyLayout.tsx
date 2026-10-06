import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";

export default function LobbyLayout() {
    const waiting = useLocation().pathname.startsWith("/lobby/waiting");

    return (
        <div>
            <Navbar disablePlay={waiting} />
            <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6">
                <div className="w-full max-w-[600px] min-h-[500px] bg-white p-6 sm:p-10 rounded-xl shadow-md flex">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
