import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { buildApiUrl } from "../handlers/apiBase.js";

function ProtectedRoute({ children }) {

    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const timeoutId = setTimeout(async () => {
            try {
                const response = await fetch(
                    buildApiUrl("/api/auth/verify"),
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );

                if (isMounted) {
                    setIsAuthenticated(response.ok);
                }
            } catch {
                if (isMounted) {
                    setIsAuthenticated(false);
                }
            }
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
