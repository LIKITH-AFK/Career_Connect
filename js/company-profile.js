// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");

const companyViewSection = document.getElementById("companyViewSection");
const companyLogoText = document.getElementById("companyLogoText");
const companyNameHeading = document.getElementById("companyNameHeading");
const companySubtitleText = document.getElementById("companySubtitleText");
const editCompanyButton = document.getElementById("editCompanyButton");
const companyWebsiteLink = document.getElementById("companyWebsiteLink");
const companyAboutText = document.getElementById("companyAboutText");
const openPositionsContainer = document.getElementById("openPositionsContainer");

const companyEditSection = document.getElementById("companyEditSection");
const companyFormHeading = document.getElementById("companyFormHeading");
const companyEditForm = document.getElementById("companyEditForm");
const companyNameInput = document.getElementById("companyNameInput");
const companyNameError = document.getElementById("companyNameError");
const companyIndustryInput = document.getElementById("companyIndustryInput");
const companyLocationInput = document.getElementById("companyLocationInput");
const companyWebsiteInput = document.getElementById("companyWebsiteInput");
const companyDescriptionTextarea = document.getElementById("companyDescriptionTextarea");
const cancelCompanyEditButton = document.getElementById("cancelCompanyEditButton");
const companyFormSubmitButton = document.getElementById("companyFormSubmitButton");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let currentCompany = null;
let companyJobs = [];

// ================================
// EVENT LISTENERS
// ================================
logoutButton.addEventListener("click", logoutUser);
editCompanyButton.addEventListener("click", showEditMode);
cancelCompanyEditButton.addEventListener("click", hideEditMode);
companyEditForm.addEventListener("submit", handleCompanyFormSubmit);

// ================================
// INITIALIZATION
// ================================
function init() {
    currentUser = getLoggedInUser();

    if (!currentUser) {
        alert("Please login to manage your company profile.");
        window.location.href = "login.html";
        return;
    }

    if (currentUser.role !== "employer") {
        alert("This page is only available for employer accounts.");
        window.location.href = "jobs.html";
        return;
    }

    sidebarUserName.textContent = currentUser.name;
    sidebarAvatar.textContent = currentUser.name.charAt(0);

    loadCompanyProfile();
}

// ================================
// FUNCTIONS
// ================================

// Load the employer's company, or switch to create mode if they don't have one yet
async function loadCompanyProfile() {
    if (!currentUser.companyId) {
        showCreateMode();
        return;
    }

    currentCompany = await getDataById("companies", currentUser.companyId);

    if (!currentCompany) {
        showCreateMode();
        return;
    }

    let allJobsList = await getAllData("jobs");
    companyJobs = filterByField(allJobsList, "companyId", currentUser.companyId);
    displayCompanyView();
}

// Show the form for setting up a brand new company profile
function showCreateMode() {
    companyFormHeading.textContent = "Set Up Your Company Profile";
    companyFormSubmitButton.textContent = "Create Company Profile";
    cancelCompanyEditButton.classList.add("hidden");

    companyViewSection.classList.add("hidden");
    companyEditSection.classList.remove("hidden");
}

// Show the read-only company view with its open positions
function displayCompanyView() {
    companyLogoText.textContent = currentCompany.name.charAt(0);
    companyNameHeading.textContent = currentCompany.name;
    companySubtitleText.textContent = currentCompany.industry + " • " + currentCompany.location;
    companyWebsiteLink.textContent = currentCompany.website;
    companyWebsiteLink.href = currentCompany.website;
    companyAboutText.textContent = currentCompany.description;

    displayOpenPositions();

    companyViewSection.classList.remove("hidden");
    companyEditSection.classList.add("hidden");
}

// Render the list of this company's open job postings
function displayOpenPositions() {
    openPositionsContainer.innerHTML = "";

    if (companyJobs.length === 0) {
        openPositionsContainer.innerHTML = "<p class='no-jobs-text'>No open positions posted yet.</p>";
        return;
    }

    companyJobs.forEach(function (job) {
        openPositionsContainer.innerHTML += `
            <div class="open-position-item">
                <span class="open-position-title">${job.title}</span>
                <a href="job-details.html?id=${job.id}" class="view-application-btn">View</a>
            </div>
        `;
    });
}

// Switch to edit mode, pre-filled with the current company details
function showEditMode() {
    companyFormHeading.textContent = "Edit Company Profile";
    companyFormSubmitButton.textContent = "Save Changes";
    cancelCompanyEditButton.classList.remove("hidden");

    companyNameInput.value = currentCompany.name;
    companyIndustryInput.value = currentCompany.industry;
    companyLocationInput.value = currentCompany.location;
    companyWebsiteInput.value = currentCompany.website;
    companyDescriptionTextarea.value = currentCompany.description;

    companyViewSection.classList.add("hidden");
    companyEditSection.classList.remove("hidden");
}

// Cancel out of edit mode back to the read-only view
function hideEditMode() {
    companyEditSection.classList.add("hidden");
    companyViewSection.classList.remove("hidden");
    hideError(companyNameError);
}

// Check the required fields before submitting
function validateCompanyForm() {
    hideError(companyNameError);

    if (!isRequired(companyNameInput.value)) {
        showError(companyNameError, "Company name is required.");
        return false;
    }

    return true;
}

// Create a brand new company (linking it to this employer) or save changes to an existing one
async function handleCompanyFormSubmit(event) {
    event.preventDefault();

    if (!validateCompanyForm()) {
        return;
    }

    let companyData = {
        name: companyNameInput.value.trim(),
        industry: companyIndustryInput.value.trim(),
        location: companyLocationInput.value.trim(),
        website: companyWebsiteInput.value.trim(),
        logo: "",
        description: companyDescriptionTextarea.value.trim()
    };

    if (currentUser.companyId) {
        let updatedCompany = await updateData("companies", currentUser.companyId, companyData);

        if (!updatedCompany) {
            alert("Something went wrong. Please try again.");
            return;
        }

        currentCompany = updatedCompany;
        let allJobsList = await getAllData("jobs");
        companyJobs = filterByField(allJobsList, "companyId", currentUser.companyId);
        displayCompanyView();
        alert("Company profile updated successfully!");
    }
    else {
        let createdCompany = await addData("companies", companyData);

        if (!createdCompany) {
            alert("Something went wrong. Please try again.");
            return;
        }

        let updatedUser = { ...currentUser, companyId: createdCompany.id };
        let savedUser = await updateData("users", currentUser.id, updatedUser);

        currentUser = savedUser;
        updateStoredUser(currentUser);
        currentCompany = createdCompany;
        companyJobs = [];

        displayCompanyView();
        alert("Company profile created! You can now post jobs.");
    }
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
