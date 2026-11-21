import test, { after } from "node:test";
import assert from "node:assert/strict";
import {
    createResource,
    deleteResource,
    getMyResources,
    getResources,
} from "../src/handlers/resourceHandlers.js";

function mockResponse({ ok, body }) {
    return {
        ok,
        async json() {
            return body;
        },
    };
}

const originalFetch = globalThis.fetch;

after(() => {
    globalThis.fetch = originalFetch;
});

test("getResources returns parsed resources on success", async () => {
    let capturedUrl = "";
    let capturedOptions = {};
    const resources = [{ _id: "1", title: "A" }];
    globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return mockResponse({ ok: true, body: resources });
    };

    const result = await getResources();

    assert.equal(capturedUrl, "/api/resources");
    assert.equal(capturedOptions.credentials, "include");
    assert.deepEqual(result, resources);
});

test("getResources throws a default error message when response is not ok", async () => {
    globalThis.fetch = async () => mockResponse({ ok: false, body: { message: "Bad request" } });

    await assert.rejects(() => getResources(), /Failed to fetch resources/);
});

test("getMyResources requests mine endpoint and returns parsed response", async () => {
    let calledUrl = "";
    let calledOptions = {};
    globalThis.fetch = async (url, options) => {
        calledUrl = url;
        calledOptions = options;
        return mockResponse({ ok: true, body: [{ _id: "mine1" }] });
    };

    const result = await getMyResources();

    assert.equal(calledUrl, "/api/resources/mine");
    assert.equal(calledOptions.credentials, "include");
    assert.equal(result.length, 1);
});

test("createResource throws with server error message", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "All fields are required" } });

    await assert.rejects(
        () =>
            createResource({
                title: "",
                description: "",
                subject: "",
                link: "",
            }),
        /All fields are required/
    );
});

test("createResource posts payload with credentials and returns created object", async () => {
    let capturedUrl = "";
    let capturedOptions = {};
    const payload = {
        title: "Guide",
        description: "A guide",
        subject: "Web",
        link: "https://example.com",
    };
    const created = { _id: "resource-1", ...payload };

    globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return mockResponse({ ok: true, body: created });
    };

    const result = await createResource(payload);

    assert.equal(capturedUrl, "/api/resources/create");
    assert.equal(capturedOptions.method, "POST");
    assert.equal(capturedOptions.credentials, "include");
    assert.equal(capturedOptions.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(capturedOptions.body), payload);
    assert.deepEqual(result, created);
});

test("createResource uses default error message when server response has no message", async () => {
    globalThis.fetch = async () => mockResponse({ ok: false, body: {} });

    await assert.rejects(() => createResource({}), /Failed to create resource/);
});

test("deleteResource throws when server rejects request", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "Unauthorized" } });

    await assert.rejects(() => deleteResource("resource-id"), /Unauthorized/);
});

test("deleteResource sends delete request with credentials and returns true", async () => {
    let capturedUrl = "";
    let capturedOptions = {};
    globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return mockResponse({ ok: true, body: { message: "Deleted" } });
    };

    const result = await deleteResource("resource-id");

    assert.equal(capturedUrl, "/api/resources/resource-id");
    assert.equal(capturedOptions.method, "DELETE");
    assert.equal(capturedOptions.credentials, "include");
    assert.equal(result, true);
});

test("deleteResource uses default error message when server response has no message", async () => {
    globalThis.fetch = async () => mockResponse({ ok: false, body: {} });

    await assert.rejects(() => deleteResource("resource-id"), /Failed to delete resource/);
});
