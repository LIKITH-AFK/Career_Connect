// ================================
// CONSTANTS
// ================================
const BASE_URL = "https://career-connect-backend-api.onrender.com";

// ================================
// FUNCTIONS
// ================================

// Get all records from a collection (example: getAllData("jobs"))
async function getAllData(endpoint) {
    try {
        let response = await fetch(`${BASE_URL}/${endpoint}`);

        if (!response.ok) {
            throw new Error("Failed to fetch " + endpoint);
        }

        let data = await response.json();
        return data;
    }
    catch (error) {
        console.log(error);
        return [];
    }
}

// Get a single record by id (example: getDataById("jobs", 1))
async function getDataById(endpoint, id) {
    try {
        let response = await fetch(`${BASE_URL}/${endpoint}/${id}`);

        if (!response.ok) {
            throw new Error("Failed to fetch " + endpoint + " with id " + id);
        }

        let data = await response.json();
        return data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

// Add a new record to a collection
async function addData(endpoint, newData) {
    try {
        let response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newData)
        });

        if (!response.ok) {
            throw new Error("Failed to add data to " + endpoint);
        }

        let data = await response.json();
        return data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

// Update an existing record fully
async function updateData(endpoint, id, updatedData) {
    try {
        let response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error("Failed to update data in " + endpoint);
        }

        let data = await response.json();
        return data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

// Delete a record from a collection
async function deleteData(endpoint, id) {
    try {
        let response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete data from " + endpoint);
        }

        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}

// Get the currently logged in user from storage (set during login/signup in auth.js)
function getLoggedInUser() {
    let storedUser = localStorage.getItem("loggedInUser") || sessionStorage.getItem("loggedInUser");

    if (!storedUser) {
        return null;
    }

    return JSON.parse(storedUser);
}

// Update the logged in user's stored session data (used after editing a profile)
function updateStoredUser(updatedUser) {
    if (localStorage.getItem("loggedInUser")) {
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    }
    else if (sessionStorage.getItem("loggedInUser")) {
        sessionStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    }
}

// Compare two ids safely. Depending on your json-server version, ids can be numbers,
// numeric-looking strings, or random strings like "g8_aMRu_9fk" for records you add
// through a form. Comparing them as text avoids all of those mismatches.
function idsMatch(idOne, idTwo) {
    return String(idOne) === String(idTwo);
}

// Filter an array of already-fetched records to only those where record[fieldName]
// matches value. Used instead of a "?field=value" query on the request, since
// json-server's query-string filtering behaves differently across versions -
// filtering the data ourselves works the same regardless of that.
function filterByField(records, fieldName, value) {
    return records.filter(function (record) {
        return idsMatch(record[fieldName], value);
    });
}

// Find an existing savedJobs record for a user and job (or undefined if not saved).
// Fetches the full collection and filters it here instead of a server query.
async function findSavedJobRecord(userId, jobIdToCheck) {
    let allSavedJobs = await getAllData("savedJobs");

    return allSavedJobs.find(function (savedJob) {
        return idsMatch(savedJob.userId, userId) && idsMatch(savedJob.jobId, jobIdToCheck);
    });
}

// Swap the navbar's Login/Sign Up buttons for an avatar + Logout button when someone is logged in.
// Runs automatically on every page that has a #navbarActions element (see the listener below).
function updateNavbarAuthUI() {
    let navbarActions = document.getElementById("navbarActions");

    if (!navbarActions) {
        return;
    }

    let loggedInUser = getLoggedInUser();

    if (!loggedInUser) {
        return;
    }

    let profileLink = loggedInUser.role === "employer" ? "employer-dashboard.html" : "profile.html";

    navbarActions.innerHTML = `
        <a href="${profileLink}" class="navbar-user-link">
            <span class="avatar-circle navbar-avatar">${loggedInUser.name.charAt(0)}</span>
            <span class="navbar-user-name">${loggedInUser.name}</span>
        </a>
        <button id="navbarLogoutButton" class="btn btn-outline">Logout</button>
    `;

    let navbarLogoutButton = document.getElementById("navbarLogoutButton");
    navbarLogoutButton.addEventListener("click", logoutUser);
}

// ================================
// EVENT LISTENERS
// ================================

// Every page loads api.js, so this runs everywhere and updates the navbar if the person is logged in
document.addEventListener("DOMContentLoaded", updateNavbarAuthUI);
