import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    deleteAccount,
    getAuthenticatedUser,
    handleLogout,
    updatePassword,
} from "../handlers/authHandlers.js";
import {
    hasPasswordFormErrors,
    validatePasswordChangeForm,
} from "../handlers/profileForm.js";
import NavBar from "../components/navBar.jsx";
import { deleteResource, getMyResources } from "../handlers/resourceHandlers.js";
import { getResourceId } from "../handlers/resourceOwnership.js";
import useAccessibleDialog from "../hooks/useAccessibleDialog.js";
import ResourceCard from "../components/resourceCard.jsx";

function ProfilePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [myResources, setMyResources] = useState([]);
    const [notice, setNotice] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState("");
    const [deletePostCandidate, setDeletePostCandidate] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const closeDeleteModal = useCallback(() => setShowDeleteModal(false), []);
    const closeDeletePostModal = useCallback(() => setDeletePostCandidate(null), []);
    const deleteDialogRef = useAccessibleDialog(showDeleteModal, closeDeleteModal);
    const deletePostDialogRef = useAccessibleDialog(
        Boolean(deletePostCandidate),
        closeDeletePostModal
    );

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const [authenticatedUser, resources] = await Promise.all([
                    getAuthenticatedUser(),
                    getMyResources(),
                ]);

                setUser(authenticatedUser);
                setMyResources(resources);
            } catch (error) {
                console.error(error);
                setNotice({
                    type: "error",
                    message: "Could not load your profile data.",
                });
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, []);

    const logout = async () => {
        const result = await handleLogout();
        if (result.success) {
            navigate("/");
            return;
        }

        setNotice({ type: "error", message: result.message || "Could not log out." });
    };

    const validatePasswordForm = () => {
        const nextErrors = validatePasswordChangeForm(passwordForm);
        setPasswordErrors(nextErrors);
        return !hasPasswordFormErrors(nextErrors);
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        setNotice(null);

        if (!validatePasswordForm()) {
            return;
        }

        setIsUpdatingPassword(true);
        const result = await updatePassword(
            passwordForm.currentPassword,
            passwordForm.newPassword
        );
        setIsUpdatingPassword(false);

        if (!result.success) {
            setNotice({ type: "error", message: result.message || "Password update failed." });
            return;
        }

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setNotice({ type: "success", message: result.message || "Password updated." });
    };

    const confirmDeleteAccount = async () => {
        setIsDeletingAccount(true);
        const result = await deleteAccount();
        setIsDeletingAccount(false);

        if (!result.success) {
            setShowDeleteModal(false);
            setNotice({ type: "error", message: result.message || "Failed to delete account." });
            return;
        }

        navigate("/");
    };

    const requestDeletePost = useCallback((resource) => {
        setDeletePostCandidate(resource || null);
    }, []);

    const confirmDeletePost = async () => {
        const resourceId = getResourceId(deletePostCandidate);
        if (!resourceId) {
            return;
        }

        try {
            setDeletingPostId(resourceId);
            await deleteResource(resourceId);
            setMyResources((current) =>
                current.filter((item) => getResourceId(item) !== resourceId)
            );
            setDeletePostCandidate(null);
            setNotice({ type: "success", message: "Post deleted successfully." });
        } catch (error) {
            console.error(error);
            setNotice({ type: "error", message: error.message || "Failed to delete post." });
        } finally {
            setDeletingPostId("");
        }
    };

    if (loading) {
        return (
            <div className="relative z-10 bg-black text-white flex items-center justify-center min-h-screen">
                <p className="text-lg">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white px-4 py-8 sm:px-8">
            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
                <NavBar
                    title="Profile"
                    subtitle={
                        <>
                            Signed in as{" "}
                            <span className="font-semibold text-white">{user?.username}</span>
                        </>
                    }
                    actions={
                        <>
                            <button
                                onClick={() => navigate("/home")}
                                className="w-full rounded-xl bg-gray-800 px-5 py-3 font-medium text-white transition hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
                            >
                                Back Home
                            </button>
                            <button
                                onClick={logout}
                                className="w-full rounded-xl bg-gray-800 px-5 py-3 font-medium text-white transition hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
                            >
                                Logout
                            </button>
                        </>
                    }
                />

                {notice && (
                    <div
                        role={notice.type === "error" ? "alert" : "status"}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                            notice.type === "error"
                                ? "border-red-300 bg-red-100 text-red-900"
                                : "border-green-300 bg-green-100 text-green-900"
                        }`}
                    >
                        {notice.message}
                    </div>
                )}

                <div className="grid gap-5 lg:items-start lg:grid-cols-[minmax(320px,1fr)_minmax(0,1.4fr)]">
                    <section className="self-start rounded-2xl border border-gray-700 bg-gray-900/80 p-5 shadow-lg">
                        <h2 className="text-xl font-semibold">Change password</h2>
                        <p className="mt-2 text-sm text-gray-300">
                            Enter your current password, then set and confirm a new one.
                        </p>

                        <form className="mt-5 space-y-4" onSubmit={handlePasswordChange} noValidate>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="current-password" className="text-sm text-gray-300">
                                    Current password
                                </label>
                                <input
                                    id="current-password"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(event) =>
                                        setPasswordForm((current) => ({
                                            ...current,
                                            currentPassword: event.target.value,
                                        }))
                                    }
                                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                                    aria-describedby={
                                        passwordErrors.currentPassword ? "current-password-error" : undefined
                                    }
                                    className={`rounded-lg border bg-black/40 px-3 py-2.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                        passwordErrors.currentPassword ? "border-red-400" : "border-gray-600"
                                    }`}
                                />
                                {passwordErrors.currentPassword && (
                                    <p id="current-password-error" className="text-sm text-red-300">
                                        {passwordErrors.currentPassword}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="new-password" className="text-sm text-gray-300">
                                    New password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) =>
                                        setPasswordForm((current) => ({
                                            ...current,
                                            newPassword: event.target.value,
                                        }))
                                    }
                                    aria-invalid={Boolean(passwordErrors.newPassword)}
                                    aria-describedby={
                                        passwordErrors.newPassword ? "new-password-error" : undefined
                                    }
                                    className={`rounded-lg border bg-black/40 px-3 py-2.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                        passwordErrors.newPassword ? "border-red-400" : "border-gray-600"
                                    }`}
                                />
                                {passwordErrors.newPassword && (
                                    <p id="new-password-error" className="text-sm text-red-300">
                                        {passwordErrors.newPassword}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="confirm-password" className="text-sm text-gray-300">
                                    Confirm new password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) =>
                                        setPasswordForm((current) => ({
                                            ...current,
                                            confirmPassword: event.target.value,
                                        }))
                                    }
                                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                                    aria-describedby={
                                        passwordErrors.confirmPassword ? "confirm-password-error" : undefined
                                    }
                                    className={`rounded-lg border bg-black/40 px-3 py-2.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                        passwordErrors.confirmPassword ? "border-red-400" : "border-gray-600"
                                    }`}
                                />
                                {passwordErrors.confirmPassword && (
                                    <p id="confirm-password-error" className="text-sm text-red-300">
                                        {passwordErrors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdatingPassword}
                                className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-black shadow-sm transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:hover:bg-white enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                {isUpdatingPassword ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-gray-700 bg-gray-900/80 p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">My posts</h2>
                            <span className="text-sm text-gray-300">{myResources.length} total</span>
                        </div>

                        <div className="mt-3">
                            {myResources.length === 0 && (
                                <p className="rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-sm text-gray-300">
                                    You have not created any posts yet.
                                </p>
                            )}
                            {myResources.length > 0 && (
                                <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                                    {myResources.map((resource) => (
                                        <ResourceCard
                                            key={getResourceId(resource)}
                                            resource={resource}
                                            variant="compact"
                                            actions={
                                                <button
                                                    type="button"
                                                    onClick={() => requestDeletePost(resource)}
                                                    disabled={deletingPostId === getResourceId(resource)}
                                                    className="inline-flex items-center rounded-md border border-red-300 bg-red-100/90 px-3 py-1 text-xs font-semibold text-red-900 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingPostId === getResourceId(resource)
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-red-400/60 bg-red-900/20 p-5">
                    <h2 className="text-xl font-semibold text-red-100">Danger zone</h2>
                    <p className="mt-2 text-sm text-red-100/90">
                        Deleting your account removes your profile and all your posts permanently.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        Delete Account
                    </button>
                </section>
            </div>

            {deletePostCandidate && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
                    <div
                        ref={deletePostDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-post-title"
                        aria-describedby="delete-post-description"
                        tabIndex={-1}
                        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl focus:outline-none"
                    >
                        <h2 id="delete-post-title" className="text-xl font-semibold text-white">Delete Post?</h2>
                        <p id="delete-post-description" className="mt-3 text-base leading-relaxed text-gray-200">
                            This will permanently remove{" "}
                            <span className="font-semibold text-white">{deletePostCandidate.title}</span>.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeletePostModal}
                                className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeletePost}
                                disabled={deletingPostId.length > 0}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                {deletingPostId.length > 0 ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
                    <div
                        ref={deleteDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-account-title"
                        aria-describedby="delete-account-description"
                        tabIndex={-1}
                        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl focus:outline-none"
                    >
                        <h2 id="delete-account-title" className="text-xl font-semibold text-white">Delete Account?</h2>
                        <p id="delete-account-description" className="mt-3 text-base leading-relaxed text-gray-200">
                            Are you sure? This is a permanent decision and cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteAccount}
                                disabled={isDeletingAccount}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                {isDeletingAccount ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;
