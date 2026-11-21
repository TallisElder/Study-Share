import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
    deleteAccount,
    getAuthenticatedUser,
    handleLogin,
    handleLogout,
    handleRegister,
    updatePassword,
} from "../src/handlers/authHandlers.js";

function mockResponse({ ok, body }) {
    return {
        ok,
        async json() {
            return body;
        },
    };
}

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
});

beforeEach(() => {
    // Handlers log errors for expected failure paths; silence test noise.
    console.error = () => {};
});

test("handleLogin returns success result for valid response", async () => {
    globalThis.fetch = async () => mockResponse({ ok: true, body: { message: "ok" } });

    const result = await handleLogin("alice", "password123");

    assert.equal(result.success, true);
    assert.equal(result.message, "Login successful.");
});

test("handleLogin returns server message on failure", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "Invalid username or password" } });

    const result = await handleLogin("alice", "wrong");

    assert.equal(result.success, false);
    assert.equal(result.message, "Invalid username or password");
});

test("handleLogin returns generic server error when fetch throws", async () => {
    globalThis.fetch = async () => {
        throw new Error("network down");
    };

    const result = await handleLogin("alice", "password123");

    assert.equal(result.success, false);
    assert.equal(result.message, "Server error. Please try again.");
});

test("handleLogin uses auth login endpoint with credentials and payload", async () => {
    let capturedUrl = "";
    let capturedOptions = {};
    globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return mockResponse({ ok: true, body: { message: "ok" } });
    };

    await handleLogin("alice", "password123");

    assert.equal(capturedUrl, "/api/auth/login");
    assert.equal(capturedOptions.method, "POST");
    assert.equal(capturedOptions.credentials, "include");
    assert.deepEqual(JSON.parse(capturedOptions.body), {
        username: "alice",
        password: "password123",
    });
});

test("handleRegister returns success when register and auto-login both succeed", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
        callCount += 1;
        if (callCount === 1) {
            return mockResponse({ ok: true, body: { message: "Registered" } });
        }
        return mockResponse({ ok: true, body: { message: "Login successful" } });
    };

    const result = await handleRegister("alice", "password123");

    assert.equal(callCount, 2);
    assert.equal(result.success, true);
});

test("handleRegister calls register then login endpoints", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
        calls.push({ url, options });
        return mockResponse({ ok: true, body: { message: "ok" } });
    };

    await handleRegister("alice", "password123");

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, "/api/auth/register");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[1].url, "/api/auth/login");
    assert.equal(calls[1].options.method, "POST");
});

test("handleRegister returns failure when register request fails", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "Username already exists" } });

    const result = await handleRegister("alice", "password123");

    assert.equal(result.success, false);
    assert.equal(result.message, "Username already exists");
});

test("handleRegister returns server error message when fetch throws", async () => {
    globalThis.fetch = async () => {
        throw new Error("network down");
    };

    const result = await handleRegister("alice", "password123");

    assert.equal(result.success, false);
    assert.equal(result.message, "Server error. Please try again.");
});

test("handleLogout returns failure payload when server returns error", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "Logout failed from server" } });

    const result = await handleLogout();

    assert.equal(result.success, false);
    assert.equal(result.message, "Logout failed from server");
});

test("handleLogout returns success payload when server returns ok", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: true, body: { message: "Logged out successfully" } });

    const result = await handleLogout();

    assert.equal(result.success, true);
    assert.equal(result.message, "Logged out successfully.");
});

test("handleLogout returns generic server error when fetch throws", async () => {
    globalThis.fetch = async () => {
        throw new Error("network down");
    };

    const result = await handleLogout();

    assert.equal(result.success, false);
    assert.equal(result.message, "Server error. Please try again.");
});

test("getAuthenticatedUser returns null for unauthenticated response", async () => {
    globalThis.fetch = async () => mockResponse({ ok: false, body: {} });

    const result = await getAuthenticatedUser();

    assert.equal(result, null);
});

test("getAuthenticatedUser returns parsed user when authenticated", async () => {
    globalThis.fetch = async () =>
        mockResponse({
            ok: true,
            body: { userId: "user-1", username: "alice" },
        });

    const result = await getAuthenticatedUser();

    assert.deepEqual(result, { userId: "user-1", username: "alice" });
});

test("getAuthenticatedUser returns null when request throws", async () => {
    globalThis.fetch = async () => {
        throw new Error("network down");
    };

    const result = await getAuthenticatedUser();

    assert.equal(result, null);
});

test("updatePassword uses PATCH and returns success payload", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody = "";
    let capturedCredentials = "";
    globalThis.fetch = async (_url, options) => {
        capturedUrl = _url;
        capturedMethod = options.method;
        capturedBody = options.body;
        capturedCredentials = options.credentials;
        return mockResponse({ ok: true, body: { message: "Password updated successfully" } });
    };

    const result = await updatePassword("old-pass", "new-pass-123");

    assert.equal(capturedUrl, "/api/auth/change-password");
    assert.equal(capturedMethod, "PATCH");
    assert.equal(capturedCredentials, "include");
    assert.deepEqual(JSON.parse(capturedBody), {
        currentPassword: "old-pass",
        newPassword: "new-pass-123",
    });
    assert.equal(result.success, true);
});

test("updatePassword returns server message on failure", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "Current password is incorrect" } });

    const result = await updatePassword("wrong-pass", "new-pass-123");

    assert.equal(result.success, false);
    assert.equal(result.message, "Current password is incorrect");
});

test("updatePassword returns generic server error when fetch throws", async () => {
    globalThis.fetch = async () => {
        throw new Error("network down");
    };

    const result = await updatePassword("old-pass", "new-pass-123");

    assert.equal(result.success, false);
    assert.equal(result.message, "Server error. Please try again.");
});

test("deleteAccount uses DELETE and returns success payload", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedCredentials = "";
    globalThis.fetch = async (_url, options) => {
        capturedUrl = _url;
        capturedMethod = options.method;
        capturedCredentials = options.credentials;
        return mockResponse({ ok: true, body: { message: "Account deleted successfully" } });
    };

    const result = await deleteAccount();

    assert.equal(capturedUrl, "/api/auth/delete-account");
    assert.equal(capturedMethod, "DELETE");
    assert.equal(capturedCredentials, "include");
    assert.equal(result.success, true);
});

test("deleteAccount returns server message on failure", async () => {
    globalThis.fetch = async () =>
        mockResponse({ ok: false, body: { message: "Failed to delete account." } });

    const result = await deleteAccount();

    assert.equal(result.success, false);
    assert.equal(result.message, "Failed to delete account.");
});

test("deleteAccount returns generic server error when fetch throws", async () => {
    globalThis.fetch = async () => {
        throw new Error("network down");
    };

    const result = await deleteAccount();

    assert.equal(result.success, false);
    assert.equal(result.message, "Server error. Please try again.");
});
