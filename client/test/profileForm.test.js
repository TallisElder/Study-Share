import test from "node:test";
import assert from "node:assert/strict";
import {
    hasPasswordFormErrors,
    validatePasswordChangeForm,
} from "../src/handlers/profileForm.js";

test("validatePasswordChangeForm returns required-field errors", () => {
    const errors = validatePasswordChangeForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    assert.equal(errors.currentPassword, "Current password is required.");
    assert.equal(errors.newPassword, "New password is required.");
    assert.equal(errors.confirmPassword, "Confirm your new password.");
    assert.equal(hasPasswordFormErrors(errors), true);
});

test("validatePasswordChangeForm enforces minimum new password length", () => {
    const errors = validatePasswordChangeForm({
        currentPassword: "old-pass",
        newPassword: "123",
        confirmPassword: "123",
    });

    assert.equal(errors.newPassword, "New password must be at least 6 characters.");
});

test("validatePasswordChangeForm enforces confirmation match", () => {
    const errors = validatePasswordChangeForm({
        currentPassword: "old-pass",
        newPassword: "new-password",
        confirmPassword: "different",
    });

    assert.equal(errors.confirmPassword, "New password and confirmation do not match.");
});

test("validatePasswordChangeForm returns no errors for valid form", () => {
    const errors = validatePasswordChangeForm({
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "new-password",
    });

    assert.deepEqual(errors, {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    assert.equal(hasPasswordFormErrors(errors), false);
});
