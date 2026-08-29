/* =====================================================
   TIPECO GROUP - OWNER DASHBOARD
   Version: 2.0
   Real Dashboard Logic
   Compatible with:
   auth.js
   storage.js
   owner-dashboard.html
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const TIPECO_OWNER_DASHBOARD_VERSION = "2.0";

const TIPECO_USERS_KEY = "tipeco_users";
const TIPECO_CURRENT_USER_KEY = "tipeco_current_user";

const TIPECO_FALLBACK_USERS_KEYS = [
    "users",
    "USERS",
    "TIPECO_USERS",
    "TIPECO_GROUP_USERS",
    "registeredUsers"
];

const TIPECO_CURRENT_USER_KEYS = [
    "currentUser",
    "CURRENT_USER",
    "tipeco_current_user",
    "TIPECO_CURRENT_USER"
];


/* =====================================================
   DOM ELEMENTS
===================================================== */

let ownerSidebar;
let sidebarToggle;
let ownerLogoutBtn;
let ownerNavLinks;
let quickActionButtons;

let notificationBtn;

let ownerNameElement;
let totalUsersElement;
let totalListingsElement;
let pendingListingsElement;
let approvedListingsElement;
let totalAgentsElement;
let totalReportsElement;

let recentUsersElement;
let recentListingsElement;
let activityListElement;
let notificationCountElement;


/* =====================================================
   INITIALIZE DOM ELEMENTS
===================================================== */

function initializeOwnerDOM() {

    ownerSidebar =
        document.getElementById("ownerSidebar");

    sidebarToggle =
        document.getElementById("sidebarToggle");

    ownerLogoutBtn =
        document.getElementById("ownerLogoutBtn");

    ownerNavLinks =
        document.querySelectorAll(".owner-nav a");

    quickActionButtons =
        document.querySelectorAll(".quick-action");

    notificationBtn =
        document.getElementById("notificationBtn");

    ownerNameElement =
        document.getElementById("ownerName");

    totalUsersElement =
        document.getElementById("totalUsers");

    totalListingsElement =
        document.getElementById("totalListings");

    pendingListingsElement =
        document.getElementById("pendingListings");

    approvedListingsElement =
        document.getElementById("approvedListings");

    totalAgentsElement =
        document.getElementById("totalAgents");

    totalReportsElement =
        document.getElementById("totalReports");

    recentUsersElement =
        document.getElementById("recentUsers");

    recentListingsElement =
        document.getElementById("recentListings");

    activityListElement =
        document.getElementById("activityList");

    notificationCountElement =
        document.getElementById("notificationCount");

}


/* =====================================================
   SAFE LOCAL STORAGE READ
===================================================== */

function readLocalStorage(key) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "TIPECO: Could not read localStorage key:",
            key,
            error
        );

        return null;

    }

}


/* =====================================================
   FIND USERS STORAGE
===================================================== */

function getStoredUsers() {

    /* ---------------------------------------------
       PRIMARY KEY
    --------------------------------------------- */

    const primaryUsers =
        readLocalStorage(
            TIPECO_USERS_KEY
        );


    if (Array.isArray(primaryUsers)) {

        return primaryUsers;

    }


    /* ---------------------------------------------
       FALLBACK KEYS
    --------------------------------------------- */

    for (
        let i = 0;
        i < TIPECO_FALLBACK_USERS_KEYS.length;
        i++
    ) {

        const users =
            readLocalStorage(
                TIPECO_FALLBACK_USERS_KEYS[i]
            );


        if (Array.isArray(users)) {

            return users;

        }

    }


    return [];

}


/* =====================================================
   FIND CURRENT USER
===================================================== */

function getCurrentUser() {

    /* ---------------------------------------------
       PRIMARY KEY
    --------------------------------------------- */

    const primaryUser =
        readLocalStorage(
            TIPECO_CURRENT_USER_KEY
        );


    if (
        primaryUser &&
        typeof primaryUser === "object"
    ) {

        return primaryUser;

    }


    /* ---------------------------------------------
       FALLBACK KEYS
    --------------------------------------------- */

    for (
        let i = 0;
        i < TIPECO_CURRENT_USER_KEYS.length;
        i++
    ) {

        const user =
            readLocalStorage(
                TIPECO_CURRENT_USER_KEYS[i]
            );


        if (
            user &&
            typeof user === "object"
        ) {

            return user;

        }

    }


    return null;

}


/* =====================================================
   OWNER AUTHORIZATION
===================================================== */

function isOwnerAccount(user) {

    if (!user) {
        return false;
    }


    const role =
        String(
            user.role ||
            user.userRole ||
            user.accountType ||
            user.type ||
            ""
        )
        .trim()
        .toLowerCase();


    const status =
        String(
            user.status ||
            "active"
        )
        .trim()
        .toLowerCase();


    const ownerRoles = [
        "owner",
        "admin",
        "administrator",
        "superadmin",
        "super-admin"
    ];


    if (
        ownerRoles.includes(role) &&
        status !== "blocked" &&
        status !== "suspended"
    ) {

        return true;

    }


    return false;

}


/* =====================================================
   PROTECT OWNER DASHBOARD
===================================================== */

function protectOwnerDashboard() {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {

        console.warn(
            "TIPECO: No logged-in user found."
        );

        return false;

    }


    if (!isOwnerAccount(currentUser)) {

        alert(
            "Access denied. Owner authorization is required."
        );


        window.location.href =
            "../pages/dashboard.html";

        return false;

    }


    return true;

}


/* =====================================================
   OWNER PROFILE
===================================================== */

function loadOwnerProfile() {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {
        return;
    }


    const name =
        currentUser.name ||
        currentUser.fullName ||
        currentUser.username ||
        currentUser.email ||
        "Owner";


    if (ownerNameElement) {

        ownerNameElement.textContent =
            name;

    }


    /* ---------------------------------------------
       Avatar
    --------------------------------------------- */

    const avatar =
        document.querySelector(
            ".owner-avatar"
        );


    if (avatar) {

        avatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() || "O";

    }

}


/* =====================================================
   SIDEBAR TOGGLE
===================================================== */

function initializeSidebar() {

    if (
        !sidebarToggle ||
        !ownerSidebar
    ) {

        return;

    }


    sidebarToggle.addEventListener(
        "click",
        function () {

            ownerSidebar.classList.toggle(
                "open"
            );

        }
    );


    ownerNavLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    if (
                        window.innerWidth <= 768
                    ) {

                        ownerSidebar.classList.remove(
                            "open"
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   ACTIVE NAVIGATION
===================================================== */

function initializeNavigation() {

    ownerNavLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    ownerNavLinks.forEach(
                        function (item) {

                            item.parentElement.classList.remove(
                                "active"
                            );

                        }
                    );


                    link.parentElement.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function initializeQuickActions() {

    quickActionButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const action =
                        button.dataset.action;


                    if (!action) {
                        return;
                    }


                    const target =
                        document.getElementById(
                            action
                        );


                    if (target) {

                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }
            );

        }
    );

}


/* =====================================================
   LOAD LISTINGS FROM INDEXEDDB
===================================================== */

async function loadOwnerListings() {

    try {

        if (
            typeof getTipecoListings !==
            "function"
        ) {

            console.warn(
                "TIPECO: getTipecoListings() not found."
            );

            return [];

        }


        const listings =
            await getTipecoListings();


        if (!Array.isArray(listings)) {

            return [];

        }


        return listings;

    } catch (error) {

        console.error(
            "TIPECO: Failed to load listings.",
            error
        );

        return [];

    }

}


/* =====================================================
   NORMALIZE STATUS
===================================================== */

function normalizeStatus(listing) {

    return String(
        listing.status ||
        listing.verificationStatus ||
        listing.approvalStatus ||
        "pending"
    )
    .trim()
    .toLowerCase();

}


/* =====================================================
   GET LISTING TITLE
===================================================== */

function getListingTitle(listing) {

    return (
        listing.title ||
        listing.listingTitle ||
        listing.name ||
        "Untitled Listing"
    );

}


/* =====================================================
   GET LISTING CATEGORY
===================================================== */

function getListingCategory(listing) {

    return (
        listing.category ||
        listing.listingCategory ||
        "Other"
    );

}


/* =====================================================
   GET LISTING OWNER
===================================================== */

function getListingOwner(listing) {

    return (
        listing.ownerName ||
        listing.sellerName ||
        listing.ownerEmail ||
        listing.email ||
        "Unknown"
    );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatTipecoDate(value) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   LOAD DASHBOARD STATISTICS
===================================================== */

async function loadDashboardStatistics() {

    const users =
        getStoredUsers();


    const listings =
        await loadOwnerListings();


    /* ---------------------------------------------
       USERS
    --------------------------------------------- */

    const totalUsers =
        users.length;


    /* ---------------------------------------------
       LISTINGS
    --------------------------------------------- */

    const totalListings =
        listings.length;


    let pendingCount = 0;
    let approvedCount = 0;


    listings.forEach(
        function (listing) {

            const status =
                normalizeStatus(
                    listing
                );


            if (
                status === "approved" ||
                status === "published" ||
                status === "active" ||
                status === "verified"
            ) {

                approvedCount++;

            } else {

                pendingCount++;

            }

        }
    );


    /* ---------------------------------------------
       AGENTS
    --------------------------------------------- */

    const totalAgents =
        users.filter(
            function (user) {

                const role =
                    String(
                        user.role ||
                        user.userRole ||
                        user.accountType ||
                        user.type ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                return role === "agent";

            }
        ).length;


    /* ---------------------------------------------
       REPORTS
    --------------------------------------------- */

    let reportsCount = 0;


    const possibleReportKeys = [
        "tipeco_reports",
        "TIPECO_REPORTS",
        "reports",
        "REPORTS"
    ];


    for (
        let i = 0;
        i < possibleReportKeys.length;
        i++
    ) {

        const reports =
            readLocalStorage(
                possibleReportKeys[i]
            );


        if (Array.isArray(reports)) {

            reportsCount =
                reports.length;

            break;

        }

    }


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
            pendingCount;

    }


    if (approvedListingsElement) {

        approvedListingsElement.textContent =
            approvedCount;

    }


    if (totalAgentsElement) {

        totalAgentsElement.textContent =
            totalAgents;

    }


    if (totalReportsElement) {

        totalReportsElement.textContent =
            reportsCount;

    }


    /* ---------------------------------------------
       NOTIFICATIONS
    --------------------------------------------- */

    const notifications =
        pendingCount +
        reportsCount;


    if (notificationCountElement) {

        notificationCountElement.textContent =
            notifications;

    }


    return {
        users,
        listings,
        pendingCount,
        approvedCount,
        totalAgents,
        reportsCount
    };

}


/* =====================================================
   RENDER RECENT USERS
===================================================== */

function renderRecentUsers(users) {

    if (!recentUsersElement) {
        return;
    }


    recentUsersElement.innerHTML = "";


    if (
        !Array.isArray(users) ||
        users.length === 0
    ) {

        recentUsersElement.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No users available yet.
                </td>
            </tr>
        `;

        return;

    }


    const sortedUsers =
        [...users].sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.createdAt ||
                        a.joinedAt ||
                        a.registeredAt ||
                        0
                    );

                const dateB =
                    new Date(
                        b.createdAt ||
                        b.joinedAt ||
                        b.registeredAt ||
                        0
                    );

                return dateB - dateA;

            }
        );


    const recent =
        sortedUsers.slice(
            0,
            10
        );


    recent.forEach(
        function (user) {

            const name =
                user.name ||
                user.fullName ||
                user.username ||
                "User";


            const email =
                user.email ||
                user.phone ||
                user.phoneNumber ||
                "—";


            const role =
                user.role ||
                user.userRole ||
                user.accountType ||
                user.type ||
                "User";


            const status =
                user.status ||
                "Active";


            const joined =
                formatTipecoDate(
                    user.createdAt ||
                    user.joinedAt ||
                    user.registeredAt
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeTipecoHTML(name)}
                    </strong>
                </td>

                <td>
                    ${escapeTipecoHTML(email)}
                </td>

                <td>
                    ${escapeTipecoHTML(role)}
                </td>

                <td>
                    <span class="status-badge">
                        ${escapeTipecoHTML(status)}
                    </span>
                </td>

                <td>
                    ${joined}
                </td>
            `;


            recentUsersElement.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   RENDER RECENT LISTINGS
===================================================== */

function renderRecentListings(listings) {

    if (!recentListingsElement) {
        return;
    }


    recentListingsElement.innerHTML = "";


    if (
        !Array.isArray(listings) ||
        listings.length === 0
    ) {

        recentListingsElement.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No listings available yet.
                </td>
            </tr>
        `;

        return;

    }


    const sortedListings =
        [...listings].sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.createdAt ||
                        a.date ||
                        0
                    );

                const dateB =
                    new Date(
                        b.createdAt ||
                        b.date ||
                        0
                    );

                return dateB - dateA;

            }
        );


    const recent =
        sortedListings.slice(
            0,
            10
        );


    recent.forEach(
        function (listing) {

            const title =
                getListingTitle(
                    listing
                );


            const owner =
                getListingOwner(
                    listing
                );


            const category =
                getListingCategory(
                    listing
                );


            const status =
                normalizeStatus(
                    listing
                );


            const date =
                formatTipecoDate(
                    listing.createdAt ||
                    listing.date
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeTipecoHTML(title)}
                    </strong>
                </td>

                <td>
                    ${escapeTipecoHTML(owner)}
                </td>

                <td>
                    ${escapeTipecoHTML(category)}
                </td>

                <td>
                    <span class="status-badge status-${escapeTipecoHTML(status)}">
                        ${escapeTipecoHTML(status)}
                    </span>
                </td>

                <td>
                    ${date}
                </td>
            `;


            recentListingsElement.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   ACTIVITY LOG
===================================================== */

function renderActivity(users, listings) {

    if (!activityListElement) {
        return;
    }


    const activities = [];


    /* ---------------------------------------------
       USERS
    --------------------------------------------- */

    users.forEach(
        function (user) {

            activities.push({
                type: "user",
                date:
                    user.createdAt ||
                    user.joinedAt ||
                    user.registeredAt ||
                    0,
                text:
                    "New user registered: " +
                    (
                        user.name ||
                        user.fullName ||
                        user.email ||
                        "User"
                    )
            });

        }
    );


    /* ---------------------------------------------
       LISTINGS
    --------------------------------------------- */

    listings.forEach(
        function (listing) {

            activities.push({
                type: "listing",
                date:
                    listing.createdAt ||
                    0,
                text:
                    "New listing submitted: " +
                    getListingTitle(
                        listing
                    )
            });

        }
    );


    activities.sort(
        function (a, b) {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        }
    );


    const recentActivities =
        activities.slice(
            0,
            10
        );


    if (
        recentActivities.length === 0
    ) {

        activityListElement.innerHTML = `
            <div class="activity-empty">
                <span>📝</span>
                <p>No recent activity.</p>
            </div>
        `;

        return;

    }


    activityListElement.innerHTML = "";


    recentActivities.forEach(
        function (activity) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "activity-item";


            item.innerHTML = `
                <span class="activity-icon">
                    ${
                        activity.type === "user"
                        ? "👤"
                        : "📋"
                    }
                </span>

                <div>
                    <p>
                        ${escapeTipecoHTML(
                            activity.text
                        )}
                    </p>

                    <small>
                        ${formatTipecoDate(
                            activity.date
                        )}
                    </small>
                </div>
            `;


            activityListElement.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   HTML SECURITY
===================================================== */

function escapeTipecoHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

function initializeNotifications() {

    if (!notificationBtn) {
        return;
    }


    notificationBtn.addEventListener(
        "click",
        async function () {

            try {

                const data =
                    await loadDashboardStatistics();


                if (
                    data.pendingCount > 0
                ) {

                    alert(
                        "You have " +
                        data.pendingCount +
                        " listing(s) waiting for verification."
                    );

                    return;

                }


                if (
                    data.reportsCount > 0
                ) {

                    alert(
                        "You have " +
                        data.reportsCount +
                        " report(s) to review."
                    );

                    return;

                }


                alert(
                    "No new notifications."
                );

            } catch (error) {

                console.error(
                    "TIPECO notification error:",
                    error
                );

            }

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

function initializeOwnerLogout() {

    if (!ownerLogoutBtn) {
        return;
    }


    ownerLogoutBtn.addEventListener(
        "click",
        function () {

            const confirmLogout =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            /*
             * Try auth.js logout function first
             */

            if (
                typeof logoutUser ===
                "function"
            ) {

                try {

                    logoutUser();

                    return;

                } catch (error) {

                    console.warn(
                        "TIPECO auth logout failed:",
                        error
                    );

                }

            }


            /*
             * Fallback cleanup
             */

            const logoutKeys = [
                "currentUser",
                "CURRENT_USER",
                "tipeco_current_user",
                "TIPECO_CURRENT_USER",
                "login",
                "LOGIN",
                "tipeco_login",
                "TIPECO_LOGIN"
            ];


            logoutKeys.forEach(
                function (key) {

                    localStorage.removeItem(
                        key
                    );

                }
            );


            sessionStorage.clear();


            window.location.href =
                "../index.html";

        }
    );

}


/* =====================================================
   REFRESH DASHBOARD
===================================================== */

async function refreshOwnerDashboard() {

    try {

        const data =
            await loadDashboardStatistics();


        renderRecentUsers(
            data.users
        );


        renderRecentListings(
            data.listings
        );


        renderActivity(
            data.users,
            data.listings
        );


        console.log(
            "TIPECO Owner Dashboard refreshed."
        );


    } catch (error) {

        console.error(
            "TIPECO Dashboard refresh error:",
            error
        );

    }

}


/* =====================================================
   AUTO REFRESH
===================================================== */

function initializeAutoRefresh() {

    /*
     * Refresh every 10 seconds.
     *
     * This is useful while testing because
     * a Seller can create a listing and the
     * Owner dashboard will update automatically.
     */

    setInterval(
        function () {

            refreshOwnerDashboard();

        },
        10000
    );

}


/* =====================================================
   INITIAL DASHBOARD
===================================================== */

async function initializeOwnerDashboard() {

    console.log(
        "TIPECO GROUP Owner Dashboard Version",
        TIPECO_OWNER_DASHBOARD_VERSION
    );


    initializeOwnerDOM();


    /*
     * Protect dashboard.
     *
     * During development, if auth.js has not
     * yet created the current user, we don't
     * redirect immediately. We show the page
     * and log the issue so testing is easier.
     */

    const currentUser =
        getCurrentUser();


    if (currentUser) {

        if (!isOwnerAccount(currentUser)) {

            console.warn(
                "TIPECO: Current account is not recognized as Owner/Admin."
            );

        }

    } else {

        console.warn(
            "TIPECO: No current user found in localStorage."
        );

    }


    loadOwnerProfile();

    initializeSidebar();

    initializeNavigation();

    initializeQuickActions();

    initializeNotifications();

    initializeOwnerLogout();

    await refreshOwnerDashboard();

    initializeAutoRefresh();


    console.log(
        "TIPECO GROUP Owner Dashboard is ready."
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
