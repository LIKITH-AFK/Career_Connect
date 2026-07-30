// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");

const postJobHeading = document.getElementById("postJobHeading");
const postJobForm = document.getElementById("postJobForm");
const postJobSubmitButton = document.getElementById("postJobSubmitButton");
const jobTitleInput = document.getElementById("jobTitleInput");
const jobTitleError = document.getElementById("jobTitleError");
const jobLocationSelect = document.getElementById("jobLocationSelect");
const jobTypeSelect = document.getElementById("jobTypeSelect");
const jobExperienceSelect = document.getElementById("jobExperienceSelect");
const jobSalaryInput = document.getElementById("jobSalaryInput");
const jobSalaryError = document.getElementById("jobSalaryError");
const jobSkillsInput = document.getElementById("jobSkillsInput");
const jobDescriptionTextarea = document.getElementById("jobDescriptionTextarea");
const jobDescriptionError = document.getElementById("jobDescriptionError");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let editingJobId = null;
let originalJobData = null;

// ================================
// EVENT LISTENERS
// ================================
logoutButton.addEventListener("click", logoutUser);
postJobForm.addEventListener("submit", handlePostJobFormSubmit);

// ================================
// INITIALIZATION
// ================================
function init() {
    currentUser = getLoggedInUser();

    if (!currentUser) {
        alert("Please login to post a job.");
        window.location.href = "login.html";
        return;
    }

    if (currentUser.role !== "employer") {
        alert("This page is only available for employer accounts.");
        window.location.href = "jobs.html";
        return;
    }

    if (!currentUser.companyId) {
        alert("Please set up your Company Profile before posting a job.");
        window.location.href = "company-profile.html";
        return;
    }

    sidebarUserName.textContent = currentUser.name;
    sidebarAvatar.textContent = currentUser.name.charAt(0);

    checkEditMode();
}

// ================================
// FUNCTIONS
// ================================

// Check the URL for ?id=... - if present, this page is editing that job instead of creating a new one
function checkEditMode() {
    let urlParams = new URLSearchParams(window.location.search);
    let idParam = urlParams.get("id");

    if (idParam) {
        editingJobId = idParam;
        loadJobForEditing();
    }
}

// Load an existing job's details into the form for editing
async function loadJobForEditing() {
    let job = await getDataById("jobs", editingJobId);

    if (!job) {
        alert("Job not found.");
        window.location.href = "manage-jobs.html";
        return;
    }

    originalJobData = job;

    postJobHeading.textContent = "Edit Job";
    postJobSubmitButton.textContent = "Update Job";

    jobTitleInput.value = job.title;
    jobLocationSelect.value = job.location;
    jobTypeSelect.value = job.type;
    jobExperienceSelect.value = job.experience;
    jobSalaryInput.value = job.salary;
    jobSkillsInput.value = job.skills.join(", ");
    jobDescriptionTextarea.value = job.description;
}

// Check the required fields before submitting
function validatePostJobForm() {
    let isValid = true;

    hideError(jobTitleError);
    hideError(jobSalaryError);
    hideError(jobDescriptionError);

    if (!isRequired(jobTitleInput.value)) {
        showError(jobTitleError, "Job title is required.");
        isValid = false;
    }

    if (!isRequired(jobSalaryInput.value)) {
        showError(jobSalaryError, "Salary is required.");
        isValid = false;
    }

    if (!isRequired(jobDescriptionTextarea.value)) {
        showError(jobDescriptionError, "Description is required.");
        isValid = false;
    }

    return isValid;
}

// Validate and save the job, either creating a new one or updating the one being edited
async function handlePostJobFormSubmit(event) {
    event.preventDefault();

    if (!validatePostJobForm()) {
        return;
    }

    let skillsArray = jobSkillsInput.value
        .split(",")
        .map(function (skill) {
            return skill.trim();
        })
        .filter(function (skill) {
            return skill !== "";
        });

    let jobData = {
        title: jobTitleInput.value.trim(),
        companyId: currentUser.companyId,
        location: jobLocationSelect.value,
        type: jobTypeSelect.value,
        experience: jobExperienceSelect.value,
        salary: jobSalaryInput.value.trim(),
        skills: skillsArray,
        description: jobDescriptionTextarea.value.trim(),
        status: editingJobId ? originalJobData.status : "Active"
    };

    let savedJob;

    if (editingJobId) {
        savedJob = await updateData("jobs", editingJobId, jobData);
    }
    else {
        savedJob = await addData("jobs", jobData);
    }

    if (!savedJob) {
        alert("Something went wrong. Please try again.");
        return;
    }

    alert(editingJobId ? "Job updated successfully!" : "Job posted successfully!");
    window.location.href = "manage-jobs.html";
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
