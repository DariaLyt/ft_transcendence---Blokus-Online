import { useState } from "react"; // React hook that lets a component store and update state, we use it to keep track of what the user types
import { useNavigate } from "react-router-dom"; // React hook that lets my code change the page/route programmatically, without having to click
import { useLocation } from "react-router-dom"; // Gives information about the current URL/route and the navigation state  attached to it

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async () => {
        const response = await fetch(
            "http://localhost:3000/api/auth/login", // send a request and wait for the server's response
            {
                method: "POST", // we're sending data to backend
                headers: {
                    "Content-Type": "application/json", // in JSON format, that's what backend expects
                },
                credentials: "include", // include cookies with request and accept cookies from response
                body: JSON.stringify({ // convert the values to JSON
                    email: email,
                    password: password,
                }),
            }
        );
        const data = await response.json(); // take JSON body from backend and convert to JS object
        if (response.ok) { // property that JS fetch() creates based on HTTP status
             navigate("/lobby");
        } else {
            setError(data.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Log in</h1>
                <p className="text-slate-500 mb-6">Enter your details to continue</p>

                {location.state?.message && ( // message of success will come only if coming from registration page
                    <p className="text-green-600 text-sm mb-4">
                        {location.state.message}
                    </p>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email or username</label>
                    <input type="email"
                        value={email} //connects input to React state
                        onChange={(e) => {
                            setEmail(e.target.value); // event handler that runs when input changes
                            setError(""); //error message disappears when user retries if input was invalid
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

                {error && ( // shows if error has a value
                    <p className="text-red-600 text-sm mb-4">
                        {error}
                    </p>
                )}

                <button type="button"
                    onClick={handleLogin}
                    className="w-full bg-blue-700 text-white rounded-lg px-3 py-2 font-medium">Log in</button>
                <p className="text-sm text-slate-500 text-center mt-4">Don't have an account? Register here</p>
            </div>
        </div>
    );
}