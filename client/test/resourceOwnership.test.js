import test from "node:test";
import assert from "node:assert/strict";
import { getResourceId, isResourceOwner } from "../src/handlers/resourceOwnership.js";

test("getResourceId handles direct string ids", () => {
    assert.equal(getResourceId({ _id: "abc123" }), "abc123");
});

test("getResourceId handles Mongo-style $oid ids", () => {
    assert.equal(getResourceId({ _id: { $oid: "oid123" } }), "oid123");
});

test("isResourceOwner matches ids across string and object forms", () => {
    const resource = {
        createdBy: { $oid: "user-1" },
    };

    assert.equal(isResourceOwner(resource, "user-1"), true);
    assert.equal(isResourceOwner(resource, "user-2"), false);
});

test("isResourceOwner returns false when ids are missing", () => {
    assert.equal(isResourceOwner({}, "user-1"), false);
    assert.equal(isResourceOwner({ createdBy: "user-1" }, ""), false);
});
