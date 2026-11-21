export const EMPTY_RESOURCE_FORM = Object.freeze({
    title: "",
    description: "",
    subject: "",
    link: "",
});

export function createEmptyResourceForm() {
    return { ...EMPTY_RESOURCE_FORM };
}

export function updateResourceFormField(form, field, value) {
    return {
        ...form,
        [field]: value,
    };
}

function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isValidIpv4(hostname) {
    const ipv4Pattern =
        /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return ipv4Pattern.test(hostname);
}

export function isValidHttpUrl(value) {
    return getLinkValidationError(value) === "";
}

export function getLinkValidationError(value) {
    if (!hasText(value)) {
        return "Link is required.";
    }

    const normalized = value.trim();
    if (/\s/.test(normalized)) {
        return "Link cannot contain spaces.";
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(normalized);
    } catch {
        return "Enter a complete URL, e.g. https://example.com.";
    }

    const hasValidProtocol =
        parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    if (!hasValidProtocol) {
        return "URL must start with http:// or https://.";
    }

    const hostname = parsedUrl.hostname;
    if (!hostname) {
        return "URL must include a valid domain.";
    }

    const isLocalhost = hostname === "localhost";
    const hasDomainLikeHost = hostname.includes(".");
    const isIpAddress = isValidIpv4(hostname) || hostname.includes(":");

    if (!isLocalhost && !hasDomainLikeHost && !isIpAddress) {
        return "URL must include a valid domain (e.g. example.com).";
    }

    return "";
}

export function validateResourceForm(form) {
    const errors = {};

    if (!hasText(form.title)) {
        errors.title = "Title is required.";
    }

    if (!hasText(form.subject)) {
        errors.subject = "Subject is required.";
    }

    if (!hasText(form.description)) {
        errors.description = "Description is required.";
    }

    if (!hasText(form.link)) {
        errors.link = "Link is required.";
    } else {
        const linkValidationError = getLinkValidationError(form.link);
        if (linkValidationError) {
            errors.link = linkValidationError;
        }
    }

    return errors;
}
