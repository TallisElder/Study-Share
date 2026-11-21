function ResourceCard({
    resource,
    variant = "default",
    showAuthor = false,
    actions,
}) {
    const wrapperClassName =
        variant === "compact"
            ? "rounded-xl border border-gray-700 bg-black/30 p-4"
            : "rounded-2xl border border-gray-700 bg-gray-900/80 p-4 shadow-lg";
    const titleClassName =
        variant === "compact"
            ? "text-base font-semibold text-white"
            : "text-lg font-semibold text-white";
    const subjectClassName =
        variant === "compact"
            ? "mt-1 text-sm text-gray-300"
            : "text-sm font-medium tracking-wide text-gray-300";
    const descriptionClassName =
        variant === "compact"
            ? "mt-2 text-sm text-gray-200"
            : "mt-3 text-gray-200";
    const actionRowClassName =
        variant === "compact"
            ? "mt-3 flex items-center justify-between gap-3"
            : "mt-4 flex items-center justify-between";

    return (
        <article className={wrapperClassName}>
            <h3 className={titleClassName}>{resource.title}</h3>
            <p className={subjectClassName}>{resource.subject}</p>
            {showAuthor && (
                <p className="mt-1 text-xs font-medium text-gray-400">
                    Shared by {resource.createdByUsername || "Unknown user"}
                </p>
            )}
            <p className={descriptionClassName}>{resource.description}</p>
            <div className={actionRowClassName}>
                <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-100 underline underline-offset-2 hover:text-white"
                >
                    View Link
                </a>
                {actions}
            </div>
        </article>
    );
}

export default ResourceCard;
