export function validatePasswordChangeForm(form) {
    const nextErrors = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    };

    const currentPassword = form?.currentPassword || "";
    const newPassword = form?.newPassword || "";
    const confirmPassword = form?.confirmPassword || "";

    if (!currentPassword.trim()) {
        nextErrors.currentPassword = "Current password is required.";
    }

    if (!newPassword.trim()) {
        nextErrors.newPassword = "New password is required.";
    } else if (newPassword.trim().length < 6) {
        nextErrors.newPassword = "New password must be at least 6 characters.";
    }

    if (!confirmPassword.trim()) {
        nextErrors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
        nextErrors.confirmPassword = "New password and confirmation do not match.";
    }

    return nextErrors;
}

export function hasPasswordFormErrors(errors) {
    return Boolean(
        errors.currentPassword || errors.newPassword || errors.confirmPassword
    );
}
