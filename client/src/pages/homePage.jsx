import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResourceForm from "../components/home/resourceForm.jsx";
import ResourceList from "../components/home/resourceList.jsx";
import NavBar from "../components/navBar.jsx";
import { updateResourceFormField } from "../handlers/resourceForm.js";
import useHomePageLogic from "../hooks/useHomePageLogic.js";
import useAccessibleDialog from "../hooks/useAccessibleDialog.js";

function HomePage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const {
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
    } = useHomePageLogic();

    const handleFieldChange = (field, value) => {
        setForm((currentForm) => updateResourceFormField(currentForm, field, value));
    };
    const deleteDialogRef = useAccessibleDialog(Boolean(deleteCandidate), cancelDeleteResource);

    const categories = useMemo(() => {
        const uniqueSubjects = Array.from(
            new Set(
                resources
                    .map((resource) => (resource?.subject || "").trim())
                    .filter(Boolean)
            )
        );

        return ["All", ...uniqueSubjects.sort((a, b) => a.localeCompare(b))];
    }, [resources]);

    useEffect(() => {
        if (selectedCategory === "All") {
            return;
        }

        if (!categories.includes(selectedCategory)) {
            setSelectedCategory("All");
        }
    }, [categories, selectedCategory]);

    const filteredResources = useMemo(() => {
        const normalizedQuery = searchTerm.trim().toLowerCase();

        return resources.filter((resource) => {
            const matchesCategory =
                selectedCategory === "All" ||
                (resource?.subject || "").trim() === selectedCategory;

            if (!matchesCategory) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const searchableText = [
                resource?.title || "",
                resource?.description || "",
                resource?.subject || "",
                resource?.createdByUsername || "",
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [resources, searchTerm, selectedCategory]);

    const hasActiveFilters = searchTerm.trim().length > 0 || selectedCategory !== "All";
    const emptyMessage = hasActiveFilters
        ? "No resources match your search/category filters."
        : "No resources yet.";

    if (loading) {
        return (
            <div className="relative z-10 bg-black text-white flex items-center justify-center min-h-screen">
                <p className="text-lg">Loading resources...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white px-4 py-8 sm:px-8">
            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
                <NavBar
                    title="Study Share"
                    subtitle="Add, browse, and manage your learning resources."
                    actions={
                        <>
                            <button
                                onClick={() => navigate("/profile")}
                                className="w-full rounded-xl bg-gray-800 px-6 py-3 font-medium text-white transition hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
                            >
                                Profile
                            </button>
                            <button
                                onClick={logout}
                                className="w-full rounded-xl bg-gray-800 px-6 py-3 font-medium text-white transition hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
                            >
                                Logout
                            </button>
                        </>
                    }
                />

                {notice && (
                    <div
                        role={notice.type === "error" ? "alert" : "status"}
                        className={`flex flex-col items-start gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                            notice.type === "error"
                                ? "border-red-300 bg-red-100 text-red-900"
                                : "border-green-300 bg-green-100 text-green-900"
                        }`}
                    >
                        <p className="text-sm font-medium">{notice.message}</p>
                        <button
                            type="button"
                            onClick={dismissNotice}
                            className="rounded-md border border-current px-2 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(320px,1fr)_minmax(0,1.4fr)]">
                    <section aria-label="Create resource">
                        <ResourceForm
                            form={form}
                            errors={formErrors}
                            onFieldChange={handleFieldChange}
                            onSubmit={submitResource}
                        />
                    </section>

                    <section aria-label="Resource list">
                        <div className="mb-4 rounded-2xl border border-gray-700 bg-gray-900/80 p-4 shadow-lg">
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="resource-search" className="text-sm text-gray-300">
                                        Search resources
                                    </label>
                                    <input
                                        id="resource-search"
                                        type="search"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search title, description, subject, or author..."
                                        className="rounded-lg border border-gray-600 bg-black/40 px-3 py-3 text-base text-white placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="resource-category" className="text-sm text-gray-300">
                                        Category
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="resource-category"
                                            value={selectedCategory}
                                            onChange={(event) => setSelectedCategory(event.target.value)}
                                            className="w-full appearance-none rounded-lg border border-gray-600 bg-black/40 px-3 py-3 pr-10 text-base text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                        >
                                            {categories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 20 20"
                                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                                        >
                                            <path
                                                d="M5 7.5L10 12.5L15 7.5"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSelectedCategory("All");
                                        }}
                                        className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </div>

                        <ResourceList
                            resources={filteredResources}
                            currentUserId={currentUserId}
                            deletingResourceId={deletingResourceId}
                            onRequestDelete={requestDeleteResource}
                            emptyMessage={emptyMessage}
                        />
                    </section>
                </div>
            </div>

            {deleteCandidate && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
                    <div
                        ref={deleteDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-resource-title"
                        aria-describedby="delete-resource-description"
                        tabIndex={-1}
                        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl focus:outline-none"
                    >
                        <h2 id="delete-resource-title" className="text-xl font-semibold text-white">Delete Resource?</h2>
                        <p id="delete-resource-description" className="mt-3 text-base leading-relaxed text-gray-200">
                            This will permanently remove{" "}
                            <span className="font-semibold text-white">{deleteCandidate.title}</span>.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelDeleteResource}
                                className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteResource}
                                disabled={deletingResourceId.length > 0}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                {deletingResourceId.length > 0 ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;
