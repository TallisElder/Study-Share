import { getResourceId, isResourceOwner } from "../../handlers/resourceOwnership.js";
import ResourceCard from "../resourceCard.jsx";

function ResourceList({
    resources,
    currentUserId,
    deletingResourceId,
    onRequestDelete,
    emptyMessage = "No resources yet.",
}) {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Available resources</h2>
            {resources.length === 0 && (
                <p className="rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-3 text-gray-300">
                    {emptyMessage}
                </p>
            )}
            {resources.length > 0 && (
                <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                    {resources.map((resource) => (
                        <ResourceCard
                            key={getResourceId(resource)}
                            resource={resource}
                            showAuthor
                            actions={
                                isResourceOwner(resource, currentUserId) ? (
                                    <button
                                        type="button"
                                        onClick={() => onRequestDelete(resource)}
                                        disabled={deletingResourceId === getResourceId(resource)}
                                        className="inline-flex items-center rounded-md border border-red-300 bg-red-100/90 px-3 py-1 text-xs font-semibold text-red-900 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {deletingResourceId === getResourceId(resource) ? "Deleting..." : "Delete"}
                                    </button>
                                ) : null
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ResourceList;
