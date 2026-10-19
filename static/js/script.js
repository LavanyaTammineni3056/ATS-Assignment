// ==========================================
// MINI ATS - JAVASCRIPT
// ==========================================


// All candidates loaded from Flask
let candidates = [];

// Candidate ID when editing
let editingCandidateId = null;


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const candidateModal =
    document.getElementById("candidateModal");

const openCandidateModal =
    document.getElementById("openCandidateModal");

const closeCandidateModal =
    document.getElementById("closeCandidateModal");

const candidateForm =
    document.getElementById("candidateForm");

const candidateTableBody =
    document.getElementById("candidateTableBody");

const searchInput =
    document.getElementById("searchInput");

const stageFilter =
    document.getElementById("stageFilter");

const dashboardLink =
    document.getElementById("dashboardLink");

const candidatesLink =
    document.getElementById("candidatesLink");

const dashboardSection =
    document.getElementById("dashboard");

const candidatesSection =
    document.getElementById("candidates");

const pageTitle =
    document.querySelector(".topbar h1");

const pageDescription =
    document.querySelector(".topbar p");


// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

function showDashboard() {

    dashboardSection.style.display = "grid";

    candidatesSection.style.display = "none";

    dashboardLink.classList.add("active");

    candidatesLink.classList.remove("active");

    pageTitle.textContent = "Dashboard";

    pageDescription.textContent =
        "Manage your recruitment pipeline";

    updateDashboard();
}


function showCandidates() {

    dashboardSection.style.display = "none";

    candidatesSection.style.display = "block";

    candidatesLink.classList.add("active");

    dashboardLink.classList.remove("active");

    pageTitle.textContent = "Candidates";

    pageDescription.textContent =
        "Manage and track all applicants";
}


dashboardLink.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        showDashboard();
    }
);


candidatesLink.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        showCandidates();
    }
);


// ==========================================
// OPEN ADD CANDIDATE MODAL
// ==========================================

openCandidateModal.addEventListener(
    "click",
    () => {

        editingCandidateId = null;

        candidateForm.reset();

        document.querySelector(
            ".modal-header h2"
        ).textContent =
            "Add Candidate";

        document.querySelector(
            ".submit-btn"
        ).textContent =
            "Save Candidate";

        candidateModal.style.display =
            "flex";
    }
);


// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {

    candidateModal.style.display =
        "none";

    candidateForm.reset();

    editingCandidateId = null;
}


closeCandidateModal.addEventListener(
    "click",
    closeModal
);


window.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            candidateModal
        ) {

            closeModal();
        }
    }
);


// ==========================================
// LOAD ALL CANDIDATES
// ==========================================

async function loadCandidates() {

    try {

        const response =
            await fetch(
                "/api/candidates"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load candidates"
            );
        }


        candidates =
            await response.json();


        filterCandidates();

        await updateDashboard();


    } catch (error) {

        console.error(
            "Error loading candidates:",
            error
        );


        candidateTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-message"
                >
                    Unable to load candidates.
                </td>

            </tr>

        `;
    }
}


// ==========================================
// DISPLAY CANDIDATES
// ==========================================

function displayCandidates(
    candidateList
) {

    candidateTableBody.innerHTML = "";


    if (candidateList.length === 0) {

        candidateTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-message"
                >
                    No candidates found.
                </td>

            </tr>

        `;

        return;
    }


    candidateList.forEach(
        (candidate) => {

            const row =
                document.createElement("tr");


            const skills =
                Array.isArray(
                    candidate.skills
                )
                    ? candidate.skills.join(", ")
                    : candidate.skills || "-";


            const stage =
                candidate.stage ||
                "Applied";


            const experience =
                Number(
                    candidate.experience ?? 0
                );


            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHtml(candidate.name)}
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(candidate.email)}
                    </small>

                </td>


                <td>

                    ${escapeHtml(
                        candidate.role || "-"
                    )}

                </td>


                <td>

                    ${escapeHtml(skills)}

                </td>


                <td>

                    ${experience} year(s)

                </td>


                <td>

                    <select
                        class="stage-select"
                        onchange="
                            changeStage(
                                '${candidate._id}',
                                this.value
                            )
                        "
                    >

                        ${createStageOptions(stage)}

                    </select>

                </td>


                <td>

                    <button
                        class="action-btn edit-btn"
                        onclick="
                            editCandidate(
                                '${candidate._id}'
                            )
                        "
                    >
                        Edit
                    </button>


                    <button
                        class="action-btn delete-btn"
                        onclick="
                            deleteCandidate(
                                '${candidate._id}'
                            )
                        "
                    >
                        Delete
                    </button>

                </td>

            `;


            candidateTableBody.appendChild(
                row
            );
        }
    );
}


// ==========================================
// STAGE OPTIONS
// ==========================================

function createStageOptions(
    currentStage
) {

    const stages = [

        "Applied",
        "Screening",
        "Interview",
        "Selected",
        "Rejected"

    ];


    return stages
        .map((stage) => {

            const selected =
                stage === currentStage
                    ? "selected"
                    : "";


            return `

                <option
                    value="${stage}"
                    ${selected}
                >
                    ${stage}
                </option>

            `;
        })
        .join("");
}


// ==========================================
// ADD / UPDATE CANDIDATE
// ==========================================

candidateForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const candidateData = {

            name:
                document
                    .getElementById("name")
                    .value
                    .trim(),

            email:
                document
                    .getElementById("email")
                    .value
                    .trim(),

            phone:
                document
                    .getElementById("phone")
                    .value
                    .trim(),

            role:
                document
                    .getElementById("role")
                    .value
                    .trim(),

            skills:
                document
                    .getElementById("skills")
                    .value
                    .split(",")
                    .map(
                        skill =>
                            skill.trim()
                    )
                    .filter(Boolean),

            experience:
                Number(
                    document
                        .getElementById(
                            "experience"
                        )
                        .value
                ),

            stage:
                document
                    .getElementById("stage")
                    .value
        };


        try {

            let url =
                "/api/candidates";

            let method =
                "POST";


            if (editingCandidateId) {

                url =
                    `/api/candidates/${editingCandidateId}`;

                method =
                    "PUT";
            }


            const response =
                await fetch(
                    url,
                    {

                        method: method,

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                candidateData
                            )
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                alert(
                    result.error ||
                    "Something went wrong."
                );

                return;
            }


            if (editingCandidateId) {

                alert(
                    "Candidate updated successfully!"
                );

            } else {

                alert(
                    "Candidate added successfully!"
                );
            }


            closeModal();

            await loadCandidates();


        } catch (error) {

            console.error(error);

            alert(
                "Unable to save candidate."
            );
        }
    }
);


// ==========================================
// EDIT CANDIDATE
// ==========================================

function editCandidate(
    candidateId
) {

    const candidate =
        candidates.find(
            item =>
                item._id ===
                candidateId
        );


    if (!candidate) {

        alert(
            "Candidate not found."
        );

        return;
    }


    editingCandidateId =
        candidateId;


    document.getElementById(
        "name"
    ).value =
        candidate.name || "";


    document.getElementById(
        "email"
    ).value =
        candidate.email || "";


    document.getElementById(
        "phone"
    ).value =
        candidate.phone || "";


    document.getElementById(
        "role"
    ).value =
        candidate.role || "";


    document.getElementById(
        "skills"
    ).value =
        Array.isArray(
            candidate.skills
        )
            ? candidate.skills.join(", ")
            : candidate.skills || "";


    document.getElementById(
        "experience"
    ).value =
        candidate.experience ?? 0;


    document.getElementById(
        "stage"
    ).value =
        candidate.stage ||
        "Applied";


    document.querySelector(
        ".modal-header h2"
    ).textContent =
        "Edit Candidate";


    document.querySelector(
        ".submit-btn"
    ).textContent =
        "Update Candidate";


    candidateModal.style.display =
        "flex";
}


// ==========================================
// DELETE CANDIDATE
// ==========================================

async function deleteCandidate(
    candidateId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this candidate?"
        );


    if (!confirmed) {

        return;
    }


    try {

        const response =
            await fetch(

                `/api/candidates/${candidateId}`,

                {
                    method: "DELETE"
                }

            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Unable to delete candidate."
            );

            return;
        }


        alert(
            "Candidate deleted successfully!"
        );


        await loadCandidates();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete candidate."
        );
    }
}


// ==========================================
// CHANGE HIRING STAGE
// ==========================================

async function changeStage(
    candidateId,
    newStage
) {

    try {

        const response =
            await fetch(

                `/api/candidates/${candidateId}`,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            stage:
                                newStage

                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Unable to change stage."
            );

            await loadCandidates();

            return;
        }


        await loadCandidates();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to change candidate stage."
        );

        await loadCandidates();
    }
}


// ==========================================
// SEARCH + STAGE FILTER
// ==========================================

function filterCandidates() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedStage =
        stageFilter.value;


    const filteredCandidates =
        candidates.filter(
            (candidate) => {


                const skills =
                    Array.isArray(
                        candidate.skills
                    )
                        ? candidate.skills.join(" ")
                        : candidate.skills || "";


                const searchableText = `

                    ${candidate.name || ""}

                    ${candidate.email || ""}

                    ${candidate.role || ""}

                    ${skills}

                `.toLowerCase();


                const matchesSearch =
                    searchableText.includes(
                        searchText
                    );


                const matchesStage =
                    selectedStage === "All" ||
                    candidate.stage ===
                        selectedStage;


                return (
                    matchesSearch &&
                    matchesStage
                );
            }
        );


    displayCandidates(
        filteredCandidates
    );
}


searchInput.addEventListener(
    "input",
    filterCandidates
);


stageFilter.addEventListener(
    "change",
    filterCandidates
);


// ==========================================
// DASHBOARD METRICS
// ==========================================

async function updateDashboard() {

    try {

        const response =
            await fetch(
                "/api/dashboard"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load dashboard"
            );
        }


        const data =
            await response.json();


        document.getElementById(
            "totalCandidates"
        ).textContent =
            data.total;


        document.getElementById(
            "appliedCandidates"
        ).textContent =
            data.applied;


        document.getElementById(
            "screeningCandidates"
        ).textContent =
            data.screening;


        document.getElementById(
            "interviewCandidates"
        ).textContent =
            data.interview;


        document.getElementById(
            "selectedCandidates"
        ).textContent =
            data.selected;


        const rejectedElement =
            document.getElementById(
                "rejectedCandidates"
            );


        if (rejectedElement) {

            rejectedElement.textContent =
                data.rejected;
        }


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


// ==========================================
// BASIC HTML ESCAPING
// ==========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// ==========================================
// START APPLICATION
// ==========================================

showDashboard();

loadCandidates();