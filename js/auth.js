// ================================
// DOM ELEMENTS
// ================================
const loginForm = document.getElementById("loginForm");
const loginEmailInput = document.getElementById("loginEmailInput");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const loginEmailError = document.getElementById("loginEmailError");
const loginPasswordError = document.getElementById("loginPasswordError");
const loginFormError = document.getElementById("loginFormError");
const rememberMeCheckbox = document.getElementById("rememberMeCheckbox");

const signupForm = document.getElementById("signupForm");
const signupNameInput = document.getElementById("signupNameInput");
const signupEmailInput = document.getElementById("signupEmailInput");
const signupPasswordInput = document.getElementById("signupPasswordInput");
const signupConfirmPasswordInput = document.getElementById("signupConfirmPasswordInput");
const signupNameError = document.getElementById("signupNameError");
const signupEmailError = document.getElementById("signupEmailError");
const signupPasswordError = document.getElementById("signupPasswordError");
const signupConfirmPasswordError = document.getElementById("signupConfirmPasswordError");
const signupFormError = document.getElementById("signupFormError");
const roleRadioButtons = document.querySelectorAll("input[name='role']");

const togglePasswordButton = document.getElementById("togglePasswordButton");

// ================================
// CONSTANTS
// ================================
const DEFAULT_ROLE = "jobseeker";

// ================================
// GLOBAL VARIABLES
// ================================
let isPasswordVisible = false;

// ================================
// EVENT LISTENERS
// ================================
if (loginForm) {
    loginForm.addEventListener("submit", handleLoginFormSubmit);
}

if (signupForm) {
    signupForm.addEventListener("submit", handleSignupFormSubmit);
}

if (togglePasswordButton) {
    togglePasswordButton.addEventListener("click", handlePasswordToggle);
}

// ================================
// INITIALIZATION
// ================================
function init() {
    checkRememberedUser();
}

// ================================
// FUNCTIONS
// ================================

// If a user is already logged in (remembered or this session), skip straight past the login/signup page
function checkRememberedUser() {
    let loggedInUser = localStorage.getItem("loggedInUser") || sessionStorage.getItem("loggedInUser");

    if (loggedInUser) {
        let user = JSON.parse(loggedInUser);
        redirectAfterAuth(user);
    }
}

// Show or hide the password field text
function handlePasswordToggle() {
    let passwordField = togglePasswordButton.closest(".password-field").querySelector("input");

    if (isPasswordVisible) {
        passwordField.type = "password";
        togglePasswordButton.textContent = "Show";
    }
    else {
        passwordField.type = "text";
        togglePasswordButton.textContent = "Hide";
    }

    isPasswordVisible = !isPasswordVisible;
}

// Validate and submit the login form
async function handleLoginFormSubmit(event) {
    event.preventDefault();

    hideError(loginEmailError);
    hideError(loginPasswordError);
    hideError(loginFormError);

    let emailValue = loginEmailInput.value.trim();
    let passwordValue = loginPasswordInput.value;
    let isFormValid = true;

    if (!isRequired(emailValue) || !isValidEmail(emailValue)) {
        showError(loginEmailError, "Please enter a valid email address.");
        isFormValid = false;
    }

    if (!isRequired(passwordValue)) {
        showError(loginPasswordError, "Password is required.");
        isFormValid = false;
    }

    if (!isFormValid) {
        return;
    }

    let users = await getAllData("users");
    let matchedUser = users.find(function (user) {
        return user.email === emailValue && user.password === passwordValue;
    });

    if (!matchedUser) {
        showError(loginFormError, "Incorrect email or password.");
        return;
    }

    saveLoggedInUser(matchedUser, rememberMeCheckbox.checked);
    redirectAfterAuth(matchedUser);
}

// Validate and submit the signup form
async function handleSignupFormSubmit(event) {
    event.preventDefault();

    hideError(signupNameError);
    hideError(signupEmailError);
    hideError(signupPasswordError);
    hideError(signupConfirmPasswordError);
    hideError(signupFormError);

    let nameValue = signupNameInput.value.trim();
    let emailValue = signupEmailInput.value.trim();
    let passwordValue = signupPasswordInput.value;
    let confirmPasswordValue = signupConfirmPasswordInput.value;
    let selectedRole = DEFAULT_ROLE;
    let isFormValid = true;

    roleRadioButtons.forEach(function (radioButton) {
        if (radioButton.checked) {
            selectedRole = radioButton.value;
        }
    });

    if (!isRequired(nameValue)) {
        showError(signupNameError, "Name is required.");
        isFormValid = false;
    }

    if (!isRequired(emailValue) || !isValidEmail(emailValue)) {
        showError(signupEmailError, "Please enter a valid email address.");
        isFormValid = false;
    }

    if (!isValidPassword(passwordValue)) {
        showError(signupPasswordError, "Password must be at least 8 characters.");
        isFormValid = false;
    }

    if (!doPasswordsMatch(passwordValue, confirmPasswordValue)) {
        showError(signupConfirmPasswordError, "Passwords do not match.");
        isFormValid = false;
    }

    if (!isFormValid) {
        return;
    }

    let existingUsers = await getAllData("users");
    let emailAlreadyUsed = existingUsers.some(function (user) {
        return user.email === emailValue;
    });

    if (emailAlreadyUsed) {
        showError(signupFormError, "An account with this email already exists.");
        return;
    }

    let newUser = {
        name: nameValue,
        email: emailValue,
        password: passwordValue,
        role: selectedRole,
        profilePic: "",
        phone: "",
        location: "",
        skills: [],
        education: "",
        experience: ""
    };

    let createdUser = await addData("users", newUser);

    if (!createdUser) {
        showError(signupFormError, "Something went wrong. Please try again.");
        return;
    }

    saveLoggedInUser(createdUser, false);
    redirectAfterAuth(createdUser);
}

// Save the logged in user. Remember Me uses localStorage (stays after the browser closes),
// otherwise sessionStorage is used (cleared when the tab closes)
function saveLoggedInUser(user, rememberMe) {
    if (rememberMe) {
        localStorage.setItem("loggedInUser", JSON.stringify(user));
    }
    else {
        sessionStorage.setItem("loggedInUser", JSON.stringify(user));
    }
}

// Send the user to the right page after logging in, based on their role
function redirectAfterAuth(user) {
    if (user.role === "employer") {
        window.location.href = "employer-dashboard.html";
    }
    else {
        window.location.href = "jobs.html";
    }
}

// Clear the session and send the user back to the login page (called from other pages)
function logoutUser() {
    localStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
