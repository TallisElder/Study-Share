import { buildApiUrl } from "./apiBase.js";

export async function getResources() {
    const res = await fetch(buildApiUrl("/api/resources"), {
        credentials: "include", // sends httpOnly cookie
    });
    if (!res.ok) throw new Error("Failed to fetch resources");
    return res.json();
}

export async function getMyResources() {
    const res = await fetch(buildApiUrl("/api/resources/mine"), {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch your resources");
    return res.json();
}

export async function createResource(resource) {
    const res = await fetch(buildApiUrl("/api/resources/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(resource),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create resource");
    }
    return res.json();
}

export async function deleteResource(id) {
    const res = await fetch(buildApiUrl(`/api/resources/${id}`), {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete resource");
    }
    return true;
}
