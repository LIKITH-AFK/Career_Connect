// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");
const savedJobsContainer = document.getElementById("savedJobsContainer");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let allCompanies = [];
let savedJobsList = [];

// ================================
// EVENT LISTENERS
// ================================
logoutButton.addEventListener("click", logoutUser);

// ================================
// INITIALIZATION
// ================================
function init() {
    currentUser = getLoggedInUser();

    if (!currentUser) {
        alert("Please login to view your saved jobs.");
        window.location.href = "login.html";
        return;
    }

    sidebarUserName.textContent = currentUser.name;
    sidebarAvatar.textContent = currentUser.name.charAt(0);

    loadSavedJobs();
}

// ================================
// FUNCTIONS
// ================================

// Load the current user's saved job records and their full job details
async function loadSavedJobs() {
    let allSavedJobs = await getAllData("savedJobs");
    let savedJobRecords = filterByField(allSavedJobs, "userId", currentUser.id);
    allCompanies = await getAllData("companies");

    savedJobsList = [];

    for (let i = 0; i < savedJobRecords.length; i++) {
        let job = await getDataById("jobs", savedJobRecords[i].jobId);

        if (job) {
            job.savedRecordId = savedJobRecords[i].id;
            savedJobsList.push(job);
        }
    }

    displaySavedJobs();
}

// Find a company object by its id
function getCompanyById(companyId) {
    return allCompanies.find(function (company) {
        return idsMatch(company.id, companyId);
    });
}

// Build the HTML for one saved job card
function createSavedJobCardHTML(job) {
    let company = getCompanyById(job.companyId);

    if (!company) {
        console.warn("Skipping saved job with no matching company:", job);
        return "";
    }

    let skillTagsHTML = job.skills.map(function (skill) {
        return `<span class="skill-tag">${skill}</span>`;
    }).join("");

    return `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-card-header">
                <div class="company-logo-box">${company.name.charAt(0)}</div>
                <button class="remove-saved-btn" data-saved-id="${job.savedRecordId}">Remove</button>
            </div>
            <h3 class="job-title">${job.title}</h3>
            <p class="job-meta">${company.name} &bull; ${job.location}</p>
            <p class="job-salary">${job.salary}</p>
            <p class="job-experience">${job.experience} &bull; ${job.type}</p>
            <div class="skill-tags">${skillTagsHTML}</div>
        </div>
    `;
}

// Render the saved job cards, or a placeholder message if there are none
function displaySavedJobs() {
    savedJobsContainer.innerHTML = "";

    if (savedJobsList.length === 0) {
        savedJobsContainer.innerHTML = "<p class='no-jobs-text'>You haven't saved any jobs yet.</p>";
        return;
    }

    savedJobsList.forEach(function (job) {
        savedJobsContainer.innerHTML += createSavedJobCardHTML(job);
    });

    attachSavedJobListeners();
}

// Attach click listeners to the freshly rendered cards and remove buttons
function attachSavedJobListeners() {
    let jobCards = document.querySelectorAll(".job-card");
    let removeButtons = document.querySelectorAll(".remove-saved-btn");

    jobCards.forEach(function (card) {
        card.addEventListener("click", handleSavedJobCardClick);
    });

    removeButtons.forEach(function (button) {
        button.addEventListener("click", handleRemoveSavedJob);
    });
}

// Go to the details page for the clicked job
function handleSavedJobCardClick(event) {
    let jobId = event.currentTarget.dataset.jobId;
    window.location.href = `job-details.html?id=${jobId}`;
}

// Remove a job from the saved list
async function handleRemoveSavedJob(event) {
    event.stopPropagation();

    let savedRecordId = event.currentTarget.dataset.savedId;
    await deleteData("savedJobs", savedRecordId);

    loadSavedJobs();
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
