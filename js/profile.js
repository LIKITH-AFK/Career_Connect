// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");

const profileViewSection = document.getElementById("profileViewSection");
const profileEditSection = document.getElementById("profileEditSection");
const profileAvatar = document.getElementById("profileAvatar");
const profileNameText = document.getElementById("profileNameText");
const profileTaglineText = document.getElementById("profileTaglineText");
const editProfileButton = document.getElementById("editProfileButton");
const profileEmailText = document.getElementById("profileEmailText");
const profilePhoneText = document.getElementById("profilePhoneText");
const profileLocationText = document.getElementById("profileLocationText");
const profileSkillsContainer = document.getElementById("profileSkillsContainer");

const profileEditForm = document.getElementById("profileEditForm");
const editProfilePicInput = document.getElementById("editProfilePicInput");
const editNameInput = document.getElementById("editNameInput");
const editNameError = document.getElementById("editNameError");
const editPhoneInput = document.getElementById("editPhoneInput");
const editLocationInput = document.getElementById("editLocationInput");
const editEducationInput = document.getElementById("editEducationInput");
const editExperienceInput = document.getElementById("editExperienceInput");
const editSkillsInput = document.getElementById("editSkillsInput");
const cancelEditButton = document.getElementById("cancelEditButton");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;

// ================================
// EVENT LISTENERS
// ================================
logoutButton.addEventListener("click", logoutUser);
editProfileButton.addEventListener("click", showEditMode);
cancelEditButton.addEventListener("click", hideEditMode);
profileEditForm.addEventListener("submit", handleProfileEditSubmit);

// ================================
// INITIALIZATION
// ================================
function init() {
    currentUser = getLoggedInUser();

    if (!currentUser) {
        alert("Please login to view your profile.");
        window.location.href = "login.html";
        return;
    }

    displayProfile();
}

// ================================
// FUNCTIONS
// ================================

// Render the sidebar and the read-only profile card from currentUser
function displayProfile() {
    sidebarUserName.textContent = currentUser.name;
    profileNameText.textContent = currentUser.name;
    profileTaglineText.textContent = buildTaglineText();

    profileEmailText.textContent = "Email: " + currentUser.email;
    profilePhoneText.textContent = "Phone: " + (currentUser.phone || "Not provided");
    profileLocationText.textContent = "Location: " + (currentUser.location || "Not provided");

    setAvatarContent(sidebarAvatar);
    setAvatarContent(profileAvatar);

    renderSkillTags();
}

// Combine experience and education into one tagline (e.g. "Fresher | B.Tech")
function buildTaglineText() {
    let parts = [];

    if (currentUser.experience) {
        parts.push(currentUser.experience);
    }

    if (currentUser.education) {
        parts.push(currentUser.education);
    }

    return parts.join(" | ");
}

// Show a profile picture if one is set, otherwise show the user's initial
function setAvatarContent(avatarElement) {
    if (currentUser.profilePic) {
        avatarElement.innerHTML = `<img src="${currentUser.profilePic}" alt="${currentUser.name}">`;
    }
    else {
        avatarElement.textContent = currentUser.name.charAt(0);
    }
}

// Render the skill tags, or a placeholder message if none are set
function renderSkillTags() {
    profileSkillsContainer.innerHTML = "";

    if (!currentUser.skills || currentUser.skills.length === 0) {
        profileSkillsContainer.innerHTML = "<p class='no-jobs-text'>No skills added yet.</p>";
        return;
    }

    currentUser.skills.forEach(function (skill) {
        profileSkillsContainer.innerHTML += `<span class="skill-tag">${skill}</span>`;
    });
}

// Switch to the edit form, pre-filled with the current profile values
function showEditMode() {
    editProfilePicInput.value = currentUser.profilePic || "";
    editNameInput.value = currentUser.name || "";
    editPhoneInput.value = currentUser.phone || "";
    editLocationInput.value = currentUser.location || "";
    editEducationInput.value = currentUser.education || "";
    editExperienceInput.value = currentUser.experience || "";
    editSkillsInput.value = currentUser.skills ? currentUser.skills.join(", ") : "";

    profileViewSection.classList.add("hidden");
    profileEditSection.classList.remove("hidden");
}

// Switch back to the read-only view
function hideEditMode() {
    profileEditSection.classList.add("hidden");
    profileViewSection.classList.remove("hidden");
    hideError(editNameError);
}

// Validate and save the profile changes
async function handleProfileEditSubmit(event) {
    event.preventDefault();

    hideError(editNameError);

    if (!isRequired(editNameInput.value)) {
        showError(editNameError, "Name is required.");
        return;
    }

    let skillsArray = editSkillsInput.value
        .split(",")
        .map(function (skill) {
            return skill.trim();
        })
        .filter(function (skill) {
            return skill !== "";
        });

    let updatedUser = {
        ...currentUser,
        profilePic: editProfilePicInput.value.trim(),
        name: editNameInput.value.trim(),
        phone: editPhoneInput.value.trim(),
        location: editLocationInput.value.trim(),
        education: editEducationInput.value.trim(),
        experience: editExperienceInput.value.trim(),
        skills: skillsArray
    };

    let savedUser = await updateData("users", currentUser.id, updatedUser);

    if (!savedUser) {
        alert("Something went wrong. Please try again.");
        return;
    }

    currentUser = savedUser;
    updateStoredUser(currentUser);
    displayProfile();
    hideEditMode();
    alert("Profile updated successfully!");
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
