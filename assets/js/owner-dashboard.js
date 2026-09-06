/* =====================================================
   TIPECO GROUP - OWNER DASHBOARD
   Version: 4.0
   REAL PROJECT
   Owner Dashboard Data Engine

   PUBLIC ACCOUNT TYPES:
   - buyer
   - seller

   PRIVATE / CONTROLLED ROLES:
   - owner
   - agent

   DATA SOURCES:
   - Firebase Auth
   - Firestore: users, reports
   - IndexedDB: listings, listingMedia

   IMPORTANT:
   This file does NOT create Owner or Agent accounts.
   Owner and Agent are controlled roles.
===================================================== */


/* =====================================================
   FIREBASE / AUTH
===================================================== */

import "./auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


/* =====================================================
   VERSION
===================================================== */

const TIPECO_OWNER_DASHBOARD_VERSION = "4.0";


/* =====================================================
   FIRESTORE COLLECTIONS
===================================================== */

const USERS_COLLECTION = "users";
const REPORTS_COLLECTION = "reports";


/* =====================================================
   PUBLIC ACCOUNT TYPES
===================================================== */

const PUBLIC_ACCOUNT_TYPES = [
    "buyer",
    "seller"
];


/* =====================================================
   CONTROLLED ROLES
===================================================== */

const CONTROLLED_ROLES = [
    "owner",
    "agent"
];


/* =====================================================
   DOM HELPERS
===================================================== */

const $ = (id) => document.getElementById(id);


/* =====================================================
   DOM ELEMENTS
===================================================== */

const ownerNameElement =
    $("ownerName");

const welcomeOwnerNameElement =
    $("welcomeOwnerName");

const ownerAvatarElement =
    $("ownerAvatar");

const totalUsersElement =
    $("totalUsers");

const totalListingsElement =
    $("totalListings");

const pendingListingsElement =
    $("pendingListings");

const approvedListingsElement =
    $("approvedListings");

const totalAgentsElement =
    $("totalAgents");

const totalReportsElement =
    $("totalReports");

const recentUsersElement =
    $("recentUsers");

const recentListingsElement =
    $("recentListings");

const activityListElement =
    $("activityList");

const notificationCountElement =
    $("notificationCount");

const logoutButton =
    $("ownerLogoutBtn");

const sidebar =
    $("ownerSidebar");

const sidebarToggle =
    $("sidebarToggle");


/* =====================================================
   AUTHENTICATION
===================================================== */

async function protectOwnerDashboard() {

    try {

        if (
            typeof window.tipecoRequireOwner !==
            "function"
        ) {
            throw new Error(
                "TIPECO Owner authentication helper is unavailable."
            );
        }

        const owner =
            await window.tipecoRequireOwner();

        if (!owner) {
            throw new Error(
                "Owner authentication failed."
            );
        }

        return true;

    } catch (error) {

        console.error(
            "TIPECO OWNER AUTH ERROR:",
            error
        );

        window.location.href =
            "login.html";

        return false;
    }
}


/* =====================================================
   CURRENT FIREBASE USER
===================================================== */

function getFirebaseCurrentUser() {

    if (
        typeof window.tipecoGetCurrentUser ===
        "function"
    ) {
        return window.tipecoGetCurrentUser();
    }

    return auth.currentUser || null;
}


/* =====================================================
   OWNER FIRESTORE PROFILE
===================================================== */

async function getOwnerFirestoreProfile() {

    if (
        typeof window.tipecoGetCurrentProfile ===
        "function"
    ) {

        return await
            window.tipecoGetCurrentProfile();
    }

    return null;
}


/* =====================================================
   LOAD OWNER PROFILE
===================================================== */

async function loadOwnerProfile() {

    try {

        const profile =
            await getOwnerFirestoreProfile();

        const currentUser =
            getFirebaseCurrentUser();

        const name =
            profile?.name ||
            profile?.fullName ||
            profile?.displayName ||
            profile?.username ||
            currentUser?.displayName ||
            currentUser?.email ||
            "TIPECO OWNER";


        /* ---------------------------------------------
           OWNER NAME
        --------------------------------------------- */

        if (ownerNameElement) {
            ownerNameElement.textContent =
                name;
        }


        /* ---------------------------------------------
           WELCOME NAME
        --------------------------------------------- */

        if (welcomeOwnerNameElement) {
            welcomeOwnerNameElement.textContent =
                name;
        }


        /* ---------------------------------------------
           AVATAR INITIAL
        --------------------------------------------- */

        if (ownerAvatarElement) {

            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();

            ownerAvatarElement.textContent =
                firstLetter || "O";
        }


        console.log(
            "TIPECO OWNER PROFILE:",
            profile
        );

        return profile;

    } catch (error) {

        console.error(
            "OWNER PROFILE ERROR:",
            error
        );

        return null;
    }
}


/* =====================================================
   LOAD USERS
===================================================== */

async function loadOwnerUsers() {

    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    USERS_COLLECTION
                )
            );

        const users = [];

        usersSnapshot.forEach(
            (documentSnapshot) => {

                users.push({
                    id: documentSnapshot.id,
                    ...documentSnapshot.data()
                });

            }
        );

        return users;

    } catch (error) {

        console.error(
            "LOAD USERS ERROR:",
            error
        );

        return [];
    }
}


/* =====================================================
   LOAD REPORTS
===================================================== */

async function loadOwnerReports() {

    try {

        const reportsSnapshot =
            await getDocs(
                collection(
                    db,
                    REPORTS_COLLECTION
                )
            );

        const reports = [];

        reportsSnapshot.forEach(
            (documentSnapshot) => {

                reports.push({
                    id: documentSnapshot.id,
                    ...documentSnapshot.data()
                });

            }
        );

        return reports;

    } catch (error) {

        console.warn(
            "REPORTS COLLECTION ERROR:",
            error
        );

        return [];
    }
}


/* =====================================================
   LOAD LISTINGS
   IndexedDB / storage.js V2.0
===================================================== */

async function loadOwnerListings() {

    try {

        if (
            typeof window.getTipecoListings ===
            "function"
        ) {

            const listings =
                await window.getTipecoListings();

            return Array.isArray(listings)
                ? listings
                : [];
        }


        /* ---------------------------------------------
           Fallback for global function
        --------------------------------------------- */

        if (
            typeof getTipecoListings ===
            "function"
        ) {

            const listings =
                await getTipecoListings();

            return Array.isArray(listings)
                ? listings
                : [];
        }


        console.warn(
            "TIPECO storage.js: getTipecoListings() unavailable."
        );

        return [];

    } catch (error) {

        console.error(
            "LOAD LISTINGS ERROR:",
            error
        );

        return [];
    }
}


/* =====================================================
   NORMALIZE ROLE
===================================================== */

function normalizeRole(user) {

    return String(
        user?.role ||
        user?.userRole ||
        user?.accountType ||
        user?.type ||
        ""
    )
        .trim()
        .toLowerCase();
}


/* =====================================================
   NORMALIZE STATUS
===================================================== */

function normalizeStatus(listing) {

    const rawStatus =
        listing?.status ||
        listing?.verificationStatus ||
        listing?.approvalStatus ||
        "pending";

    return String(rawStatus)
        .trim()
        .toLowerCase();
}


/* =====================================================
   PENDING STATUS
===================================================== */

function isPendingListing(listing) {

    const status =
        normalizeStatus(listing);

    return [
        "pending",
        "submitted",
        "pending_verification",
        "pending_review",
        "under_review",
        "awaiting_verification"
    ].includes(status);
}


/* =====================================================
   APPROVED STATUS
===================================================== */

function isApprovedListing(listing) {

    const status =
        normalizeStatus(listing);

    return [
        "approved",
        "verified",
        "published",
        "active"
    ].includes(status);
}


/* =====================================================
   LISTING TITLE
===================================================== */

function getListingTitle(listing) {

    return (
        listing?.title ||
        listing?.name ||
        listing?.propertyTitle ||
        listing?.vehicleTitle ||
        "Untitled Listing"
    );
}


/* =====================================================
   LISTING CATEGORY
===================================================== */

function getListingCategory(listing) {

    return (
        listing?.category ||
        listing?.listingCategory ||
        listing?.type ||
        "Other"
    );
}


/* =====================================================
   USER NAME
===================================================== */

function getUserName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        user?.email ||
        "Unknown User"
    );
}


/* =====================================================
   DATE VALUE
===================================================== */

function getDateValue(value) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toMillis ===
        "function"
    ) {
        return value.toMillis();
    }

    if (
        value instanceof Date
    ) {
        return value.getTime();
    }

    const date =
        new Date(value);

    return isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();
}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatTipecoDate(value) {

    const timestamp =
        getDateValue(value);

    if (!timestamp) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(
        new Date(timestamp)
    );
}


/* =====================================================
   DASHBOARD STATISTICS
===================================================== */

async function loadDashboardStatistics(
    users,
    listings,
    reports
) {

    /* ---------------------------------------------
       USERS
    --------------------------------------------- */

    const totalUsers =
        users.length;


    /* ---------------------------------------------
       SELLERS
    --------------------------------------------- */

    const sellers =
        users.filter(
            (user) =>
                normalizeRole(user) ===
                "seller"
        );


    /* ---------------------------------------------
       BUYERS
    --------------------------------------------- */

    const buyers =
        users.filter(
            (user) =>
                normalizeRole(user) ===
                "buyer"
        );


    /* ---------------------------------------------
       AGENTS
    --------------------------------------------- */

    const agents =
        users.filter(
            (user) =>
                normalizeRole(user) ===
                "agent"
        );


    /* ---------------------------------------------
       LISTINGS
    --------------------------------------------- */

    const totalListings =
        listings.length;


    /* ---------------------------------------------
       PENDING
    --------------------------------------------- */

    const pendingListings =
        listings.filter(
            isPendingListing
        ).length;


    /* ---------------------------------------------
       APPROVED
    --------------------------------------------- */

    const approvedListings =
        listings.filter(
            isApprovedListing
        ).length;


    /* ---------------------------------------------
       REPORTS
    --------------------------------------------- */

    const totalReports =
        reports.length;


    /* ---------------------------------------------
       UPDATE DOM
    --------------------------------------------- */

    if (totalUsersElement) {
        totalUsersElement.textContent =
            totalUsers;
    }

    if (totalListingsElement) {
        totalListingsElement.textContent =
            totalListings;
    }

    if (pendingListingsElement) {
        pendingListingsElement.textContent =
            pendingListings;
    }

    if (approvedListingsElement) {
        approvedListingsElement.textContent =
            approvedListings;
    }

    if (totalAgentsElement) {
        totalAgentsElement.textContent =
            agents.length;
    }

    if (totalReportsElement) {
        totalReportsElement.textContent =
            totalReports;
    }


    /* ---------------------------------------------
       NOTIFICATIONS
    --------------------------------------------- */

    const notifications =
        pendingListings +
        totalReports;

    if (notificationCountElement) {

        notificationCountElement.textContent =
            notifications;

        notificationCountElement.style.display =
            notifications > 0
                ? ""
                : "none";
    }


    console.log(
        "TIPECO DASHBOARD STATISTICS:",
        {
            totalUsers,
            buyers: buyers.length,
            sellers: sellers.length,
            agents: agents.length,
            totalListings,
            pendingListings,
            approvedListings,
            totalReports
        }
    );
}


/* =====================================================
   RENDER RECENT USERS
===================================================== */

function renderRecentUsers(users) {

    if (!recentUsersElement) {
        return;
    }

    const sortedUsers =
        [...users].sort(
            (a, b) =>
                getDateValue(
                    b.createdAt
                ) -
                getDateValue(
                    a.createdAt
                )
        );


    const recent =
        sortedUsers.slice(0, 5);


    if (!recent.length) {

        recentUsersElement.innerHTML = `
            <tr>
                <td colspan="4">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    recentUsersElement.innerHTML =
        recent
            .map(
                (user) => {

                    const role =
                        normalizeRole(
                            user
                        );

                    const displayRole =
                        role || "unknown";

                    return `
                        <tr>
                            <td>
                                ${escapeTipecoHTML(
                                    getUserName(user)
                                )}
                            </td>

                            <td>
                                ${escapeTipecoHTML(
                                    user.email || "—"
                                )}
                            </td>

                            <td>
                                ${escapeTipecoHTML(
                                    displayRole
                                )}
                            </td>

                            <td>
                                ${formatTipecoDate(
                                    user.createdAt
                                )}
                            </td>
                        </tr>
                    `;
                }
            )
            .join("");
}


/* =====================================================
   RENDER RECENT LISTINGS
===================================================== */

function renderRecentListings(
    listings
) {

    if (!recentListingsElement) {
        return;
    }

    const sortedListings =
        [...listings].sort(
            (a, b) =>
                getDateValue(
                    b.createdAt ||
                    b.updatedAt
                ) -
                getDateValue(
                    a.createdAt ||
                    a.updatedAt
                )
        );


    const recent =
        sortedListings.slice(0, 5);


    if (!recent.length) {

        recentListingsElement.innerHTML = `
            <tr>
                <td colspan="4">
                    No listings found.
                </td>
            </tr>
        `;

        return;
    }


    recentListingsElement.innerHTML =
        recent
            .map(
                (listing) => {

                    const status =
                        normalizeStatus(
                            listing
                        );

                    return `
                        <tr>
                            <td>
                                ${escapeTipecoHTML(
                                    getListingTitle(
                                        listing
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeTipecoHTML(
                                    getListingCategory(
                                        listing
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeTipecoHTML(
                                    status
                                )}
                            </td>

                            <td>
                                ${formatTipecoDate(
                                    listing.createdAt ||
                                    listing.updatedAt
                                )}
                            </td>
                        </tr>
                    `;
                }
            )
            .join("");
}


/* =====================================================
   ACTIVITY LOG
===================================================== */

function renderActivity(
    users,
    listings,
    reports
) {

    if (!activityListElement) {
        return;
    }


    const activities = [];


    /* ---------------------------------------------
       USERS
    --------------------------------------------- */

    users.forEach(
        (user) => {

            activities.push({

                date:
                    getDateValue(
                        user.createdAt
                    ),

                text:
                    `New ${normalizeRole(user) || "user"} account: ${getUserName(user)}`
            });

        }
    );


    /* ---------------------------------------------
       LISTINGS
    --------------------------------------------- */

    listings.forEach(
        (listing) => {

            activities.push({

                date:
                    getDateValue(
                        listing.createdAt ||
                        listing.updatedAt
                    ),

                text:
                    `Listing added: ${getListingTitle(listing)}`
            });

        }
    );


    /* ---------------------------------------------
       REPORTS
    --------------------------------------------- */

    reports.forEach(
        (report) => {

            activities.push({

                date:
                    getDateValue(
                        report.createdAt ||
                        report.updatedAt
                    ),

                text:
                    "New report received"
            });

        }
    );


    activities.sort(
        (a, b) =>
            b.date -
            a.date
    );


    const recentActivities =
        activities.slice(0, 8);


    if (!recentActivities.length) {

        activityListElement.innerHTML = `
            <li>
                No recent activity.
            </li>
        `;

        return;
    }


    activityListElement.innerHTML =
        recentActivities
            .map(
                (activity) => `
                    <li>
                        ${escapeTipecoHTML(
                            activity.text
                        )}
                    </li>
                `
            )
            .join("");
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeTipecoHTML(value) {

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


/* =====================================================
   SIDEBAR
===================================================== */

function initializeSidebar() {

    if (
        !sidebarToggle ||
        !sidebar
    ) {
        return;
    }

    sidebarToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );

        }
    );
}


/* =====================================================
   NAVIGATION
===================================================== */

function initializeNavigation() {

    const navLinks =
        document.querySelectorAll(
            "[data-section]"
        );

    navLinks.forEach(
        (link) => {

            link.addEventListener(
                "click",
                () => {

                    navLinks.forEach(
                        (item) =>
                            item.classList.remove(
                                "active"
                            )
                    );

                    link.classList.add(
                        "active"
                    );

                }
            );

        }
    );
}


/* =====================================================
   LOGOUT
===================================================== */

function initializeLogout() {

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    typeof window.tipecoLogout ===
                    "function"
                ) {

                    await window.tipecoLogout();

                } else {

                    await auth.signOut();

                    window.location.href =
                        "login.html";
                }

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );
}


/* =====================================================
   REFRESH DASHBOARD
===================================================== */

async function refreshOwnerDashboard() {

    try {

        const [
            users,
            listings,
            reports
        ] =
            await Promise.all([
                loadOwnerUsers(),
                loadOwnerListings(),
                loadOwnerReports()
            ]);


        await loadDashboardStatistics(
            users,
            listings,
            reports
        );


        renderRecentUsers(
            users
        );


        renderRecentListings(
            listings
        );


        renderActivity(
            users,
            listings,
            reports
        );


        console.log(
            "TIPECO OWNER DASHBOARD DATA:",
            {
                users,
                listings,
                reports
            }
        );

    } catch (error) {

        console.error(
            "DASHBOARD DATA ERROR:",
            error
        );
    }
}


/* =====================================================
   INITIALIZE
===================================================== */

async function initializeOwnerDashboard() {

    console.log(
        `TIPECO OWNER DASHBOARD V${TIPECO_OWNER_DASHBOARD_VERSION}`
    );


    /* ---------------------------------------------
       OWNER AUTH
    --------------------------------------------- */

    const authorized =
        await protectOwnerDashboard();

    if (!authorized) {
        return;
    }


    /* ---------------------------------------------
       OWNER PROFILE
    --------------------------------------------- */

    await loadOwnerProfile();


    /* ---------------------------------------------
       UI
    --------------------------------------------- */

    initializeSidebar();

    initializeNavigation();

    initializeLogout();


    /* ---------------------------------------------
       SHOW DASHBOARD
    --------------------------------------------- */

    document.body.classList.add(
        "owner-authenticated"
    );


    /* ---------------------------------------------
       LOAD DATA
    --------------------------------------------- */

    await refreshOwnerDashboard();


    /* ---------------------------------------------
       AUTO REFRESH
    --------------------------------------------- */

    setInterval(
        refreshOwnerDashboard,
        10000
    );
}


/* =====================================================
   START
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeOwnerDashboard
    );

} else {

    initializeOwnerDashboard();
}
