import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom"; // redirection when user clicks a link
import { useGameSession } from "../sockets/GameSessionContext";
import Footer from "../components/Footer";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const { updateCurrentUser } = useGameSession();

    const handleRegister = async () => {
        setError("");
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
            setError("Username must be between 3 and 30 characters");
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            setError("Username can only contain letters, numbers, underscores, and dashes");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("Please enter a valid email address");
            return;
        }
        if (password.length < 8 || password.length > 100) {
            setError("Password must be between 8 and 100 characters");
            return;
        }

        const response = await fetch (
            "/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    username: trimmedUsername,
                    email: trimmedEmail,
                    password: password,
                }),
            }
        );
        const data = await response.json();
        if (response.ok) {
            updateCurrentUser(data.user);
            navigate("/menu");
        } else {
            setError(data.error);
        }
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Create an account</h1>
                <p className="text-slate-500 mb-6">Enter your details to register</p>
				<div className="mb-4">
					<label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
					<input type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setError("");
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
				</div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                </div>

				<div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                </div>

                {error && (
                    <p className="text-red-600 text-sm mb-4">
                        {error}
                    </p>
                )}

                <button type="button"
                    onClick={handleRegister}
                    className="w-full bg-blue-700 text-white rounded-lg px-3 py-2 font-medium">Register</button>
                <p className="text-sm text-slate-500 text-center mt-4">Already have an account?{" "} 
                    <Link to="/" className="text-blue-600 hover:underline">Log in
                    </Link>
                </p>
            </div>
            <Footer />
        </div>
    );
}
