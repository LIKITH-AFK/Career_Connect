// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");
const activeJobsStatNumber = document.getElementById("activeJobsStatNumber");
const totalApplicationsStatNumber = document.getElementById("totalApplicationsStatNumber");
const shortlistedStatNumber = document.getElementById("shortlistedStatNumber");
const applicationsChartContainer = document.getElementById("applicationsChartContainer");

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let companyJobs = [];
let companyApplications = [];

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
        alert("Please login to view the employer dashboard.");
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

    loadDashboardData();
}

// ================================
// FUNCTIONS
// ================================

// Load this employer's company jobs and every application against those jobs
async function loadDashboardData() {
    let allJobsList = await getAllData("jobs");
    companyJobs = filterByField(allJobsList, "companyId", currentUser.companyId);
    companyApplications = await getCompanyApplications();

    displayStats();
    displayApplicationsChart();
}

// Collect all applications for every job that belongs to this company
async function getCompanyApplications() {
    let allApplications = await getAllData("applications");

    return allApplications.filter(function (application) {
        return companyJobs.some(function (job) {
            return idsMatch(job.id, application.jobId);
        });
    });
}

// Fill in the three stat cards
function displayStats() {
    let activeJobsCount = companyJobs.filter(function (job) {
        return job.status === "Active";
    }).length;

    let shortlistedCount = companyApplications.filter(function (application) {
        return application.status === "Interview Scheduled" || application.status === "Selected";
    }).length;

    activeJobsStatNumber.textContent = activeJobsCount;
    totalApplicationsStatNumber.textContent = companyApplications.length;
    shortlistedStatNumber.textContent = shortlistedCount;
}

// Count how many applications belong to one job
function getApplicationCountForJob(jobId) {
    return companyApplications.filter(function (application) {
        return idsMatch(application.jobId, jobId);
    }).length;
}

// Find the highest per-job application count, used to scale the bar heights
function getMaxApplicationCount() {
    let maxCount = 0;

    companyJobs.forEach(function (job) {
        let count = getApplicationCountForJob(job.id);

        if (count > maxCount) {
            maxCount = count;
        }
    });

    return maxCount;
}

// Build the HTML for one bar in the chart
function createBarHTML(job, count, heightPercent) {
    return `
        <div class="bar-chart-item">
            <p class="bar-chart-value">${count}</p>
            <div class="bar-chart-bar" style="height: ${heightPercent}%;"></div>
            <p class="bar-chart-label">${job.title}</p>
        </div>
    `;
}

// Render a simple bar per job showing how many applications it has received
function displayApplicationsChart() {
    applicationsChartContainer.innerHTML = "";

    if (companyJobs.length === 0) {
        applicationsChartContainer.innerHTML = "<p class='no-jobs-text'>Post a job to see application data here.</p>";
        return;
    }

    let maxCount = getMaxApplicationCount();

    companyJobs.forEach(function (job) {
        let jobApplicationCount = getApplicationCountForJob(job.id);
        let barHeightPercent = maxCount === 0 ? 4 : (jobApplicationCount / maxCount) * 100;

        applicationsChartContainer.innerHTML += createBarHTML(job, jobApplicationCount, barHeightPercent);
    });
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
