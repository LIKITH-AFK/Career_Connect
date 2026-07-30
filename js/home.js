// ================================
// DOM ELEMENTS
// ================================
const searchForm = document.getElementById("searchForm");
const jobTitleInput = document.getElementById("jobTitleInput");
const locationInput = document.getElementById("locationInput");
const activeJobsCount = document.getElementById("activeJobsCount");
const totalCompaniesCount = document.getElementById("totalCompaniesCount");
const totalJobSeekersCount = document.getElementById("totalJobSeekersCount");

// ================================
// GLOBAL VARIABLES
// ================================
let jobsList = [];
let companiesList = [];
let usersList = [];

// ================================
// EVENT LISTENERS
// ================================
searchForm.addEventListener("submit", handleSearchFormSubmit);

// ================================
// INITIALIZATION
// ================================
function init() {
    displayJobStats();
}

// ================================
// FUNCTIONS
// ================================

// Fetch jobs, companies and users, then show the counts in the stats bar
async function displayJobStats() {
    jobsList = await getAllData("jobs");
    companiesList = await getAllData("companies");
    usersList = await getAllData("users");

    activeJobsCount.textContent = jobsList.length + "+";
    totalCompaniesCount.textContent = companiesList.length + "+";
    totalJobSeekersCount.textContent = usersList.length + "+";
}

// Handle the hero search form and send the user to the jobs page with their search
function handleSearchFormSubmit(event) {
    event.preventDefault();

    let jobTitleValue = jobTitleInput.value.trim();
    let locationValue = locationInput.value.trim();

    let queryParams = "?title=" + encodeURIComponent(jobTitleValue) + "&location=" + encodeURIComponent(locationValue);

    window.location.href = "jobs.html" + queryParams;
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
