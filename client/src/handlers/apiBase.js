const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL || "";
const normalizedBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");

export function buildApiUrl(path) {
    if (!path.startsWith("/")) {
        throw new Error(`API path must start with '/': ${path}`);
    }

    return normalizedBaseUrl ? `${normalizedBaseUrl}${path}` : path;
}

