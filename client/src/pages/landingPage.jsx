import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAuthenticatedUser,
    handleLogin,
    handleRegister,
} from "../handlers/authHandlers.js";

function LandingPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ username: "", password: "" });
    const [feedback, setFeedback] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const redirectIfLoggedIn = async () => {
            const user = await getAuthenticatedUser();
            if (!isMounted) {
                return;
            }

            if (user) {
                navigate("/home", { replace: true });
                return;
            }

            setCheckingSession(false);
        };

        redirectIfLoggedIn();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    if (checkingSession) {
        return (
            <div className="relative z-10 bg-black text-white flex items-center justify-center min-h-screen">
                <p className="text-lg">Checking session...</p>
            </div>
        );
    }

    const validateAuthForm = () => {
        const nextErrors = { username: "", password: "" };

        if (!username.trim()) {
            nextErrors.username = "Username is required.";
        }

        if (!password.trim()) {
            nextErrors.password = "Password is required.";
        }

        setErrors(nextErrors);
        return !nextErrors.username && !nextErrors.password;
    };

    const login = async () => {
        setFeedback(null);
        if (!validateAuthForm()) {
            return;
        }

        const result = await handleLogin(username.trim(), password);
        if (result.success) {
            navigate("/home"); // redirect after login
            return;
        }

        setFeedback({ type: "error", message: result.message || "Login failed." });
    };

    const handleSignInSubmit = async (event) => {
        event.preventDefault();
        await login();
    };

    const register = async () => {
        setFeedback(null);
        if (!validateAuthForm()) {
            return;
        }

        const result = await handleRegister(username.trim(), password);
        if (result.success) {
            navigate("/home"); // redirect after register
            return;
        }

        setFeedback({ type: "error", message: result.message || "Registration failed." });
    };

    return (
        <div className="relative min-h-screen bg-black overflow-x-hidden">
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
                <h1 className="text-white text-3xl font-bold text-center sm:text-4xl">
                    Share resources for studying!
                </h1>

                <form className="w-full max-w-sm flex flex-col gap-6" onSubmit={handleSignInSubmit} noValidate>
                    {feedback && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-900"
                        >
                            {feedback.message}
                        </div>
                    )}

                    <div className="flex flex-col">
                        <label htmlFor="username" className="text-gray-400 text-sm mb-2 tracking-wide">
                            USERNAME
                        </label>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setErrors((current) => ({ ...current, username: "" }));
                            }}
                            aria-invalid={Boolean(errors.username)}
                            aria-describedby={errors.username ? "username-error" : undefined}
                            className="bg-transparent border-b border-gray-600
                       text-white py-2 px-1
                       focus:outline-none
                       focus:border-white
                       transition-all duration-200"
                        />
                        {errors.username && (
                            <p id="username-error" className="mt-2 text-sm text-red-300">{errors.username}</p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="password" className="text-gray-400 text-sm mb-2 tracking-wide">
                            PASSWORD
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors((current) => ({ ...current, password: "" }));
                            }}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? "password-error" : undefined}
                            className="bg-transparent border-b border-gray-600
                       text-white py-2 px-1
                       focus:outline-none
                       focus:border-white
                       transition-all duration-200"
                        />
                        {errors.password && (
                            <p id="password-error" className="mt-2 text-sm text-red-300">{errors.password}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <button
                            type="submit"
                            className="w-full text-white bg-gray-800 px-8 py-4 rounded-xl hover:bg-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Sign In
                        </button>

                        <button
                            type="button"
                            onClick={register}
                            className="w-full text-white bg-gray-800 px-8 py-4 rounded-xl hover:bg-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LandingPage;
