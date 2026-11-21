import { useEffect, useState } from "react";
import { getLinkValidationError } from "../../handlers/resourceForm.js";

const SUBJECT_CATEGORIES = [
    "Web Development",
    "Programming Fundamentals",
    "Databases",
    "Algorithms",
    "Cyber Security",
    "AI and Machine Learning",
    "Software Engineering",
    "UI/UX Design",
    "Cloud and DevOps",
];

function ResourceForm({ form, errors, onFieldChange, onSubmit }) {
    const [isCustomSubject, setIsCustomSubject] = useState(false);
    const titleHasError = Boolean(errors?.title);
    const subjectHasError = Boolean(errors?.subject);
    const descriptionHasError = Boolean(errors?.description);
    const normalizedLink = form.link.trim();
    const linkErrorMessage = normalizedLink
        ? getLinkValidationError(normalizedLink)
        : (errors?.link || "");
    const linkHasError = Boolean(linkErrorMessage);
    const selectedSubjectCategory = isCustomSubject ? "__custom__" : form.subject;

    useEffect(() => {
        if (!form.subject && !form.title && !form.description && !form.link) {
            setIsCustomSubject(false);
            return;
        }

        if (SUBJECT_CATEGORIES.includes(form.subject)) {
            setIsCustomSubject(false);
            return;
        }

        if (form.subject) {
            setIsCustomSubject(true);
        }
    }, [form.subject, form.title, form.description, form.link]);

    const handleSubjectCategoryChange = (event) => {
        const selectedValue = event.target.value;

        if (selectedValue === "__custom__") {
            setIsCustomSubject(true);
            onFieldChange("subject", "");
            return;
        }

        setIsCustomSubject(false);
        onFieldChange("subject", selectedValue);
    };

    return (
        <form
            onSubmit={onSubmit}
            className="w-full rounded-2xl border border-gray-700 bg-gray-900/80 p-5 shadow-lg backdrop-blur"
            noValidate
        >
            <h2 className="mb-4 text-xl font-semibold">Create a resource</h2>

            <div className="mb-3 flex flex-col gap-2">
                <label htmlFor="resource-title" className="text-sm tracking-wide text-gray-300">
                    TITLE
                </label>
                <input
                    id="resource-title"
                    type="text"
                    placeholder="e.g. React Hooks Guide"
                    value={form.title}
                    onChange={(event) => onFieldChange("title", event.target.value)}
                    className={`rounded-lg border bg-black/40 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        titleHasError ? "border-red-400" : "border-gray-600"
                    }`}
                    aria-invalid={titleHasError}
                    aria-describedby={titleHasError ? "resource-title-error" : undefined}
                />
                {titleHasError && (
                    <p id="resource-title-error" className="text-sm text-red-300">
                        {errors.title}
                    </p>
                )}
            </div>

            <div className="mb-3 flex flex-col gap-2">
                <label htmlFor="resource-subject" className="text-sm tracking-wide text-gray-300">
                    SUBJECT
                </label>
                <div className="relative">
                    <select
                        id="resource-subject"
                        value={selectedSubjectCategory}
                        onChange={handleSubjectCategoryChange}
                        className={`w-full appearance-none rounded-lg border bg-black/40 px-3 py-2 pr-10 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                            subjectHasError ? "border-red-400" : "border-gray-600"
                        }`}
                        aria-invalid={subjectHasError}
                        aria-describedby={subjectHasError ? "resource-subject-error" : undefined}
                    >
                        <option value="">Select a category</option>
                        {SUBJECT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                        <option value="__custom__">Other (custom)</option>
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
                {isCustomSubject && (
                    <input
                        id="resource-subject-custom"
                        type="text"
                        placeholder="Enter custom subject"
                        value={form.subject}
                        onChange={(event) => onFieldChange("subject", event.target.value)}
                        className={`rounded-lg border bg-black/40 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                            subjectHasError ? "border-red-400" : "border-gray-600"
                        }`}
                        aria-invalid={subjectHasError}
                        aria-describedby={subjectHasError ? "resource-subject-error" : undefined}
                    />
                )}
                {subjectHasError && (
                    <p id="resource-subject-error" className="text-sm text-red-300">
                        {errors.subject}
                    </p>
                )}
            </div>

            <div className="mb-3 flex flex-col gap-2">
                <label htmlFor="resource-description" className="text-sm tracking-wide text-gray-300">
                    DESCRIPTION
                </label>
                <textarea
                    id="resource-description"
                    placeholder="What is this resource useful for?"
                    value={form.description}
                    onChange={(event) => onFieldChange("description", event.target.value)}
                    className={`min-h-28 rounded-lg border bg-black/40 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        descriptionHasError ? "border-red-400" : "border-gray-600"
                    }`}
                    aria-invalid={descriptionHasError}
                    aria-describedby={descriptionHasError ? "resource-description-error" : undefined}
                />
                {descriptionHasError && (
                    <p id="resource-description-error" className="text-sm text-red-300">
                        {errors.description}
                    </p>
                )}
            </div>

            <div className="mb-5 flex flex-col gap-2">
                <label htmlFor="resource-link" className="text-sm tracking-wide text-gray-300">
                    LINK
                </label>
                <input
                    id="resource-link"
                    type="url"
                    placeholder="https://..."
                    value={form.link}
                    onChange={(event) => onFieldChange("link", event.target.value)}
                    className={`rounded-lg border bg-black/40 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        linkHasError ? "border-red-400" : "border-gray-600"
                    }`}
                    aria-invalid={linkHasError}
                    aria-describedby={linkHasError ? "resource-link-error" : undefined}
                />
                {linkHasError && (
                    <p id="resource-link-error" className="text-sm text-red-300">
                        {linkErrorMessage}
                    </p>
                )}
            </div>

            <button
                type="submit"
                className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-black shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                Create Resource
            </button>
        </form>
    );
}

export default ResourceForm;
