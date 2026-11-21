import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthenticatedUser } from "../handlers/authHandlers.js";

function NotFoundPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadAuthState = async () => {
            const user = await getAuthenticatedUser();
            if (!isMounted) {
                return;
            }

            setIsAuthenticated(Boolean(user));
        };

        loadAuthState();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-black px-4 py-10 text-white sm:px-8">
            <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 rounded-2xl border border-gray-700 bg-gray-900/80 p-8 text-center shadow-xl">
                <p className="text-sm font-semibold tracking-[0.2em] text-gray-300">ERROR 404</p>
                <h1 className="text-3xl font-bold sm:text-4xl">Page Not Found</h1>
                <p className="max-w-xl text-sm text-gray-300 sm:text-base">
                    The page you requested does not exist or may have been moved.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {isAuthenticated ? (
                        <Link
                            to="/home"
                            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Go to Home
                        </Link>
                    ) : (
                        <Link
                            to="/"
                            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;
