import test from "node:test";
import assert from "node:assert/strict";
import { buildApiUrl } from "../src/handlers/apiBase.js";

test("buildApiUrl returns same relative path when no base URL is configured", () => {
    const result = buildApiUrl("/api/resources");

    assert.equal(result, "/api/resources");
});

test("buildApiUrl throws when path does not start with slash", () => {
    assert.throws(() => buildApiUrl("api/resources"), /API path must start with '\//);
});
