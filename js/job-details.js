// ================================
// DOM ELEMENTS
// ================================
const companyLogoText = document.getElementById("companyLogoText");
const jobTitleText = document.getElementById("jobTitleText");
const companyNameText = document.getElementById("companyNameText");
const jobLocationMetaText = document.getElementById("jobLocationMetaText");
const saveJobButton = document.getElementById("saveJobButton");
const applyNowButton = document.getElementById("applyNowButton");
const salaryText = document.getElementById("salaryText");
const experienceText = document.getElementById("experienceText");
const jobTypeText = document.getElementById("jobTypeText");
const jobDescriptionText = document.getElementById("jobDescriptionText");
const skillsListContainer = document.getElementById("skillsListContainer");

const overviewTabButton = document.getElementById("overviewTabButton");
const companyTabButton = document.getElementById("companyTabButton");
const overviewTabContent = document.getElementById("overviewTabContent");
const companyTabContent = document.getElementById("companyTabContent");
const companyAboutHeading = document.getElementById("companyAboutHeading");
const companyAboutText = document.getElementById("companyAboutText");
const companyIndustryText = document.getElementById("companyIndustryText");
const companyLocationText = document.getElementById("companyLocationText");
const companyWebsiteLink = document.getElementById("companyWebsiteLink");

const applyModalOverlay = document.getElementById("applyModalOverlay");
const modalJobTitle = document.getElementById("modalJobTitle");
const closeModalButton = document.getElementById("closeModalButton");
const cancelApplyButton = document.getElementById("cancelApplyButton");
const applyForm = document.getElementById("applyForm");
const resumeInput = document.getElementById("resumeInput");
const resumeError = document.getElementById("resumeError");
const coverLetterInput = document.getElementById("coverLetterInput");

// ================================
// GLOBAL VARIABLES
// ================================
let currentJob = null;
let currentCompany = null;
let jobId = null;

// ================================
// EVENT LISTENERS
// ================================
saveJobButton.addEventListener("click", handleSaveJobClick);
applyNowButton.addEventListener("click", openApplyModal);
closeModalButton.addEventListener("click", closeApplyModal);
cancelApplyButton.addEventListener("click", closeApplyModal);
applyForm.addEventListener("submit", handleApplyFormSubmit);
overviewTabButton.addEventListener("click", function () {
    switchTab("overview");
});
companyTabButton.addEventListener("click", function () {
    switchTab("company");
});

// ================================
// INITIALIZATION
// ================================
function init() {
    loadJobDetails();
}

// ================================
// FUNCTIONS
// ================================

// Read the job id from the URL, e.g. job-details.html?id=1
function getJobIdFromUrl() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
}

// Fetch the job and its company, then render the page
async function loadJobDetails() {
    jobId = getJobIdFromUrl();
    currentJob = await getDataById("jobs", jobId);

    if (!currentJob) {
        alert("Job not found.");
        window.location.href = "jobs.html";
        return;
    }

    currentCompany = await getDataById("companies", currentJob.companyId);

    if (!currentCompany) {
        alert("This job's company information is missing.");
        window.location.href = "jobs.html";
        return;
    }

    displayJobDetails();
    checkIfJobSaved();
}

// Fill in all the job and company details on the page
function displayJobDetails() {
    companyLogoText.textContent = currentCompany.name.charAt(0);
    jobTitleText.textContent = currentJob.title;
    companyNameText.textContent = currentCompany.name;
    jobLocationMetaText.textContent = currentJob.location + " • " + currentCompany.industry;

    salaryText.textContent = currentJob.salary;
    experienceText.textContent = currentJob.experience;
    jobTypeText.textContent = currentJob.type;

    jobDescriptionText.textContent = currentJob.description;

    skillsListContainer.innerHTML = "";
    currentJob.skills.forEach(function (skill) {
        skillsListContainer.innerHTML += `<span class="skill-tag">${skill}</span>`;
    });

    companyAboutHeading.textContent = "About " + currentCompany.name;
    companyAboutText.textContent = currentCompany.description;
    companyIndustryText.textContent = currentCompany.industry;
    companyLocationText.textContent = currentCompany.location;
    companyWebsiteLink.textContent = currentCompany.website;
    companyWebsiteLink.href = currentCompany.website;

    modalJobTitle.textContent = currentJob.title;
    document.title = currentJob.title + " - CareerConnect";
}

// Switch between the Overview and About Company tabs
function switchTab(tabName) {
    if (tabName === "overview") {
        overviewTabButton.classList.add("active-tab");
        overviewTabContent.classList.add("active-tab");
        companyTabButton.classList.remove("active-tab");
        companyTabContent.classList.remove("active-tab");
    }
    else {
        companyTabButton.classList.add("active-tab");
        companyTabContent.classList.add("active-tab");
        overviewTabButton.classList.remove("active-tab");
        overviewTabContent.classList.remove("active-tab");
    }
}

// Check if the logged in user already saved this job and update the Save button
async function checkIfJobSaved() {
    let loggedInUser = getLoggedInUser();

    if (!loggedInUser) {
        return;
    }

    let existingSavedJob = await findSavedJobRecord(loggedInUser.id, jobId);

    if (existingSavedJob) {
        saveJobButton.classList.add("saved");
        saveJobButton.textContent = "Saved";
    }
}

// Save or remove this job from the logged in user's saved jobs
async function handleSaveJobClick() {
    let loggedInUser = getLoggedInUser();

    if (!loggedInUser) {
        alert("Please login to save this job.");
        window.location.href = "login.html";
        return;
    }

    let existingSavedJob = await findSavedJobRecord(loggedInUser.id, jobId);

    if (existingSavedJob) {
        await deleteData("savedJobs", existingSavedJob.id);
        saveJobButton.classList.remove("saved");
        saveJobButton.textContent = "Save Job";
    }
    else {
        await addData("savedJobs", { userId: loggedInUser.id, jobId: jobId });
        saveJobButton.classList.add("saved");
        saveJobButton.textContent = "Saved";
    }
}

// Open the apply modal (only for logged in users)
function openApplyModal() {
    let loggedInUser = getLoggedInUser();

    if (!loggedInUser) {
        alert("Please login to apply for this job.");
        window.location.href = "login.html";
        return;
    }

    applyModalOverlay.classList.remove("hidden");
}

// Close the apply modal and reset the form
function closeApplyModal() {
    applyModalOverlay.classList.add("hidden");
    applyForm.reset();
    hideError(resumeError);
}

// Validate and submit the job application
async function handleApplyFormSubmit(event) {
    event.preventDefault();

    hideError(resumeError);

    if (resumeInput.files.length === 0) {
        showError(resumeError, "Please attach your resume.");
        return;
    }

    let loggedInUser = getLoggedInUser();
    let resumeFileName = resumeInput.files[0].name;
    let coverLetterValue = coverLetterInput.value.trim();

    let applicationSubmitted = await submitApplication(loggedInUser.id, jobId, resumeFileName, coverLetterValue);

    if (applicationSubmitted) {
        alert("Application submitted successfully!");
        closeApplyModal();
    }
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
