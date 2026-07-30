// ================================
// FUNCTIONS
// ================================

// Check that a text value is not empty
function isRequired(value) {
    return value.trim() !== "";
}

// Check that an email looks valid (something@something.something)
function isValidEmail(email) {
    let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Check that a password is at least 8 characters long
function isValidPassword(password) {
    return password.length >= 8;
}

// Check that password and confirm password match
function doPasswordsMatch(password, confirmPassword) {
    return password === confirmPassword;
}

// Show an error message under a form field
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

// Hide an error message under a form field
function hideError(errorElement) {
    errorElement.textContent = "";
    errorElement.style.display = "none";
}
