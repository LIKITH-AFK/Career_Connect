// ================================
// DOM ELEMENTS
// ================================
const companySearchInput = document.getElementById("companySearchInput");
const companiesGrid = document.getElementById("companiesGrid");
const companyModalOverlay = document.getElementById("companyModalOverlay");
const modalCompanyName = document.getElementById("modalCompanyName");
const closeCompanyModalButton = document.getElementById("closeCompanyModalButton");
const modalCompanyMeta = document.getElementById("modalCompanyMeta");
const modalCompanyWebsite = document.getElementById("modalCompanyWebsite");
const modalCompanyDescription = document.getElementById("modalCompanyDescription");
const modalOpenPositionsContainer = document.getElementById("modalOpenPositionsContainer");

// ================================
// GLOBAL VARIABLES
// ================================
let allCompanies = [];
let allJobs = [];
let filteredCompanies = [];

// ================================
// EVENT LISTENERS
// ================================
companySearchInput.addEventListener("input", handleSearchInput);
closeCompanyModalButton.addEventListener("click", closeCompanyModal);
companyModalOverlay.addEventListener("click", handleOverlayClick);

// ================================
// INITIALIZATION
// ================================
function init() {
    loadCompanies();
}

// ================================
// FUNCTIONS
// ================================

// Load every company and job so we can show each company's open position count
async function loadCompanies() {
    allCompanies = await getAllData("companies");
    allJobs = await getAllData("jobs");
    filteredCompanies = allCompanies;

    displayCompanies();
}

// Count how many active jobs a company currently has open
function getJobCountForCompany(companyId) {
    return allJobs.filter(function (job) {
        return idsMatch(job.companyId, companyId) && job.status === "Active";
    }).length;
}

// Build the HTML for one company card
function createCompanyCardHTML(company) {
    let jobCount = getJobCountForCompany(company.id);
    let jobCountLabel = jobCount + " open position" + (jobCount === 1 ? "" : "s");

    return `
        <div class="company-card">
            <div class="company-logo-box">${company.name.charAt(0)}</div>
            <p class="company-card-name">${company.name}</p>
            <p class="company-card-industry">${company.industry}</p>
            <p class="company-card-location">${company.location}</p>
            <p class="company-card-jobs-count">${jobCountLabel}</p>
            <button class="btn btn-outline view-company-btn" data-company-id="${company.id}">View Company</button>
        </div>
    `;
}

// Render the company cards, or a placeholder message if the search matched nothing
function displayCompanies() {
    companiesGrid.innerHTML = "";

    if (filteredCompanies.length === 0) {
        companiesGrid.innerHTML = "<p class='no-jobs-text'>No companies match your search.</p>";
        return;
    }

    filteredCompanies.forEach(function (company) {
        companiesGrid.innerHTML += createCompanyCardHTML(company);
    });

    attachViewCompanyListeners();
}

// Attach click listeners to every "View Company" button
function attachViewCompanyListeners() {
    document.querySelectorAll(".view-company-btn").forEach(function (button) {
        button.addEventListener("click", handleViewCompanyClick);
    });
}

// Filter the companies grid as the user types
function handleSearchInput() {
    let searchValue = companySearchInput.value.trim().toLowerCase();

    filteredCompanies = allCompanies.filter(function (company) {
        return company.name.toLowerCase().includes(searchValue) || company.industry.toLowerCase().includes(searchValue);
    });

    displayCompanies();
}

// Open the details modal for the clicked company
function handleViewCompanyClick(event) {
    let companyId = event.currentTarget.dataset.companyId;
    let company = allCompanies.find(function (item) {
        return idsMatch(item.id, companyId);
    });

    openCompanyModal(company);
}

// Fill in and show the company details modal
function openCompanyModal(company) {
    modalCompanyName.textContent = company.name;
    modalCompanyMeta.textContent = company.industry + " • " + company.location;
    modalCompanyWebsite.textContent = company.website;
    modalCompanyWebsite.href = company.website;
    modalCompanyDescription.textContent = company.description;

    displayModalOpenPositions(company.id);

    companyModalOverlay.classList.remove("hidden");
}

// Render the open positions list inside the modal for one company
function displayModalOpenPositions(companyId) {
    let companyJobs = allJobs.filter(function (job) {
        return idsMatch(job.companyId, companyId) && job.status === "Active";
    });

    if (companyJobs.length === 0) {
        modalOpenPositionsContainer.innerHTML = "<p class='no-jobs-text'>No open positions right now.</p>";
        return;
    }

    companyJobs.forEach(function (job) {
        modalOpenPositionsContainer.innerHTML += `
            <div class="open-position-item">
                <span class="open-position-title">${job.title}</span>
                <a href="job-details.html?id=${job.id}" class="view-application-btn">View</a>
            </div>
        `;
    });
}

// Close the modal
function closeCompanyModal() {
    companyModalOverlay.classList.add("hidden");
}

// Close the modal when clicking the dark overlay outside the box
function handleOverlayClick(event) {
    if (event.target === companyModalOverlay) {
        closeCompanyModal();
    }
}

// ================================
// FUNCTION CALLS
// ================================
window.onload = init;
