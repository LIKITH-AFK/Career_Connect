// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");
const applicationsTableBody = document.getElementById("applicationsTableBody");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let allJobs = [];
let allCompanies = [];
let applicationsList = [];

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
        alert("Please login to view your applications.");
        window.location.href = "login.html";
        return;
    }

    sidebarUserName.textContent = currentUser.name;
    sidebarAvatar.textContent = currentUser.name.charAt(0);

    loadApplications();
}

// ================================
// FUNCTIONS
// ================================

// Load the current user's applications along with the related jobs and companies
async function loadApplications() {
    let allApplications = await getAllData("applications");
    allJobs = await getAllData("jobs");
    allCompanies = await getAllData("companies");

    applicationsList = filterByField(allApplications, "userId", currentUser.id);

    sortApplicationsByDate();
    displayApplications();
}

// Show the most recently applied jobs first
function sortApplicationsByDate() {
    applicationsList.sort(function (a, b) {
        return new Date(b.appliedDate) - new Date(a.appliedDate);
    });
}

// Find a job object by its id
function getJobById(jobId) {
    return allJobs.find(function (job) {
        return idsMatch(job.id, jobId);
    });
}

// Find a company object by its id
function getCompanyById(companyId) {
    return allCompanies.find(function (company) {
        return idsMatch(company.id, companyId);
    });
}

// Turn a status like "Interview Scheduled" into a CSS class like "status-interview-scheduled"
function getStatusBadgeClass(status) {
    let slug = status.toLowerCase().split(" ").join("-");
    return "status-" + slug;
}

// Build one table row for an application
function createApplicationRowHTML(application) {
    let job = getJobById(application.jobId);

    if (!job) {
        return "";
    }

    let company = getCompanyById(job.companyId);
    let badgeClass = getStatusBadgeClass(application.status);

    return `
        <tr>
            <td>${job.title}</td>
            <td>${company.name}</td>
            <td>${application.appliedDate}</td>
            <td><span class="status-badge ${badgeClass}">${application.status}</span></td>
            <td><button class="btn btn-outline view-application-btn" data-job-id="${job.id}">View</button></td>
        </tr>
    `;
}

// Render the applications table, or a placeholder message if there are none
function displayApplications() {
    applicationsTableBody.innerHTML = "";

    if (applicationsList.length === 0) {
        applicationsTableBody.innerHTML = "<tr><td colspan='5' class='no-jobs-text'>You haven't applied to any jobs yet.</td></tr>";
        return;
    }

    applicationsList.forEach(function (application) {
        applicationsTableBody.innerHTML += createApplicationRowHTML(application);
    });

    attachViewButtonListeners();
}

// Attach click listeners to the View buttons so each opens its job details page
function attachViewButtonListeners() {
    let viewButtons = document.querySelectorAll(".view-application-btn");

    viewButtons.forEach(function (button) {
        button.addEventListener("click", handleViewApplication);
    });
}

function handleViewApplication(event) {
    let jobId = event.currentTarget.dataset.jobId;
    window.location.href = `job-details.html?id=${jobId}`;
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
