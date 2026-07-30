// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");
const manageJobsTableBody = document.getElementById("manageJobsTableBody");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let companyJobs = [];
let jobApplicationCounts = {};

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
        alert("Please login to manage your jobs.");
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

    loadManageJobs();
}

// ================================
// FUNCTIONS
// ================================

// Load this company's jobs and the application count for each one
async function loadManageJobs() {
    let allJobsList = await getAllData("jobs");
    companyJobs = filterByField(allJobsList, "companyId", currentUser.companyId);
    await loadApplicationCounts();
    displayManageJobsTable();
}

// Fetch how many applications each job has received
async function loadApplicationCounts() {
    jobApplicationCounts = {};

    let allApplications = await getAllData("applications");

    companyJobs.forEach(function (job) {
        jobApplicationCounts[job.id] = filterByField(allApplications, "jobId", job.id).length;
    });
}

// Build the HTML for one row of the manage jobs table
function createManageJobRowHTML(job) {
    let applicationCount = jobApplicationCounts[job.id] || 0;
    let statusClass = job.status === "Active" ? "status-active" : "status-paused";
    let toggleLabel = job.status === "Active" ? "Pause" : "Activate";

    return `
        <tr>
            <td>${job.title}</td>
            <td><a href="view-applicants.html?jobId=${job.id}" class="view-application-btn">${applicationCount} Applications</a></td>
            <td><span class="status-badge ${statusClass}">${job.status}</span></td>
            <td class="table-actions">
                <button class="table-action-link" data-action="edit" data-job-id="${job.id}">Edit</button>
                <button class="table-action-link" data-action="toggle" data-job-id="${job.id}">${toggleLabel}</button>
                <button class="table-action-link danger-link" data-action="delete" data-job-id="${job.id}">Delete</button>
            </td>
        </tr>
    `;
}

// Render the jobs table, or a placeholder message if the employer has no jobs yet
function displayManageJobsTable() {
    manageJobsTableBody.innerHTML = "";

    if (companyJobs.length === 0) {
        manageJobsTableBody.innerHTML = "<tr><td colspan='4' class='no-jobs-text'>You haven't posted any jobs yet.</td></tr>";
        return;
    }

    companyJobs.forEach(function (job) {
        manageJobsTableBody.innerHTML += createManageJobRowHTML(job);
    });

    attachTableActionListeners();
}

// Attach click listeners to the Edit, Pause/Activate, and Delete buttons
function attachTableActionListeners() {
    document.querySelectorAll("[data-action='edit']").forEach(function (button) {
        button.addEventListener("click", handleEditJob);
    });

    document.querySelectorAll("[data-action='toggle']").forEach(function (button) {
        button.addEventListener("click", handleToggleJobStatus);
    });

    document.querySelectorAll("[data-action='delete']").forEach(function (button) {
        button.addEventListener("click", handleDeleteJob);
    });
}

// Go to the Post Job page in edit mode for this job
function handleEditJob(event) {
    let jobId = event.currentTarget.dataset.jobId;
    window.location.href = `post-job.html?id=${jobId}`;
}

// Switch a job between Active and Paused
async function handleToggleJobStatus(event) {
    let jobId = event.currentTarget.dataset.jobId;
    let job = companyJobs.find(function (companyJob) {
        return idsMatch(companyJob.id, jobId);
    });

    let updatedJob = {
        ...job,
        status: job.status === "Active" ? "Paused" : "Active"
    };

    let savedJob = await updateData("jobs", jobId, updatedJob);

    if (savedJob) {
        loadManageJobs();
    }
}

// Delete a job after the user confirms
async function handleDeleteJob(event) {
    let jobId = event.currentTarget.dataset.jobId;
    let confirmDelete = window.confirm("Are you sure you want to delete this job? This cannot be undone.");

    if (!confirmDelete) {
        return;
    }

    let deleted = await deleteData("jobs", jobId);

    if (deleted) {
        loadManageJobs();
    }
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
