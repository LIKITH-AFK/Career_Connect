// ================================
// FUNCTIONS
// ================================

// Create a new application record for a user applying to a job.
// Returns true on success, false if something went wrong or they already applied.
async function submitApplication(userId, jobId, resumeFileName, coverLetter) {
    let allApplications = await getAllData("applications");
    let alreadyApplied = filterByField(allApplications, "userId", userId).some(function (application) {
        return idsMatch(application.jobId, jobId);
    });

    if (alreadyApplied) {
        alert("You have already applied for this job.");
        return false;
    }

    let newApplication = {
        userId: userId,
        jobId: jobId,
        status: "Applied",
        appliedDate: new Date().toISOString().split("T")[0],
        resumeFileName: resumeFileName,
        coverLetter: coverLetter
    };

    let savedApplication = await addData("applications", newApplication);

    return savedApplication ? true : false;
}
