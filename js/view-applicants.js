// ================================
// DOM ELEMENTS
// ================================
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const logoutButton = document.getElementById("logoutButton");
const pageHeadingText = document.getElementById("pageHeadingText");
const allTabButton = document.getElementById("allTabButton");
const shortlistedTabButton = document.getElementById("shortlistedTabButton");
const rejectedTabButton = document.getElementById("rejectedTabButton");
const allCountText = document.getElementById("allCountText");
const shortlistedCountText = document.getElementById("shortlistedCountText");
const rejectedCountText = document.getElementById("rejectedCountText");
const applicantsTableBody = document.getElementById("applicantsTableBody");

// ================================
// CONSTANTS
// ================================
const APPLICATION_STATUSES = ["Applied", "Under Review", "Interview Scheduled", "Rejected", "Selected"];

// ================================
// GLOBAL VARIABLES
// ================================
let currentUser = null;
let jobId = null;
let currentJob = null;
let applicantsList = [];
let currentTab = "all";

// ================================
// EVENT LISTENERS
// ================================
logoutButton.addEventListener("click", logoutUser);
allTabButton.addEventListener("click", function () {
    switchTab("all");
});
shortlistedTabButton.addEventListener("click", function () {
    switchTab("shortlisted");
});
rejectedTabButton.addEventListener("click", function () {
    switchTab("rejected");
});

// ================================
// INITIALIZATION
// ================================
function init() {
    currentUser = getLoggedInUser();

    if (!currentUser) {
        alert("Please login to view applicants.");
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

    jobId = getJobIdFromUrl();
    loadApplicants();
}

// ================================
// FUNCTIONS
// ================================

// Read the jobId from the URL, e.g. view-applicants.html?jobId=1
function getJobIdFromUrl() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("jobId");
}

// Load the job (checking it belongs to this employer's company) and its applicants
async function loadApplicants() {
    currentJob = await getDataById("jobs", jobId);

    if (!currentJob || !idsMatch(currentJob.companyId, currentUser.companyId)) {
        alert("You are not authorized to view applicants for this job.");
        window.location.href = "manage-jobs.html";
        return;
    }

    pageHeadingText.textContent = "Applicants - " + currentJob.title;

    let allApplications = await getAllData("applications");
    let applicationRecords = filterByField(allApplications, "jobId", jobId);

    applicantsList = [];

    for (let i = 0; i < applicationRecords.length; i++) {
        let applicant = await getDataById("users", applicationRecords[i].userId);

        if (applicant) {
            applicantsList.push({
                ...applicationRecords[i],
                applicantName: applicant.name,
                applicantEducation: applicant.education,
                applicantExperience: applicant.experience
            });
        }
    }

    updateTabCounts();
    displayApplicants();
}

// Update the All / Shortlisted / Rejected counts shown on the tabs
function updateTabCounts() {
    let shortlistedCount = applicantsList.filter(function (applicant) {
        return applicant.status === "Interview Scheduled" || applicant.status === "Selected";
    }).length;

    let rejectedCount = applicantsList.filter(function (applicant) {
        return applicant.status === "Rejected";
    }).length;

    allCountText.textContent = applicantsList.length;
    shortlistedCountText.textContent = shortlistedCount;
    rejectedCountText.textContent = rejectedCount;
}

// Switch between the All / Shortlisted / Rejected tabs
function switchTab(tabName) {
    currentTab = tabName;

    allTabButton.classList.remove("active-tab");
    shortlistedTabButton.classList.remove("active-tab");
    rejectedTabButton.classList.remove("active-tab");

    if (tabName === "shortlisted") {
        shortlistedTabButton.classList.add("active-tab");
    }
    else if (tabName === "rejected") {
        rejectedTabButton.classList.add("active-tab");
    }
    else {
        allTabButton.classList.add("active-tab");
    }

    displayApplicants();
}

// Return only the applicants that belong to the currently selected tab
function getFilteredApplicants() {
    if (currentTab === "shortlisted") {
        return applicantsList.filter(function (applicant) {
            return applicant.status === "Interview Scheduled" || applicant.status === "Selected";
        });
    }

    if (currentTab === "rejected") {
        return applicantsList.filter(function (applicant) {
            return applicant.status === "Rejected";
        });
    }

    return applicantsList;
}

// Build the <option> list for the status dropdown, with the current status pre-selected
function createStatusOptionsHTML(currentStatus) {
    return APPLICATION_STATUSES.map(function (status) {
        let selectedAttr = status === currentStatus ? "selected" : "";
        return `<option value="${status}" ${selectedAttr}>${status}</option>`;
    }).join("");
}

// Build the HTML for one applicant row
function createApplicantRowHTML(applicant) {
    let educationExperience = [applicant.applicantExperience, applicant.applicantEducation]
        .filter(function (value) {
            return value;
        })
        .join(" | ");

    return `
        <tr>
            <td>${applicant.applicantName}</td>
            <td>${educationExperience || "Not provided"}</td>
            <td>${applicant.resumeFileName || "Not provided"}</td>
            <td>
                <select class="status-select" data-application-id="${applicant.id}">
                    ${createStatusOptionsHTML(applicant.status)}
                </select>
            </td>
        </tr>
    `;
}

// Render the applicants table for the current tab
function displayApplicants() {
    let filteredApplicants = getFilteredApplicants();

    applicantsTableBody.innerHTML = "";

    if (filteredApplicants.length === 0) {
        applicantsTableBody.innerHTML = "<tr><td colspan='4' class='no-jobs-text'>No applicants in this category yet.</td></tr>";
        return;
    }

    filteredApplicants.forEach(function (applicant) {
        applicantsTableBody.innerHTML += createApplicantRowHTML(applicant);
    });

    attachStatusSelectListeners();
}

// Attach change listeners to every status dropdown
function attachStatusSelectListeners() {
    document.querySelectorAll(".status-select").forEach(function (select) {
        select.addEventListener("change", handleStatusChange);
    });
}

// Save the new status for an applicant back to the server
async function handleStatusChange(event) {
    let applicationId = event.currentTarget.dataset.applicationId;
    let newStatus = event.currentTarget.value;

    let applicant = applicantsList.find(function (item) {
        return idsMatch(item.id, applicationId);
    });

    let updatedApplication = {
        userId: applicant.userId,
        jobId: applicant.jobId,
        status: newStatus,
        appliedDate: applicant.appliedDate,
        resumeFileName: applicant.resumeFileName,
        coverLetter: applicant.coverLetter
    };

    let savedApplication = await updateData("applications", applicationId, updatedApplication);

    if (savedApplication) {
        applicant.status = newStatus;
        updateTabCounts();
    }
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
