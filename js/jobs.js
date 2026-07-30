// ================================
// DOM ELEMENTS
// ================================
const jobsContainer = document.getElementById("jobsContainer");
const resultsCountText = document.getElementById("resultsCountText");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const locationFilterSelect = document.getElementById("locationFilterSelect");
const experienceFilterSelect = document.getElementById("experienceFilterSelect");
const jobTypeCheckboxes = document.querySelectorAll(".job-type-checkbox");
const applyFiltersButton = document.getElementById("applyFiltersButton");

// ================================
// GLOBAL VARIABLES
// ================================
let allJobs = [];
let allCompanies = [];
let filteredJobs = [];
let userSavedJobIds = [];

// ================================
// EVENT LISTENERS
// ================================
searchInput.addEventListener("input", handleSearchInput);
sortSelect.addEventListener("change", handleSortChange);
applyFiltersButton.addEventListener("click", handleApplyFilters);

// ================================
// INITIALIZATION
// ================================
function init() {
    loadJobs();
}

// ================================
// FUNCTIONS
// ================================

// Load jobs, companies, and the current user's saved jobs, then show the results
async function loadJobs() {
    allJobs = await getAllData("jobs");
    allCompanies = await getAllData("companies");

    let loggedInUser = getLoggedInUser();

    if (loggedInUser) {
        let allSavedJobs = await getAllData("savedJobs");
        let savedJobs = filterByField(allSavedJobs, "userId", loggedInUser.id);
        userSavedJobIds = savedJobs.map(function (savedJob) {
            return savedJob.jobId;
        });
    }

    populateLocationFilter();
    applyUrlQueryParams();
    filterAndDisplayJobs();
}

// Fill the location dropdown with the unique locations found in the jobs list
function populateLocationFilter() {
    let uniqueLocations = [];

    allJobs.forEach(function (job) {
        if (!uniqueLocations.includes(job.location)) {
            uniqueLocations.push(job.location);
        }
    });

    uniqueLocations.forEach(function (location) {
        let option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        locationFilterSelect.appendChild(option);
    });
}

// Pre-fill the search box and location filter from the Home page search (?title=...&location=...)
function applyUrlQueryParams() {
    let urlParams = new URLSearchParams(window.location.search);
    let titleParam = urlParams.get("title");
    let locationParam = urlParams.get("location");

    if (titleParam) {
        searchInput.value = titleParam;
    }

    if (locationParam) {
        let matchingOption = Array.from(locationFilterSelect.options).find(function (option) {
            return option.value.toLowerCase() === locationParam.toLowerCase();
        });

        if (matchingOption) {
            locationFilterSelect.value = matchingOption.value;
        }
    }
}

// Find a company object by its id
function getCompanyById(companyId) {
    return allCompanies.find(function (company) {
        return idsMatch(company.id, companyId);
    });
}

// Read which job type checkboxes are currently checked
function getSelectedJobTypes() {
    let selectedTypes = [];

    jobTypeCheckboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
            selectedTypes.push(checkbox.value);
        }
    });

    return selectedTypes;
}

// Pull the starting number out of a salary range like "8-15 LPA"
function getMinSalary(salaryText) {
    let numberPart = salaryText.split("-")[0];
    return parseInt(numberPart) || 0;
}

// Sort filteredJobs based on the selected sort option
function sortJobs() {
    let sortValue = sortSelect.value;

    if (sortValue === "salary-high") {
        filteredJobs.sort(function (a, b) {
            return getMinSalary(b.salary) - getMinSalary(a.salary);
        });
    }
    else if (sortValue === "salary-low") {
        filteredJobs.sort(function (a, b) {
            return getMinSalary(a.salary) - getMinSalary(b.salary);
        });
    }
    else {
        // json-server returns records in the order they were added, so the newest
        // job is last in the list - reversing puts the newest job first
        filteredJobs.reverse();
    }
}

// Apply search text, location, job type, and experience filters, then sort and render
function filterAndDisplayJobs() {
    let searchValue = searchInput.value.trim().toLowerCase();
    let selectedLocation = locationFilterSelect.value;
    let selectedExperience = experienceFilterSelect.value;
    let selectedJobTypes = getSelectedJobTypes();

    filteredJobs = allJobs.filter(function (job) {
        let company = getCompanyById(job.companyId);

        if (!company) {
            return false;
        }

        let matchesSearch = job.title.toLowerCase().includes(searchValue) || company.name.toLowerCase().includes(searchValue);
        let matchesLocation = selectedLocation === "all" || job.location === selectedLocation;
        let matchesJobType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.type);
        let matchesExperience = selectedExperience === "any" || job.experience === selectedExperience;

        return matchesSearch && matchesLocation && matchesJobType && matchesExperience;
    });

    sortJobs();
    displayJobs(filteredJobs);
}

// Build the HTML for one job card
function createJobCardHTML(job) {
    let company = getCompanyById(job.companyId);

    if (!company) {
        console.warn("Skipping job with no matching company:", job);
        return "";
    }

    let isSaved = userSavedJobIds.some(function (savedJobId) {
        return idsMatch(savedJobId, job.id);
    });
    let skillTagsHTML = job.skills.map(function (skill) {
        return `<span class="skill-tag">${skill}</span>`;
    }).join("");

    return `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-card-header">
                <div class="company-logo-box">${company.name.charAt(0)}</div>
                <button class="save-btn ${isSaved ? "saved" : ""}" data-job-id="${job.id}">&#9829;</button>
            </div>
            <h3 class="job-title">${job.title}</h3>
            <p class="job-meta">${company.name} &bull; ${job.location}</p>
            <p class="job-salary">${job.salary}</p>
            <p class="job-experience">${job.experience} &bull; ${job.type}</p>
            <div class="skill-tags">${skillTagsHTML}</div>
        </div>
    `;
}

// Render the job cards into the page and attach their click/save listeners
function displayJobs(jobsToDisplay) {
    jobsContainer.innerHTML = "";
    resultsCountText.textContent = jobsToDisplay.length + " jobs found";

    if (jobsToDisplay.length === 0) {
        jobsContainer.innerHTML = "<p class='no-jobs-text'>No jobs match your search. Try different filters.</p>";
        return;
    }

    jobsToDisplay.forEach(function (job) {
        jobsContainer.innerHTML += createJobCardHTML(job);
    });

    attachJobCardListeners();
}

// Attach click listeners to the freshly rendered job cards and save buttons
function attachJobCardListeners() {
    let jobCards = document.querySelectorAll(".job-card");
    let saveButtons = document.querySelectorAll(".save-btn");

    jobCards.forEach(function (card) {
        card.addEventListener("click", handleJobCardClick);
    });

    saveButtons.forEach(function (button) {
        button.addEventListener("click", handleSaveButtonClick);
    });
}

// Go to the details page for the clicked job
function handleJobCardClick(event) {
    let jobId = event.currentTarget.dataset.jobId;
    window.location.href = `job-details.html?id=${jobId}`;
}

// Save or remove a job from the logged in user's saved jobs
async function handleSaveButtonClick(event) {
    event.stopPropagation();

    let saveButton = event.currentTarget;
    let jobId = saveButton.dataset.jobId;
    let loggedInUser = getLoggedInUser();

    if (!loggedInUser) {
        alert("Please login to save jobs.");
        window.location.href = "login.html";
        return;
    }

    let existingSavedJob = await findSavedJobRecord(loggedInUser.id, jobId);

    if (existingSavedJob) {
        await deleteData("savedJobs", existingSavedJob.id);
        saveButton.classList.remove("saved");
    }
    else {
        await addData("savedJobs", { userId: loggedInUser.id, jobId: jobId });
        saveButton.classList.add("saved");
    }
}

function handleSearchInput() {
    filterAndDisplayJobs();
}

function handleSortChange() {
    filterAndDisplayJobs();
}

function handleApplyFilters() {
    filterAndDisplayJobs();
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
