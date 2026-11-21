// authHandlers.js
import { buildApiUrl } from "./apiBase.js";

async function parseResponseBody(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

export async function handleRegister(username, password) {
    try {
        const response = await fetch(buildApiUrl("/api/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await parseResponseBody(response);

        if (response.ok) {
            // Register does not set auth cookie, so log in right after registering.
            const loginResult = await handleLogin(username, password);
            if (loginResult.success) {
                return { success: true, message: "Registered and logged in successfully." };
            }

            return {
                success: false,
                message: loginResult.message || "Registered but automatic login failed.",
            };
        }

        return { success: false, message: data.message || "Registration failed." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Server error. Please try again." };
    }
}

export async function handleLogin(username, password) {
    try {
        const response = await fetch(buildApiUrl("/api/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // needed to store httpOnly cookie
            body: JSON.stringify({ username, password }),
        });

        const data = await parseResponseBody(response);

        if (response.ok) {
            // JWT is in cookie, so no need to store manually
            return { success: true, message: "Login successful." };
        }

        return { success: false, message: data.message || "Login failed." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Server error. Please try again." };
    }
}

export async function handleLogout() {
    try {
        const response = await fetch(buildApiUrl("/api/auth/logout"), {
            method: "POST",
            credentials: "include",
        });

        if (response.ok) {
            return { success: true, message: "Logged out successfully." };
        }

        const data = await parseResponseBody(response);
        return { success: false, message: data.message || "Logout failed." };
    } catch (err) {
        console.error(err);
        return { success: false, message: "Server error. Please try again." };
    }
}

export async function getAuthenticatedUser() {
    try {
        const response = await fetch(buildApiUrl("/api/auth/verify"), {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function updatePassword(currentPassword, newPassword) {
    try {
        const response = await fetch(buildApiUrl("/api/auth/change-password"), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await parseResponseBody(response);

        if (response.ok) {
            return { success: true, message: data.message || "Password updated successfully." };
        }

        return { success: false, message: data.message || "Failed to update password." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Server error. Please try again." };
    }
}

export async function deleteAccount() {
    try {
        const response = await fetch(buildApiUrl("/api/auth/delete-account"), {
            method: "DELETE",
            credentials: "include",
        });

        const data = await parseResponseBody(response);

        if (response.ok) {
            return { success: true, message: data.message || "Account deleted successfully." };
        }

        return { success: false, message: data.message || "Failed to delete account." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Server error. Please try again." };
    }
}
