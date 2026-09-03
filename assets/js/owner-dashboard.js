/* =====================================================
   TIPECO GROUP - OWNER DASHBOARD
   Version: 3.0
   Firebase + Firestore Integration

   Compatible with:
   - auth.js V7.1
   - storage.js V2.0
   - owner-dashboard.html

   IMPORTANT:
   - Firebase/Firestore = Users, Owner, Agents, Reports
   - IndexedDB = Listings + Listing Media
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const TIPECO_OWNER_DASHBOARD_VERSION = "3.0";

const FIRESTORE_USERS_COLLECTION = "users";
const FIRESTORE_REPORTS_COLLECTION = "reports";


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
   FIREBASE MODULE REFERENCES
===================================================== */

let tipecoAuth = null;
let tipecoDb = null;

let firestoreCollection = null;
let firestoreGetDocs = null;
let firestoreQuery = null;
let firestoreOrderBy = null;
let firestoreLimit = null;


/* =====================================================
   INITIALIZE FIREBASE REFERENCES
===================================================== */

async function initializeFirebaseDashboard() {

    try {

        /*
         * auth.js and firebase-config.js are modules.
         *
         * We dynamically import firebase-config.js here
         * so this dashboard can safely use the same Firebase
         * project.
         */

        const firebaseConfigModule =
            await import("./firebase-config.js");


        tipecoAuth =
            firebaseConfigModule.auth;

        tipecoDb =
            firebaseConfigModule.db;


        /*
         * Firestore functions
         */

        const firestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        firestoreCollection =
            firestoreModule.collection;

        firestoreGetDocs =
            firestoreModule.getDocs;

        firestoreQuery =
            firestoreModule.query;

        firestoreOrderBy =
            firestoreModule.orderBy;

        firestoreLimit =
            firestoreModule.limit;


        console.log(
            "TIPECO: Firebase Dashboard initialized."
        );


        return true;

    } catch (error) {

        console.error(
            "TIPECO: Firebase Dashboard initialization failed.",
            error
        );


        return false;

    }

}


/* =====================================================
   DOM INITIALIZATION
===================================================== */

function initializeOwnerDOM() {

    ownerSidebar =
        document.getElementById(
            "ownerSidebar"
        );

    sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );

    ownerLogoutBtn =
        document.getElementById(
            "ownerLogoutBtn"
        );

    ownerNavLinks =
        document.querySelectorAll(
            ".owner-nav a"
        );

    quickActionButtons =
        document.querySelectorAll(
            ".quick-action"
        );

    notificationBtn =
        document.getElementById(
            "notificationBtn"
        );

    ownerNameElement =
        document.getElementById(
            "ownerName"
        );

    totalUsersElement =
        document.getElementById(
            "totalUsers"
        );

    totalListingsElement =
        document.getElementById(
            "totalListings"
        );

    pendingListingsElement =
        document.getElementById(
            "pendingListings"
        );

    approvedListingsElement =
        document.getElementById(
            "approvedListings"
        );

    totalAgentsElement =
        document.getElementById(
            "totalAgents"
        );

    totalReportsElement =
        document.getElementById(
            "totalReports"
        );

    recentUsersElement =
        document.getElementById(
            "recentUsers"
        );

    recentListingsElement =
        document.getElementById(
            "recentListings"
        );

    activityListElement =
        document.getElementById(
            "activityList"
        );

    notificationCountElement =
        document.getElementById(
            "notificationCount"
        );

}


/* =====================================================
   FIREBASE OWNER AUTHORIZATION
===================================================== */

async function protectOwnerDashboard() {

    try {

        /*
         * auth.js V7.1 exposes this function globally.
         */

        if (
            typeof window.tipecoRequireOwner !==
            "function"
        ) {

            console.error(
                "TIPECO: tipecoRequireOwner() is not available."
            );


            window.location.href =
                "../login.html";

            return false;

        }


        const authorized =
            await window.tipecoRequireOwner();


        if (!authorized) {

            return false;

        }


        console.log(
            "TIPECO: Owner dashboard authorization successful."
        );


        return true;

    } catch (error) {

        console.error(
            "TIPECO: Owner protection error.",
            error
        );


        window.location.href =
            "../login.html";

        return false;

    }

}


/* =====================================================
   GET CURRENT FIREBASE USER
===================================================== */

function getFirebaseCurrentUser() {

    if (
        typeof window.getTipecoCurrentUser ===
        "function"
    ) {

        return window.getTipecoCurrentUser();

    }


    if (tipecoAuth) {

        return tipecoAuth.currentUser;

    }


    return null;

}


/* =====================================================
   GET OWNER FIRESTORE PROFILE
===================================================== */

async function getOwnerFirestoreProfile() {

    try {

        if (
            typeof window.getTipecoUserProfile !==
            "function"
        ) {

            return null;

        }


        const profile =
            await window.getTipecoUserProfile();


        if (!profile) {

            return null;

        }


        return profile;

    } catch (error) {

        console.error(
            "TIPECO: Failed to load Owner profile.",
            error
        );


        return null;

    }

}


/* =====================================================
   OWNER PROFILE
===================================================== */

async function loadOwnerProfile() {

    try {

        const profile =
            await getOwnerFirestoreProfile();


        if (!profile) {

            console.warn(
                "TIPECO: Owner profile not available."
            );

            return;

        }


        const name =
            profile.name ||
            profile.fullName ||
            profile.username ||
            profile.email ||
            "Owner";


        if (ownerNameElement) {

            ownerNameElement.textContent =
                name;

        }


        /*
         * Owner avatar
         */

        const avatar =
            document.querySelector(
                ".owner-avatar"
            );


        if (avatar) {

            avatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "O";

        }


        /*
         * Optional email fields
         */

        const ownerEmailElements =
            document.querySelectorAll(
                "[data-owner-email]"
            );


        ownerEmailElements.forEach(
            function (element) {

                element.textContent =
                    profile.email ||
                    "—";

            }
        );


        console.log(
            "TIPECO: Owner profile loaded.",
            profile
        );


    } catch (error) {

        console.error(
            "TIPECO: Owner profile loading error.",
            error
        );

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

                            if (
                                item.parentElement
                            ) {

                                item.parentElement.classList.remove(
                                    "active"
                                );

                            }

                        }
                    );


                    if (
                        link.parentElement
                    ) {

                        link.parentElement.classList.add(
                            "active"
                        );

                    }

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
   LOAD USERS FROM FIRESTORE
===================================================== */

async function loadOwnerUsers() {

    try {

        if (
            !tipecoDb ||
            !firestoreCollection ||
            !firestoreGetDocs
        ) {

            console.warn(
                "TIPECO: Firestore is not ready."
            );

            return [];

        }


        const usersCollection =
            firestoreCollection(
                tipecoDb,
                FIRESTORE_USERS_COLLECTION
            );


        const snapshot =
            await firestoreGetDocs(
                usersCollection
            );


        const users = [];


        snapshot.forEach(
            function (documentSnapshot) {

                users.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        return users;

    } catch (error) {

        console.error(
            "TIPECO: Failed to load Firestore users.",
            error
        );


        return [];

    }

}


/* =====================================================
   LOAD REPORTS FROM FIRESTORE
===================================================== */

async function loadOwnerReports() {

    try {

        if (
            !tipecoDb ||
            !firestoreCollection ||
            !firestoreGetDocs
        ) {

            return [];

        }


        const reportsCollection =
            firestoreCollection(
                tipecoDb,
                FIRESTORE_REPORTS_COLLECTION
            );


        const snapshot =
            await firestoreGetDocs(
                reportsCollection
            );


        const reports = [];


        snapshot.forEach(
            function (documentSnapshot) {

                reports.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        return reports;

    } catch (error) {

        /*
         * Reports collection may not exist yet.
         * In that case dashboard simply shows 0.
         */

        console.warn(
            "TIPECO: Reports could not be loaded.",
            error
        );


        return [];

    }

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
        listing.userName ||
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


    /*
     * Firestore Timestamp support
     */

    if (
        value &&
        typeof value.toDate ===
        "function"
    ) {

        const firestoreDate =
            value.toDate();


        return firestoreDate.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

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
   DATE VALUE FOR SORTING
===================================================== */

function getDateValue(value) {

    if (
        value &&
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    const date =
        new Date(
            value || 0
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return new Date(0);

    }


    return date;

}


/* =====================================================
   LOAD DASHBOARD STATISTICS
===================================================== */

async function loadDashboardStatistics() {

    const usersPromise =
        loadOwnerUsers();


    const listingsPromise =
        loadOwnerListings();


    const reportsPromise =
        loadOwnerReports();


    const [
        users,
        listings,
        reports
    ] =
        await Promise.all([
            usersPromise,
            listingsPromise,
            reportsPromise
        ]);


    /* =================================================
       USERS
    ================================================= */

    const totalUsers =
        users.length;


    /* =================================================
       LISTINGS
    ================================================= */

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


    /* =================================================
       AGENTS
    ================================================= */

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


    /* =================================================
       REPORTS
    ================================================= */

    const reportsCount =
        reports.length;


    /* =================================================
       UPDATE DOM
    ================================================= */

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


    /* =================================================
       NOTIFICATIONS
    ================================================= */

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
        reports,

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
                    getDateValue(
                        a.createdAt ||
                        a.joinedAt ||
                        a.registeredAt
                    );


                const dateB =
                    getDateValue(
                        b.createdAt ||
                        b.joinedAt ||
                        b.registeredAt
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
                user.accountStatus ||
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
                    getDateValue(
                        a.createdAt ||
                        a.date
                    );


                const dateB =
                    getDateValue(
                        b.createdAt ||
                        b.date
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

function renderActivity(
    users,
    listings,
    reports
) {

    if (!activityListElement) {

        return;

    }


    const activities = [];


    /* =================================================
       USERS
    ================================================= */

    users.forEach(
        function (user) {

            activities.push({

                type:
                    "user",

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


    /* =================================================
       LISTINGS
    ================================================= */

    listings.forEach(
        function (listing) {

            activities.push({

                type:
                    "listing",

                date:
                    listing.createdAt ||
                    listing.date ||
                    0,

                text:
                    "New listing submitted: " +
                    getListingTitle(
                        listing
                    )

            });

        }
    );


    /* =================================================
       REPORTS
    ================================================= */

    if (Array.isArray(reports)) {

        reports.forEach(
            function (report) {

                activities.push({

                    type:
                        "report",

                    date:
                        report.createdAt ||
                        report.date ||
                        0,

                    text:
                        "New report submitted"

                });

            }
        );

    }


    /* =================================================
       SORT
    ================================================= */

    activities.sort(
        function (a, b) {

            return (
                getDateValue(b.date) -
                getDateValue(a.date)
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


            let icon =
                "📝";


            if (
                activity.type ===
                "user"
            ) {

                icon = "👤";

            } else if (
                activity.type ===
                "listing"
            ) {

                icon = "📋";

            } else if (
                activity.type ===
                "report"
            ) {

                icon = "⚠️";

            }


            item.innerHTML = `
                <span class="activity-icon">
                    ${icon}
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

                    showDashboardMessage(
                        "You have " +
                        data.pendingCount +
                        " listing(s) waiting for verification."
                    );


                    return;

                }


                if (
                    data.reportsCount > 0
                ) {

                    showDashboardMessage(
                        "You have " +
                        data.reportsCount +
                        " report(s) to review."
                    );


                    return;

                }


                showDashboardMessage(
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
   SAFE DASHBOARD MESSAGE
===================================================== */

function showDashboardMessage(message) {

    alert(
        message
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
        async function () {

            const confirmLogout =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {

                return;

            }


            try {

                /*
                 * Use Firebase logout from auth.js V7.1
                 */

                if (
                    typeof window.tipecoLogout ===
                    "function"
                ) {

                    await window.tipecoLogout();

                    return;

                }


                /*
                 * Emergency fallback
                 */

                sessionStorage.clear();


                window.location.href =
                    "../index.html";


            } catch (error) {

                console.error(
                    "TIPECO logout error:",
                    error
                );


                showDashboardMessage(
                    "Logout failed. Please try again."
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
            data.listings,
            data.reports
        );


        console.log(
            "TIPECO Owner Dashboard refreshed."
        );


        return data;

    } catch (error) {

        console.error(
            "TIPECO Dashboard refresh error:",
            error
        );


        return {

            users: [],
            listings: [],
            reports: [],

            pendingCount: 0,
            approvedCount: 0,

            totalAgents: 0,
            reportsCount: 0

        };

    }

}


/* =====================================================
   AUTO REFRESH
===================================================== */

function initializeAutoRefresh() {

    /*
     * Refresh every 10 seconds.
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


    /* =================================================
       DOM
    ================================================= */

    initializeOwnerDOM();


    /* =================================================
       FIREBASE
    ================================================= */

    const firebaseReady =
        await initializeFirebaseDashboard();


    if (!firebaseReady) {

        console.error(
            "TIPECO: Firebase Dashboard could not initialize."
        );


        return;

    }


    /* =================================================
       OWNER PROTECTION
    ================================================= */

    const authorized =
        await protectOwnerDashboard();


    if (!authorized) {

        return;

    }


    /* =================================================
       OWNER PROFILE
    ================================================= */

    await loadOwnerProfile();


    /* =================================================
       UI
    ================================================= */

    initializeSidebar();

    initializeNavigation();

    initializeQuickActions();

    initializeNotifications();

    initializeOwnerLogout();


    /* =================================================
       DASHBOARD DATA
    ================================================= */

    await refreshOwnerDashboard();


    /* =================================================
       AUTO REFRESH
    ================================================= */

    initializeAutoRefresh();


    console.log(
        "TIPECO GROUP Owner Dashboard V3.0 is ready."
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
