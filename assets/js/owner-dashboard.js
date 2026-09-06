/* =====================================================
   TIPECO GROUP - OWNER DASHBOARD
   Version: 5.0
   Firebase Owner Dashboard
   Fully Connected Dashboard Engine
===================================================== */


/* =====================================================
   IMPORTS
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
   CONFIGURATION
===================================================== */

const DASHBOARD_VERSION = "5.0";

const USERS_COLLECTION = "users";
const REPORTS_COLLECTION = "reports";

const OWNER_ROLE = "owner";

const PUBLIC_ACCOUNT_TYPES = [
    "buyer",
    "seller"
];

const CONTROLLED_ROLES = [
    "owner",
    "agent"
];

const REFRESH_INTERVAL = 10000;


/* =====================================================
   DOM HELPER
===================================================== */

function $(id) {
    return document.getElementById(id);
}


/* =====================================================
   DOM REFERENCES
===================================================== */

const ownerNameElement = $("ownerName");
const welcomeOwnerNameElement = $("welcomeOwnerName");
const ownerAvatarElement = $("ownerAvatar");

const totalUsersElement = $("totalUsers");
const totalListingsElement = $("totalListings");
const pendingListingsElement = $("pendingListings");
const approvedListingsElement = $("approvedListings");

const totalAgentsElement = $("totalAgents");
const totalReportsElement = $("totalReports");

const totalBuyersElement = $("totalBuyers");
const totalSellersElement = $("totalSellers");

const recentUsersElement = $("recentUsers");
const recentListingsElement = $("recentListings");

const activityListElement =
    $("activityList") ||
    $("recentActivity");

const notificationCountElement =
    $("notificationCount");

const sidebarElement =
    $("ownerSidebar");

const sidebarToggleElement =
    $("sidebarToggle");

const logoutButtonElement =
    $("ownerLogoutBtn") ||
    $("logoutBtn");


/* =====================================================
   DASHBOARD STATE
===================================================== */

let dashboardState = {

    users: [],
    listings: [],
    reports: [],

    sellers: [],
    buyers: [],
    agents: [],

    pendingListings: [],
    approvedListings: [],

    lastRefresh: null

};


/* =====================================================
   SAFE TEXT
===================================================== */

function safeText(value, fallback = "—") {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    return String(value);
}


/* =====================================================
   NORMALIZE VALUE
===================================================== */

function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


/* =====================================================
   GET CURRENT USER
===================================================== */

function getFirebaseCurrentUser() {

    if (
        typeof window.tipecoGetCurrentUser === "function"
    ) {
        return window.tipecoGetCurrentUser();
    }

    return auth.currentUser || null;

}


/* =====================================================
   GET CURRENT OWNER PROFILE
===================================================== */

async function getOwnerFirestoreProfile() {

    if (
        typeof window.tipecoGetCurrentProfile === "function"
    ) {
        return await window.tipecoGetCurrentProfile();
    }

    const currentUser =
        getFirebaseCurrentUser();

    if (!currentUser) {
        return null;
    }

    try {

        const profileSnapshot =
            await getDocs(
                collection(db, USERS_COLLECTION)
            );

        const matchingDocument =
            profileSnapshot.docs.find(
                docSnapshot =>
                    docSnapshot.id === currentUser.uid
            );

        if (!matchingDocument) {
            return null;
        }

        return {
            id: matchingDocument.id,
            ...matchingDocument.data()
        };

    } catch (error) {

        console.error(
            "TIPECO: Unable to load owner profile:",
            error
        );

        return null;
    }

}


/* =====================================================
   OWNER PROTECTION
===================================================== */

async function protectOwnerDashboard() {

    try {

        if (
            typeof window.tipecoRequireOwner !==
            "function"
        ) {

            console.error(
                "TIPECO: tipecoRequireOwner() is not available."
            );

            window.location.href = "login.html";

            return false;
        }


        const authorized =
            await window.tipecoRequireOwner();


        if (!authorized) {

            window.location.href =
                "login.html";

            return false;
        }


        const currentUser =
            getFirebaseCurrentUser();


        if (!currentUser) {

            window.location.href =
                "login.html";

            return false;
        }


        const profile =
            await getOwnerFirestoreProfile();


        if (!profile) {

            console.error(
                "TIPECO: Owner Firestore profile not found."
            );

            window.location.href =
                "login.html";

            return false;
        }


        const role =
            normalize(
                profile.role ||
                profile.userRole ||
                profile.accountType ||
                profile.type
            );


        if (role !== OWNER_ROLE) {

            console.error(
                "TIPECO: User is not an Owner."
            );

            window.location.href =
                "login.html";

            return false;
        }


        return true;

    } catch (error) {

        console.error(
            "TIPECO: Owner protection failed:",
            error
        );

        window.location.href =
            "login.html";

        return false;
    }

}


/* =====================================================
   LOAD OWNER PROFILE
===================================================== */

async function loadOwnerProfile() {

    try {

        const currentUser =
            getFirebaseCurrentUser();

        const profile =
            await getOwnerFirestoreProfile();


        const name = safeText(

            profile?.name ||

            profile?.fullName ||

            profile?.displayName ||

            profile?.username ||

            currentUser?.displayName ||

            currentUser?.email ||

            "TIPECO OWNER",

            "TIPECO OWNER"

        );


        if (ownerNameElement) {
            ownerNameElement.textContent = name;
        }


        if (welcomeOwnerNameElement) {
            welcomeOwnerNameElement.textContent =
                name;
        }


        if (ownerAvatarElement) {

            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();

            ownerAvatarElement.textContent =
                firstLetter || "T";
        }


        return profile;

    } catch (error) {

        console.error(
            "TIPECO: Owner profile loading error:",
            error
        );

        return null;
    }

}


/* =====================================================
   LOAD FIRESTORE USERS
===================================================== */

async function loadOwnerUsers() {

    try {

        const snapshot =
            await getDocs(
                collection(db, USERS_COLLECTION)
            );


        const users =
            snapshot.docs.map(
                documentSnapshot => ({

                    id: documentSnapshot.id,

                    ...documentSnapshot.data()

                })
            );


        dashboardState.users =
            users;


        return users;

    } catch (error) {

        console.error(
            "TIPECO: Users loading failed:",
            error
        );

        dashboardState.users = [];

        return [];
    }

}


/* =====================================================
   LOAD REPORTS
===================================================== */

async function loadOwnerReports() {

    try {

        const snapshot =
            await getDocs(
                collection(db, REPORTS_COLLECTION)
            );


        const reports =
            snapshot.docs.map(
                documentSnapshot => ({

                    id: documentSnapshot.id,

                    ...documentSnapshot.data()

                })
            );


        dashboardState.reports =
            reports;


        return reports;

    } catch (error) {

        console.warn(
            "TIPECO: Reports collection unavailable:",
            error
        );

        dashboardState.reports = [];

        return [];
    }

}


/* =====================================================
   LOAD INDEXEDDB LISTINGS
===================================================== */

async function loadOwnerListings() {

    try {

        let listings = [];


        if (
            typeof window.getTipecoListings ===
            "function"
        ) {

            listings =
                await window.getTipecoListings();

        }

        else if (
            typeof window.getListings ===
            "function"
        ) {

            listings =
                await window.getListings();

        }

        else {

            console.warn(
                "TIPECO: Listing storage function not found."
            );

        }


        if (!Array.isArray(listings)) {
            listings = [];
        }


        dashboardState.listings =
            listings;


        return listings;

    } catch (error) {

        console.error(
            "TIPECO: Listings loading failed:",
            error
        );

        dashboardState.listings = [];

        return [];
    }

}


/* =====================================================
   USER ROLE
===================================================== */

function getUserRole(user) {

    const role =
        normalize(

            user?.role ||

            user?.userRole ||

            user?.accountType ||

            user?.type

        );


    if (
        PUBLIC_ACCOUNT_TYPES.includes(role)
    ) {
        return role;
    }


    if (
        CONTROLLED_ROLES.includes(role)
    ) {
        return role;
    }


    return "unknown";

}


/* =====================================================
   LISTING STATUS
===================================================== */

function getListingStatus(listing) {

    const rawStatus =
        normalize(

            listing?.status ||

            listing?.verificationStatus ||

            listing?.approvalStatus ||

            listing?.listingStatus

        );


    if (!rawStatus) {
        return "pending";
    }


    return rawStatus;

}


/* =====================================================
   PENDING STATUS
===================================================== */

function isPendingListing(listing) {

    const status =
        getListingStatus(listing);


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
        getListingStatus(listing);


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

    return safeText(

        listing?.title ||

        listing?.name ||

        listing?.listingTitle ||

        listing?.productName ||

        "Untitled Listing",

        "Untitled Listing"

    );

}


/* =====================================================
   LISTING CATEGORY
===================================================== */

function getListingCategory(listing) {

    return safeText(

        listing?.category ||

        listing?.listingCategory ||

        listing?.type ||

        listing?.propertyType ||

        "Other",

        "Other"

    );

}


/* =====================================================
   LISTING OWNER
===================================================== */

function getListingOwner(listing) {

    return safeText(

        listing?.ownerName ||

        listing?.sellerName ||

        listing?.userName ||

        listing?.fullName ||

        listing?.name ||

        listing?.email ||

        listing?.userEmail ||

        "Unknown",

        "Unknown"

    );

}


/* =====================================================
   USER NAME
===================================================== */

function getUserName(user) {

    return safeText(

        user?.name ||

        user?.fullName ||

        user?.displayName ||

        user?.username ||

        user?.email ||

        "Unknown User",

        "Unknown User"

    );

}


/* =====================================================
   USER CONTACT
===================================================== */

function getUserContact(user) {

    return safeText(

        user?.email ||

        user?.phone ||

        user?.telephone ||

        user?.phoneNumber ||

        "—",

        "—"

    );

}


/* =====================================================
   USER STATUS
===================================================== */

function getUserStatus(user) {

    return safeText(

        user?.accountStatus ||

        user?.status ||

        "active",

        "active"

    );

}


/* =====================================================
   DATE CONVERTER
===================================================== */

function convertDate(value) {

    if (!value) {
        return null;
    }


    if (
        typeof value?.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        typeof value === "object" &&
        value.seconds
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;
    }


    return date;

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(value) {

    const date =
        convertDate(value);


    if (!date) {
        return "—";
    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =====================================================
   SORT BY DATE
===================================================== */

function sortByDateDescending(items) {

    return [...items].sort(
        (a, b) => {

            const dateA =
                convertDate(
                    a?.createdAt ||
                    a?.updatedAt ||
                    a?.date
                )?.getTime() || 0;


            const dateB =
                convertDate(
                    b?.createdAt ||
                    b?.updatedAt ||
                    b?.date
                )?.getTime() || 0;


            return dateB - dateA;
        }
    );

}


/* =====================================================
   LOAD DASHBOARD STATISTICS
===================================================== */

function loadDashboardStatistics() {

    const users =
        dashboardState.users;

    const listings =
        dashboardState.listings;

    const reports =
        dashboardState.reports;


    const buyers =
        users.filter(
            user =>
                getUserRole(user) === "buyer"
        );


    const sellers =
        users.filter(
            user =>
                getUserRole(user) === "seller"
        );


    const agents =
        users.filter(
            user =>
                getUserRole(user) === "agent"
        );


    const pendingListings =
        listings.filter(
            listing =>
                isPendingListing(listing)
        );


    const approvedListings =
        listings.filter(
            listing =>
                isApprovedListing(listing)
        );


    dashboardState.buyers =
        buyers;

    dashboardState.sellers =
        sellers;

    dashboardState.agents =
        agents;

    dashboardState.pendingListings =
        pendingListings;

    dashboardState.approvedListings =
        approvedListings;


    if (totalUsersElement) {
        totalUsersElement.textContent =
            users.length;
    }


    if (totalListingsElement) {
        totalListingsElement.textContent =
            listings.length;
    }


    if (pendingListingsElement) {
        pendingListingsElement.textContent =
            pendingListings.length;
    }


    if (approvedListingsElement) {
        approvedListingsElement.textContent =
            approvedListings.length;
    }


    if (totalAgentsElement) {
        totalAgentsElement.textContent =
            agents.length;
    }


    if (totalReportsElement) {
        totalReportsElement.textContent =
            reports.length;
    }


    if (totalBuyersElement) {
        totalBuyersElement.textContent =
            buyers.length;
    }


    if (totalSellersElement) {
        totalSellersElement.textContent =
            sellers.length;
    }


    updateNotificationCount(
        pendingListings.length +
        reports.length
    );

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

function updateNotificationCount(count) {

    if (!notificationCountElement) {
        return;
    }


    notificationCountElement.textContent =
        count > 99
            ? "99+"
            : String(count);


    notificationCountElement.style.display =
        count > 0
            ? ""
            : "none";

}


/* =====================================================
   RENDER RECENT USERS
===================================================== */

function renderRecentUsers() {

    if (!recentUsersElement) {
        return;
    }


    const users =
        sortByDateDescending(
            dashboardState.users
        ).slice(0, 5);


    if (!users.length) {

        recentUsersElement.innerHTML = `
            <tr>
                <td colspan="5">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    recentUsersElement.innerHTML =
        users.map(user => {

            const role =
                getUserRole(user);

            const status =
                getUserStatus(user);


            return `
                <tr>

                    <td>
                        ${safeText(
                            getUserName(user)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            getUserContact(user)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            role,
                            "unknown"
                        )}
                    </td>

                    <td>
                        ${safeText(
                            status,
                            "active"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            user.createdAt ||
                            user.updatedAt
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


/* =====================================================
   RENDER RECENT LISTINGS
===================================================== */

function renderRecentListings() {

    if (!recentListingsElement) {
        return;
    }


    const listings =
        sortByDateDescending(
            dashboardState.listings
        ).slice(0, 5);


    if (!listings.length) {

        recentListingsElement.innerHTML = `
            <tr>
                <td colspan="5">
                    No listings found.
                </td>
            </tr>
        `;

        return;
    }


    recentListingsElement.innerHTML =
        listings.map(listing => {

            const status =
                getListingStatus(listing);


            return `
                <tr>

                    <td>
                        ${safeText(
                            getListingTitle(listing)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            getListingOwner(listing)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            getListingCategory(listing)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            status
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            listing.createdAt ||
                            listing.updatedAt ||
                            listing.date
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


/* =====================================================
   RENDER ACTIVITY
===================================================== */

function renderActivity() {

    if (!activityListElement) {
        return;
    }


    const activities = [];


    const recentUsers =
        sortByDateDescending(
            dashboardState.users
        ).slice(0, 3);


    recentUsers.forEach(user => {

        activities.push({

            date:
                convertDate(
                    user.createdAt ||
                    user.updatedAt
                ),

            text:
                `${getUserName(user)} joined TIPECO GROUP.`

        });

    });


    const recentListings =
        sortByDateDescending(
            dashboardState.listings
        ).slice(0, 3);


    recentListings.forEach(listing => {

        activities.push({

            date:
                convertDate(
                    listing.createdAt ||
                    listing.updatedAt ||
                    listing.date
                ),

            text:
                `New listing: ${getListingTitle(listing)}.`

        });

    });


    const recentReports =
        sortByDateDescending(
            dashboardState.reports
        ).slice(0, 2);


    recentReports.forEach(report => {

        activities.push({

            date:
                convertDate(
                    report.createdAt ||
                    report.updatedAt ||
                    report.date
                ),

            text:
                "A new report requires Owner attention."

        });

    });


    activities.sort(
        (a, b) =>
            (b.date?.getTime() || 0) -
            (a.date?.getTime() || 0)
    );


    const visibleActivities =
        activities.slice(0, 8);


    if (!visibleActivities.length) {

        activityListElement.innerHTML = `
            <li>
                No recent activity.
            </li>
        `;

        return;
    }


    activityListElement.innerHTML =
        visibleActivities.map(
            activity => {

                return `
                    <li>

                        <span>
                            ${safeText(
                                activity.text
                            )}
                        </span>

                        <small>
                            ${formatDate(
                                activity.date
                            )}
                        </small>

                    </li>
                `;

            }
        ).join("");

}


/* =====================================================
   SIDEBAR
===================================================== */

function initializeSidebar() {

    if (
        !sidebarElement ||
        !sidebarToggleElement
    ) {
        return;
    }


    sidebarToggleElement.addEventListener(
        "click",
        () => {

            sidebarElement.classList.toggle(
                "active"
            );

        }
    );

}


/* =====================================================
   NAVIGATION
===================================================== */

function initializeNavigation() {

    const navigationLinks =
        document.querySelectorAll(
            "[data-section]"
        );


    navigationLinks.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const sectionId =
                    link.getAttribute(
                        "data-section"
                    );


                if (!sectionId) {
                    return;
                }


                event.preventDefault();


                navigationLinks.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                link.classList.add(
                    "active"
                );


                const section =
                    document.getElementById(
                        sectionId
                    );


                if (section) {

                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }


                if (
                    sidebarElement &&
                    window.innerWidth <= 900
                ) {

                    sidebarElement.classList.remove(
                        "active"
                    );

                }

            }
        );

    });

}


/* =====================================================
   LOGOUT
===================================================== */

function initializeLogout() {

    if (!logoutButtonElement) {
        return;
    }


    logoutButtonElement.addEventListener(
        "click",
        async event => {

            event.preventDefault();


            try {

                if (
                    typeof window.tipecoLogout ===
                    "function"
                ) {

                    await window.tipecoLogout();

                } else {

                    window.location.href =
                        "login.html";

                }

            } catch (error) {

                console.error(
                    "TIPECO: Logout failed:",
                    error
                );

                window.location.href =
                    "login.html";
            }

        }
    );

}


/* =====================================================
   DASHBOARD DATA REFRESH
===================================================== */

async function refreshOwnerDashboard() {

    try {

        console.log(
            "TIPECO: Refreshing Owner Dashboard..."
        );


        const results =
            await Promise.all([

                loadOwnerUsers(),

                loadOwnerListings(),

                loadOwnerReports()

            ]);


        dashboardState.users =
            results[0] || [];

        dashboardState.listings =
            results[1] || [];

        dashboardState.reports =
            results[2] || [];


        loadDashboardStatistics();

        renderRecentUsers();

        renderRecentListings();

        renderActivity();


        dashboardState.lastRefresh =
            new Date();


        console.log(
            "TIPECO: Owner Dashboard refreshed.",
            dashboardState.lastRefresh
        );


    } catch (error) {

        console.error(
            "TIPECO: Dashboard refresh failed:",
            error
        );

    }

}


/* =====================================================
   AUTO REFRESH
===================================================== */

function initializeAutoRefresh() {

    setInterval(
        async () => {

            const currentUser =
                getFirebaseCurrentUser();


            if (!currentUser) {
                return;
            }


            await refreshOwnerDashboard();

        },
        REFRESH_INTERVAL
    );

}


/* =====================================================
   SHOW DASHBOARD
===================================================== */

function showOwnerDashboard() {

    document.body.classList.add(
        "owner-authenticated"
    );


    const dashboard =
        document.querySelector(
            ".owner-dashboard"
        );


    if (dashboard) {

        dashboard.style.display =
            "";

    }


    const loadingScreen =
        document.getElementById(
            "ownerAuthLoading"
        );


    if (loadingScreen) {

        loadingScreen.style.display =
            "none";

    }

}


/* =====================================================
   INITIALIZE OWNER DASHBOARD
===================================================== */

async function initializeOwnerDashboard() {

    console.log(
        `TIPECO GROUP Owner Dashboard V${DASHBOARD_VERSION} starting...`
    );


    const authorized =
        await protectOwnerDashboard();


    if (!authorized) {
        return;
    }


    await loadOwnerProfile();


    initializeSidebar();

    initializeNavigation();

    initializeLogout();


    showOwnerDashboard();


    await refreshOwnerDashboard();


    initializeAutoRefresh();


    console.log(
        `TIPECO GROUP Owner Dashboard V${DASHBOARD_VERSION} loaded successfully.`
    );

}


/* =====================================================
   DOM READY
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
