function extractIdValue(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "object") {
        if (typeof value.$oid === "string") {
            return value.$oid;
        }

        if (typeof value.toString === "function") {
            const maybeId = value.toString();
            if (maybeId && maybeId !== "[object Object]") {
                return maybeId;
            }
        }
    }

    return "";
}

export function getResourceId(resource) {
    return extractIdValue(resource?._id);
}

export function isResourceOwner(resource, userId) {
    const resourceOwnerId = extractIdValue(resource?.createdBy);
    const currentUserId = extractIdValue(userId);

    return Boolean(resourceOwnerId) && Boolean(currentUserId) && resourceOwnerId === currentUserId;
}
