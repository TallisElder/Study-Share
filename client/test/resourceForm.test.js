import test from "node:test";
import assert from "node:assert/strict";
import {
    EMPTY_RESOURCE_FORM,
    createEmptyResourceForm,
    getLinkValidationError,
    isValidHttpUrl,
    updateResourceFormField,
    validateResourceForm,
} from "../src/handlers/resourceForm.js";

test("createEmptyResourceForm returns fresh copy of default form", () => {
    const first = createEmptyResourceForm();
    const second = createEmptyResourceForm();

    assert.deepEqual(first, EMPTY_RESOURCE_FORM);
    assert.deepEqual(second, EMPTY_RESOURCE_FORM);
    assert.notEqual(first, second);
});

test("updateResourceFormField updates one field without mutating original", () => {
    const original = createEmptyResourceForm();
    const updated = updateResourceFormField(original, "title", "React Guide");

    assert.equal(updated.title, "React Guide");
    assert.equal(updated.subject, "");
    assert.equal(original.title, "");
});

test("validateResourceForm returns field errors for missing values", () => {
    const errors = validateResourceForm({
        title: "",
        subject: "   ",
        description: "",
        link: "",
    });

    assert.equal(errors.title, "Title is required.");
    assert.equal(errors.subject, "Subject is required.");
    assert.equal(errors.description, "Description is required.");
    assert.equal(errors.link, "Link is required.");
});

test("validateResourceForm validates URL scheme", () => {
    const invalidUrlErrors = validateResourceForm({
        title: "A",
        subject: "B",
        description: "C",
        link: "ftp://example.com",
    });

    assert.equal(invalidUrlErrors.link, "URL must start with http:// or https://.");

    const validErrors = validateResourceForm({
        title: "A",
        subject: "B",
        description: "C",
        link: "https://example.com",
    });

    assert.deepEqual(validErrors, {});
});

test("validateResourceForm rejects URL without a domain-like hostname", () => {
    const errors = validateResourceForm({
        title: "A",
        subject: "B",
        description: "C",
        link: "https://example",
    });

    assert.equal(errors.link, "URL must include a valid domain (e.g. example.com).");
});

test("isValidHttpUrl accepts localhost and IP hosts for development links", () => {
    assert.equal(isValidHttpUrl("http://localhost:3000/docs"), true);
    assert.equal(isValidHttpUrl("http://127.0.0.1:8080/resource"), true);
});

test("getLinkValidationError returns helpful message for malformed URL", () => {
    assert.equal(
        getLinkValidationError("https:///"),
        "Enter a complete URL, e.g. https://example.com."
    );
});

test("getLinkValidationError rejects links with spaces", () => {
    assert.equal(
        getLinkValidationError("https://example .com"),
        "Link cannot contain spaces."
    );
});
