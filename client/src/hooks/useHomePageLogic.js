import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthenticatedUser, handleLogout } from "../handlers/authHandlers.js";
import { createEmptyResourceForm, validateResourceForm } from "../handlers/resourceForm.js";
import { getResourceId } from "../handlers/resourceOwnership.js";
import { createResource, deleteResource, getResources } from "../handlers/resourceHandlers.js";

const RESOURCE_POLL_INTERVAL_MS = 3000;

function useHomePageLogic() {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [form, setForm] = useState(createEmptyResourceForm);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState("");
    const [deletingResourceId, setDeletingResourceId] = useState("");
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [notice, setNotice] = useState(null);
    const noticeTimerRef = useRef(null);

    const dismissNotice = useCallback(() => {
        if (noticeTimerRef.current) {
            clearTimeout(noticeTimerRef.current);
            noticeTimerRef.current = null;
        }
        setNotice(null);
    }, []);

    const pushNotice = useCallback(
        (type, message, durationMs = 5000) => {
            dismissNotice();
            setNotice({ type, message });

            if (durationMs > 0) {
                noticeTimerRef.current = setTimeout(() => {
                    setNotice(null);
                    noticeTimerRef.current = null;
                }, durationMs);
            }
        },
        [dismissNotice]
    );

    const logout = useCallback(async () => {
        const result = await handleLogout();
        if (result.success) {
            navigate("/");
            return;
        }

        pushNotice("error", result.message || "Could not log out right now.");
    }, [navigate, pushNotice]);

    useEffect(
        () => () => {
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
            }
        },
        []
    );

    useEffect(() => {
        let isMounted = true;
        let isRequestInFlight = false;
        const isDocumentVisible = () =>
            typeof document === "undefined" || document.visibilityState === "visible";

        const syncResources = async (showErrorNotice = false) => {
            if (isRequestInFlight) {
                return;
            }

            isRequestInFlight = true;
            try {
                const [data, user] = await Promise.all([
                    getResources(),
                    getAuthenticatedUser(),
                ]);

                if (isMounted) {
                    setResources(data);
                    setCurrentUserId(user?.userId || "");
                }
            } catch (error) {
                console.error(error);
                if (isMounted) {
                    if (showErrorNotice) {
                        pushNotice("error", "Could not load resources. Please login again.");
                    }
                }
            } finally {
                isRequestInFlight = false;
            }
        };

        const initializeResources = async () => {
            await syncResources(true);
            if (isMounted) {
                setLoading(false);
            }
        };

        initializeResources();
        const pollTimerId = setInterval(() => {
            if (!isDocumentVisible()) {
                return;
            }
            syncResources(false);
        }, RESOURCE_POLL_INTERVAL_MS);

        const handleVisibilityChange = () => {
            if (!isDocumentVisible()) {
                return;
            }

            syncResources(false);
        };

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }

        return () => {
            isMounted = false;
            clearInterval(pollTimerId);
            if (typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", handleVisibilityChange);
            }
        };
    }, [pushNotice]);

    const submitResource = useCallback(
        async (event) => {
            event.preventDefault();

            const validationErrors = validateResourceForm(form);
            setFormErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                pushNotice("error", "Please fix the highlighted fields and try again.");
                return;
            }

            try {
                const newResource = await createResource(form);
                setResources((currentResources) => [newResource, ...currentResources]);
                setForm(createEmptyResourceForm());
                setFormErrors({});
                pushNotice("success", "Resource created successfully.");
            } catch (error) {
                console.error(error);
                pushNotice("error", error.message || "Could not create resource.");
            }
        },
        [form, pushNotice]
    );

    const requestDeleteResource = useCallback((resource) => {
        setDeleteCandidate(resource || null);
    }, []);

    const cancelDeleteResource = useCallback(() => {
        setDeleteCandidate(null);
    }, []);

    const confirmDeleteResource = useCallback(async () => {
        const normalizedId = getResourceId(deleteCandidate);
        if (!normalizedId) {
            return;
        }

        try {
            setDeletingResourceId(normalizedId);
            await deleteResource(normalizedId);
            setResources((currentResources) =>
                currentResources.filter(
                    (resource) => getResourceId(resource) !== normalizedId
                )
            );
            setDeleteCandidate(null);
            pushNotice("success", "Resource deleted.");
        } catch (error) {
            console.error(error);
            pushNotice("error", error.message || "Failed to delete resource.");
        } finally {
            setDeletingResourceId("");
        }
    }, [deleteCandidate, pushNotice]);

    return {
        resources,
        form,
        formErrors,
        loading,
        currentUserId,
        deletingResourceId,
        deleteCandidate,
        notice,
        setForm,
        submitResource,
        requestDeleteResource,
        cancelDeleteResource,
        confirmDeleteResource,
        dismissNotice,
        logout,
    };
}

export default useHomePageLogic;
