/* =====================================================
   TIPECO GROUP - OWNER DASHBOARD
   Version: 6.0
   Firebase Owner Dashboard
   Listing Review + Verification Engine
   IndexedDB Media Support
===================================================== */


/* =====================================================
   AUTH
===================================================== */

import "./auth.js";


/* =====================================================
   FIREBASE
===================================================== */

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

const DASHBOARD_VERSION = "6.0";

const USERS_COLLECTION = "users";
const REPORTS_COLLECTION = "reports";

const OWNER_ROLE = "owner";

const REFRESH_INTERVAL = 10000;

const PUBLIC_ACCOUNT_TYPES = [
    "buyer",
    "seller"
];

const CONTROLLED_ROLES = [
    "owner",
    "agent"
];


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
   DOM HELPERS
===================================================== */

function getElement(id) {

    return document.getElementById(id);

}


function safeText(value, fallback = "—") {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return String(value);

}


function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


/* =====================================================
   CURRENT FIREBASE USER
===================================================== */

function getFirebaseCurrentUser() {

    try {

        if (
            typeof window.tipecoGetCurrentUser ===
            "function"
        ) {

            return window.tipecoGetCurrentUser();

        }

    } catch (error) {

        console.warn(
            "Unable to read TIPECO current user.",
            error
        );

    }

    return auth.currentUser || null;

}


/* =====================================================
   OWNER PROFILE
===================================================== */

async function getOwnerFirestoreProfile() {

    const currentUser =
        getFirebaseCurrentUser();

    if (!currentUser) {

        return null;

    }


    try {

        if (
            typeof window.tipecoGetCurrentProfile ===
            "function"
        ) {

            const profile =
                await window.tipecoGetCurrentProfile();

            if (profile) {

                return profile;

            }

        }

    } catch (error) {

        console.warn(
            "TIPECO profile helper failed.",
            error
        );

    }


    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    USERS_COLLECTION
                )
            );


        for (
            const document
            of usersSnapshot.docs
        ) {

            if (
                document.id ===
                currentUser.uid
            ) {

                return {

                    id: document.id,

                    ...document.data()

                };

            }

        }

    } catch (error) {

        console.error(
            "Unable to load Owner profile.",
            error
        );

    }


    return null;

}


/* =====================================================
   PROTECT OWNER DASHBOARD
===================================================== */

async function protectOwnerDashboard() {

    try {

        if (
            typeof window.tipecoRequireOwner !==
            "function"
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        const authorized =
            await window.tipecoRequireOwner();


        if (!authorized) {

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


        if (
            role !== OWNER_ROLE
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        return true;

    } catch (error) {

        console.error(
            "Owner authorization failed.",
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

    const currentUser =
        getFirebaseCurrentUser();

    if (!currentUser) {

        return;

    }


    const profile =
        await getOwnerFirestoreProfile();


    const name =
        safeText(

            profile?.name ||

            profile?.fullName ||

            profile?.displayName ||

            profile?.username ||

            currentUser.displayName ||

            currentUser.email,

            "TIPECO OWNER"

        );


    const ownerName =
        getElement("ownerName");

    const welcomeOwnerName =
        getElement("welcomeOwnerName");

    const ownerAvatar =
        getElement("ownerAvatar");


    if (ownerName) {

        ownerName.textContent =
            name;

    }


    if (welcomeOwnerName) {

        welcomeOwnerName.textContent =
            name;

    }


    if (ownerAvatar) {

        ownerAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =====================================================
   LOAD USERS
===================================================== */

async function loadOwnerUsers() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    USERS_COLLECTION
                )
            );


        dashboardState.users =
            snapshot.docs.map(
                document => ({

                    id: document.id,

                    ...document.data()

                })
            );


        return dashboardState.users;

    } catch (error) {

        console.error(
            "Unable to load Owner users.",
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
                collection(
                    db,
                    REPORTS_COLLECTION
                )
            );


        dashboardState.reports =
            snapshot.docs.map(
                document => ({

                    id: document.id,

                    ...document.data()

                })
            );


        return dashboardState.reports;

    } catch (error) {

        console.warn(
            "Reports collection unavailable.",
            error
        );

        dashboardState.reports = [];

        return [];

    }

}


/* =====================================================
   LOAD LISTINGS
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


        if (
            !Array.isArray(listings)
        ) {

            listings = [];

        }


        dashboardState.listings =
            listings;


        return listings;

    } catch (error) {

        console.error(
            "Unable to load IndexedDB listings.",
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


    return "";

}


/* =====================================================
   LISTING STATUS
===================================================== */

function getListingStatus(listing) {

    return normalize(

        listing?.status ||

        listing?.verificationStatus ||

        listing?.approvalStatus ||

        listing?.listingStatus ||

        "pending"

    );

}


function isPendingListing(listing) {

    const status =
        getListingStatus(listing);


    return [

        "pending",

        "submitted",

        "pending_verification",

        "pending_review",

        "under_review",

        "awaiting_verification",

        "needs_changes"

    ].includes(status);

}


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
   LISTING DATA HELPERS
===================================================== */

function getListingTitle(listing) {

    return safeText(

        listing?.title ||

        listing?.name ||

        listing?.listingTitle ||

        listing?.productName,

        "Untitled Listing"

    );

}


function getListingCategory(listing) {

    return safeText(

        listing?.category ||

        listing?.listingCategory ||

        listing?.type ||

        listing?.propertyType,

        "Other"

    );

}


function getListingOwner(listing) {

    return safeText(

        listing?.ownerName ||

        listing?.sellerName ||

        listing?.userName ||

        listing?.fullName ||

        listing?.name ||

        listing?.email ||

        listing?.userEmail,

        "Unknown Seller"

    );

}


function getListingOwnerEmail(listing) {

    return safeText(

        listing?.ownerEmail ||

        listing?.sellerEmail ||

        listing?.userEmail,

        "—"

    );

}


function getListingOwnerPhone(listing) {

    return safeText(

        listing?.ownerPhone ||

        listing?.contactPhone ||

        listing?.sellerPhone ||

        listing?.phone,

        "—"

    );

}


/* =====================================================
   DATE HELPERS
===================================================== */

function convertDate(value) {

    if (!value) {

        return null;

    }


    try {

        if (
            typeof value.toDate ===
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
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date;

        }

    } catch (error) {

        console.warn(
            "Date conversion failed.",
            error
        );

    }


    return null;

}


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


function getListingDate(listing) {

    return (

        listing?.updatedAt ||

        listing?.createdAt ||

        listing?.date ||

        null

    );

}


function sortByDateDescending(items) {

    return [...items].sort(
        (a, b) => {

            const dateA =
                convertDate(
                    getListingDate(a)
                )?.getTime() || 0;

            const dateB =
                convertDate(
                    getListingDate(b)
                )?.getTime() || 0;


            return dateB - dateA;

        }
    );

}


/* =====================================================
   USER HELPERS
===================================================== */

function getUserName(user) {

    return safeText(

        user?.fullName ||

        user?.name ||

        user?.displayName ||

        user?.username ||

        user?.email,

        "Unknown User"

    );

}


function getUserContact(user) {

    return safeText(

        user?.phone ||

        user?.email,

        "—"

    );


}


function getUserStatus(user) {

    return safeText(

        user?.accountStatus ||

        user?.status,

        "active"

    );

}


/* =====================================================
   DASHBOARD STATISTICS
===================================================== */

function loadDashboardStatistics() {

    const users =
        dashboardState.users;


    const listings =
        dashboardState.listings;


    dashboardState.buyers =
        users.filter(
            user =>
                getUserRole(user) ===
                "buyer"
        );


    dashboardState.sellers =
        users.filter(
            user =>
                getUserRole(user) ===
                "seller"
        );


    dashboardState.agents =
        users.filter(
            user =>
                getUserRole(user) ===
                "agent"
        );


    dashboardState.pendingListings =
        listings.filter(
            isPendingListing
        );


    dashboardState.approvedListings =
        listings.filter(
            isApprovedListing
        );


    const stats = {

        totalUsers:
            users.length,

        totalListings:
            listings.length,

        pendingListings:
            dashboardState.pendingListings.length,

        approvedListings:
            dashboardState.approvedListings.length,

        totalAgents:
            dashboardState.agents.length,

        totalReports:
            dashboardState.reports.length,

        totalBuyers:
            dashboardState.buyers.length,

        totalSellers:
            dashboardState.sellers.length

    };


    Object.entries(stats)
        .forEach(
            ([id, value]) => {

                const element =
                    getElement(id);


                if (element) {

                    element.textContent =
                        value;

                }

            }
        );


    updateNotificationCount(

        dashboardState.pendingListings.length +
        dashboardState.reports.length

    );

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

function updateNotificationCount(count) {

    const element =
        getElement(
            "notificationCount"
        );


    if (!element) {

        return;

    }


    if (count <= 0) {

        element.textContent =
            "";

        element.style.display =
            "none";

        return;

    }


    element.textContent =
        count > 99
            ? "99+"
            : String(count);


    element.style.display =
        "";

}


/* =====================================================
   RECENT USERS
===================================================== */

function renderRecentUsers() {

    const container =
        getElement(
            "recentUsers"
        );


    if (!container) {

        return;

    }


    const users =
        sortByDateDescending(
            dashboardState.users
        ).slice(0, 5);


    if (!users.length) {

        container.innerHTML = `

            <tr>

                <td colspan="5">
                    No users found.
                </td>

            </tr>

        `;

        return;

    }


    container.innerHTML =
        users.map(
            user => `

                <tr>

                    <td>
                        ${safeText(
                            getUserName(user)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            user.email
                        )}
                    </td>

                    <td>
                        ${safeText(
                            getUserContact(user)
                        )}
                    </td>

                    <td>
                        ${safeText(
                            getUserRole(user),
                            "user"
                        )}
                    </td>

                    <td>
                        ${safeText(
                            getUserStatus(user)
                        )}
                    </td>

                </tr>

            `
        ).join("");

}


/* =====================================================
   RECENT LISTINGS
===================================================== */

function renderRecentListings() {

    const container =
        getElement(
            "recentListings"
        );


    if (!container) {

        return;

    }


    const listings =
        sortByDateDescending(
            dashboardState.listings
        ).slice(0, 5);


    if (!listings.length) {

        container.innerHTML = `

            <tr>

                <td colspan="6">
                    No listings found.
                </td>

            </tr>

        `;

        return;

    }


    container.innerHTML =
        listings.map(
            listing => {

                const status =
                    getListingStatus(
                        listing
                    );


                return `

                    <tr>

                        <td>
                            ${safeText(
                                getListingTitle(
                                    listing
                                )
                            )}
                        </td>

                        <td>
                            ${safeText(
                                getListingCategory(
                                    listing
                                )
                            )}
                        </td>

                        <td>
                            ${safeText(
                                getListingOwner(
                                    listing
                                )
                            )}
                        </td>

                        <td>
                            ${safeText(
                                listing.price,
                                "—"
                            )}
                        </td>

                        <td>
                            ${safeText(
                                status
                            )}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="tipeco-review-listing"
                                data-listing-id="${safeText(
                                    listing.id,
                                    ""
                                )}"
                            >
                                Review
                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");


    container
        .querySelectorAll(
            ".tipeco-review-listing"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const listingId =
                            button.dataset.listingId;


                        openListingReview(
                            listingId
                        );

                    }
                );

            }
        );

}


/* =====================================================
   ACTIVITY
===================================================== */

function renderActivity() {

    const container =
        getElement(
            "activityList"
        ) ||
        getElement(
            "recentActivity"
        );


    if (!container) {

        return;

    }


    const activities = [];


    sortByDateDescending(
        dashboardState.users
    )
        .slice(0, 3)
        .forEach(
            user => {

                activities.push({

                    date:
                        getListingDate(user),

                    text:
                        `New user registered: ${getUserName(user)}`

                });

            }
        );


    sortByDateDescending(
        dashboardState.listings
    )
        .slice(0, 3)
        .forEach(
            listing => {

                activities.push({

                    date:
                        getListingDate(listing),

                    text:
                        `Listing submitted: ${getListingTitle(listing)}`

                });

            }
        );


    sortByDateDescending(
        dashboardState.reports
    )
        .slice(0, 2)
        .forEach(
            report => {

                activities.push({

                    date:
                        getListingDate(report),

                    text:
                        "A new report requires Owner attention."

                });

            }
        );


    activities.sort(
        (a, b) => {

            const dateA =
                convertDate(
                    a.date
                )?.getTime() || 0;

            const dateB =
                convertDate(
                    b.date
                )?.getTime() || 0;


            return dateB - dateA;

        }
    );


    const finalActivities =
        activities.slice(0, 8);


    if (!finalActivities.length) {

        container.innerHTML = `

            <div class="empty-state">
                No recent activity.
            </div>

        `;

        return;

    }


    container.innerHTML =
        finalActivities.map(
            activity => `

                <div class="activity-item">

                    <div>
                        ${safeText(
                            activity.text
                        )}
                    </div>

                    <small>
                        ${formatDate(
                            activity.date
                        )}
                    </small>

                </div>

            `
        ).join("");

}


/* =====================================================
   INDEXEDDB MEDIA
===================================================== */

function openTipecoMediaDB() {

    return new Promise(
        (resolve, reject) => {

            if (!window.indexedDB) {

                reject(
                    new Error(
                        "IndexedDB is not supported."
                    )
                );

                return;

            }


            const request =
                indexedDB.open(
                    "tipecoMediaDB",
                    1
                );


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


async function getIndexedDBMedia(
    mediaId
) {

    if (!mediaId) {

        return null;

    }


    const db =
        await openTipecoMediaDB();


    return new Promise(
        (resolve, reject) => {

            try {

                const transaction =
                    db.transaction(
                        "media",
                        "readonly"
                    );


                const store =
                    transaction.objectStore(
                        "media"
                    );


                const request =
                    store.get(
                        mediaId
                    );


                request.onsuccess =
                    () => {

                        resolve(
                            request.result ||
                            null
                        );

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };


                transaction.oncomplete =
                    () => {

                        db.close();

                    };


            } catch (error) {

                try {

                    db.close();

                } catch (_) {}


                reject(error);

            }

        }
    );

}


/* =====================================================
   CREATE MEDIA URL
===================================================== */

function createMediaURL(
    media
) {

    if (
        !media ||
        !media.blob
    ) {

        return null;

    }


    try {

        return URL.createObjectURL(
            media.blob
        );

    } catch (error) {

        console.error(
            "Unable to create media URL.",
            error
        );

        return null;

    }

}


/* =====================================================
   LOAD LISTING MEDIA
===================================================== */

async function loadListingMedia(
    listing
) {

    const media = {

        photos: [],

        video: null

    };


    const mediaIds =
        Array.isArray(
            listing.mediaIds
        )
            ? listing.mediaIds
            : [];


    for (
        const mediaId
        of mediaIds
    ) {

        try {

            const record =
                await getIndexedDBMedia(
                    mediaId
                );


            if (
                !record
            ) {

                continue;

            }


            if (
                normalize(
                    record.kind
                ) === "photo"
            ) {

                const url =
                    createMediaURL(
                        record
                    );


                if (url) {

                    media.photos.push({

                        id:
                            record.id,

                        name:
                            record.name,

                        type:
                            record.type,

                        url

                    });

                }

            }

        } catch (error) {

            console.warn(
                "Unable to load listing photo.",
                mediaId,
                error
            );

        }

    }


    if (
        listing.videoMediaId
    ) {

        try {

            const record =
                await getIndexedDBMedia(
                    listing.videoMediaId
                );


            if (record) {

                const url =
                    createMediaURL(
                        record
                    );


                if (url) {

                    media.video = {

                        id:
                            record.id,

                        name:
                            record.name,

                        type:
                            record.type,

                        url

                    };

                }

            }

        } catch (error) {

            console.warn(
                "Unable to load listing video.",
                error
            );

        }

    }


    return media;

}


/* =====================================================
   DYNAMIC REVIEW MODAL
===================================================== */

function ensureReviewModal() {

    let modal =
        getElement(
            "tipecoOwnerListingReviewModal"
        );


    if (modal) {

        return modal;

    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "tipecoOwnerListingReviewModal";


    modal.innerHTML = `

        <div
            class="tipeco-review-overlay"
            data-review-close="true"
        >

            <div
                class="tipeco-review-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tipecoReviewTitle"
            >

                <div class="tipeco-review-header">

                    <div>

                        <h2 id="tipecoReviewTitle">
                            Listing Review
                        </h2>

                        <p id="tipecoReviewStatus">
                            Pending verification
                        </p>

                    </div>

                    <button
                        type="button"
                        id="tipecoReviewClose"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <div
                    id="tipecoReviewBody"
                    class="tipeco-review-body"
                >

                    <div class="tipeco-review-loading">
                        Loading listing...
                    </div>

                </div>


                <div
                    id="tipecoReviewActions"
                    class="tipeco-review-actions"
                ></div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        #tipecoOwnerListingReviewModal {

            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;

        }

        #tipecoOwnerListingReviewModal.is-open {

            display: block;

        }

        .tipeco-review-overlay {

            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.72);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;

        }

        .tipeco-review-modal {

            width: min(1050px, 100%);
            max-height: 92vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 25px 80px rgba(0,0,0,.3);

        }

        .tipeco-review-header {

            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            padding: 22px;
            border-bottom: 1px solid #e5e7eb;

        }

        .tipeco-review-header h2 {

            margin: 0 0 6px;

        }

        .tipeco-review-header p {

            margin: 0;
            text-transform: capitalize;

        }

        #tipecoReviewClose {

            border: 0;
            background: transparent;
            font-size: 32px;
            line-height: 1;
            cursor: pointer;

        }

        .tipeco-review-body {

            padding: 22px;

        }

        .tipeco-review-grid {

            display: grid;
            grid-template-columns:
                minmax(0, 1.4fr)
                minmax(280px, 1fr);

            gap: 24px;

        }

        .tipeco-review-section {

            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 18px;

        }

        .tipeco-review-section h3 {

            margin-top: 0;

        }

        .tipeco-review-field {

            margin-bottom: 12px;

        }

        .tipeco-review-field strong {

            display: block;
            margin-bottom: 3px;

        }

        .tipeco-review-description {

            white-space: pre-wrap;
            line-height: 1.6;

        }

        .tipeco-media-grid {

            display: grid;
            grid-template-columns:
                repeat(auto-fill, minmax(130px, 1fr));

            gap: 10px;

        }

        .tipeco-media-grid img {

            width: 100%;
            aspect-ratio: 1 / 1;
            object-fit: cover;
            border-radius: 10px;
            display: block;

        }

        .tipeco-video {

            width: 100%;
            max-height: 420px;
            border-radius: 10px;

        }

        .tipeco-review-actions {

            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 18px 22px;
            border-top: 1px solid #e5e7eb;

        }

        .tipeco-review-action {

            border: 0;
            border-radius: 9px;
            padding: 11px 17px;
            cursor: pointer;
            font-weight: 600;

        }

        .tipeco-review-approve {

            background: #198754;
            color: #fff;

        }

        .tipeco-review-reject {

            background: #dc3545;
            color: #fff;

        }

        .tipeco-review-changes {

            background: #ffc107;
            color: #111;

        }

        .tipeco-review-cancel {

            background: #e5e7eb;
            color: #111;

        }

        .tipeco-review-loading {

            padding: 40px 10px;
            text-align: center;

        }

        @media (max-width: 750px) {

            .tipeco-review-grid {

                grid-template-columns: 1fr;

            }

            .tipeco-review-overlay {

                padding: 10px;

            }

            .tipeco-review-modal {

                max-height: 96vh;

            }

        }

    `;


    document.head.appendChild(
        style
    );


    const closeButton =
        getElement(
            "tipecoReviewClose"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeListingReview
        );

    }


    const overlay =
        modal.querySelector(
            ".tipeco-review-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeListingReview();

                }

            }
        );

    }


    return modal;

}


/* =====================================================
   OPEN LISTING REVIEW
===================================================== */

async function openListingReview(
    listingId
) {

    const listing =
        dashboardState.listings.find(
            item =>
                String(item.id) ===
                String(listingId)
        );


    if (!listing) {

        alert(
            "Listing could not be found."
        );

        return;

    }


    const modal =
        ensureReviewModal();


    const body =
        getElement(
            "tipecoReviewBody"
        );


    const status =
        getElement(
            "tipecoReviewStatus"
        );


    const actions =
        getElement(
            "tipecoReviewActions"
        );


    modal.classList.add(
        "is-open"
    );


    document.body.style.overflow =
        "hidden";


    if (status) {

        status.textContent =
            getListingStatus(
                listing
            );

    }


    if (body) {

        body.innerHTML = `

            <div class="tipeco-review-loading">

                Loading listing details and media...

            </div>

        `;

    }


    if (actions) {

        actions.innerHTML =
            "";

    }


    const media =
        await loadListingMedia(
            listing
        );


    const photosHtml =
        media.photos.length

            ? `

                <div class="tipeco-media-grid">

                    ${media.photos.map(
                        photo => `

                            <img
                                src="${photo.url}"
                                alt="${safeText(
                                    photo.name,
                                    "Listing photo"
                                )}"
                            >

                        `
                    ).join("")}

                </div>

            `

            : `

                <p>
                    No photos available in IndexedDB.
                </p>

            `;


    const videoHtml =
        media.video

            ? `

                <video
                    class="tipeco-video"
                    controls
                    preload="metadata"
                >

                    <source
                        src="${media.video.url}"
                        type="${safeText(
                            media.video.type,
                            "video/mp4"
                        )}"
                    >

                    Your browser does not support video playback.

                </video>

            `

            : `

                <p>
                    No video attached.
                </p>

            `;


    if (body) {

        body.innerHTML = `

            <div class="tipeco-review-grid">

                <div>

                    <section class="tipeco-review-section">

                        <h3>
                            Listing Information
                        </h3>

                        <div class="tipeco-review-field">

                            <strong>
                                Title
                            </strong>

                            <div>
                                ${safeText(
                                    getListingTitle(
                                        listing
                                    )
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Category
                            </strong>

                            <div>
                                ${safeText(
                                    getListingCategory(
                                        listing
                                    )
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Type
                            </strong>

                            <div>
                                ${safeText(
                                    listing.type
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Price
                            </strong>

                            <div>
                                ${safeText(
                                    listing.price
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Location
                            </strong>

                            <div>
                                ${safeText(
                                    listing.location
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Submitted
                            </strong>

                            <div>
                                ${formatDate(
                                    listing.createdAt
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Status
                            </strong>

                            <div>
                                ${safeText(
                                    getListingStatus(
                                        listing
                                    )
                                )}
                            </div>

                        </div>

                    </section>


                    <section class="tipeco-review-section">

                        <h3>
                            Description
                        </h3>

                        <div class="tipeco-review-description">

                            ${safeText(
                                listing.description,
                                "No description provided."
                            )}

                        </div>

                    </section>

                </div>


                <div>

                    <section class="tipeco-review-section">

                        <h3>
                            Seller Information
                        </h3>

                        <div class="tipeco-review-field">

                            <strong>
                                Name
                            </strong>

                            <div>
                                ${safeText(
                                    getListingOwner(
                                        listing
                                    )
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Email
                            </strong>

                            <div>
                                ${safeText(
                                    getListingOwnerEmail(
                                        listing
                                    )
                                )}
                            </div>

                        </div>


                        <div class="tipeco-review-field">

                            <strong>
                                Phone
                            </strong>

                            <div>
                                ${safeText(
                                    getListingOwnerPhone(
                                        listing
                                    )
                                )}
                            </div>

                        </div>

                    </section>


                    <section class="tipeco-review-section">

                        <h3>
                            Photos
                        </h3>

                        ${photosHtml}

                    </section>


                    <section class="tipeco-review-section">

                        <h3>
                            Video
                        </h3>

                        ${videoHtml}

                    </section>

                </div>

            </div>

        `;

    }


    renderReviewActions(
        listing
    );

}


/* =====================================================
   REVIEW ACTIONS
===================================================== */

function renderReviewActions(
    listing
) {

    const actions =
        getElement(
            "tipecoReviewActions"
        );


    if (!actions) {

        return;

    }


    const status =
        getListingStatus(
            listing
        );


    const canReview =
        ![
            "approved",
            "verified",
            "published",
            "active"
        ].includes(status);


    actions.innerHTML = `

        <button
            type="button"
            class="tipeco-review-action tipeco-review-cancel"
            id="tipecoReviewCancel"
        >
            Close
        </button>

    `;


    if (!canReview) {

        return;

    }


    actions.innerHTML += `

        <button
            type="button"
            class="tipeco-review-action tipeco-review-changes"
            id="tipecoReviewChanges"
        >
            Request Changes
        </button>


        <button
            type="button"
            class="tipeco-review-action tipeco-review-reject"
            id="tipecoReviewReject"
        >
            Reject
        </button>


        <button
            type="button"
            class="tipeco-review-action tipeco-review-approve"
            id="tipecoReviewApprove"
        >
            Approve
        </button>

    `;


    const cancel =
        getElement(
            "tipecoReviewCancel"
        );


    const changes =
        getElement(
            "tipecoReviewChanges"
        );


    const reject =
        getElement(
            "tipecoReviewReject"
        );


    const approve =
        getElement(
            "tipecoReviewApprove"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeListingReview
        );

    }


    if (changes) {

        changes.addEventListener(
            "click",
            () => {

                processListingDecision(
                    listing.id,
                    "needs_changes"
                );

            }
        );

    }


    if (reject) {

        reject.addEventListener(
            "click",
            () => {

                processListingDecision(
                    listing.id,
                    "rejected"
                );

            }
        );

    }


    if (approve) {

        approve.addEventListener(
            "click",
            () => {

                processListingDecision(
                    listing.id,
                    "approved"
                );

            }
        );

    }

}


/* =====================================================
   UPDATE INDEXEDDB LISTING
===================================================== */

async function updateListingInIndexedDB(
    listing
) {

    if (
        typeof window.updateTipecoListing ===
        "function"
    ) {

        return window.updateTipecoListing(
            listing
        );

    }


    if (
        typeof window.saveTipecoListing ===
        "function"
    ) {

        return window.saveTipecoListing(
            listing
        );

    }


    throw new Error(
        "TIPECO IndexedDB update function is unavailable."
    );

}


/* =====================================================
   LISTING DECISION
===================================================== */

async function processListingDecision(
    listingId,
    decision
) {

    const listing =
        dashboardState.listings.find(
            item =>
                String(item.id) ===
                String(listingId)
        );


    if (!listing) {

        alert(
            "Listing could not be found."
        );

        return;

    }


    const labels = {

        approved:
            "approve",

        rejected:
            "reject",

        needs_changes:
            "request changes"

    };


    const label =
        labels[decision] ||
        decision;


    const confirmed =
        window.confirm(

            `Are you sure you want to ${label} this listing?`

        );


    if (!confirmed) {

        return;

    }


    try {

        const now =
            new Date().toISOString();


        const updatedListing = {

            ...listing,

            status:
                decision,

            verificationStatus:
                decision,

            approvalStatus:
                decision,

            updatedAt:
                now,

            reviewedAt:
                now,

            reviewedBy:
                getFirebaseCurrentUser()?.uid ||
                "owner"

        };


        await updateListingInIndexedDB(
            updatedListing
        );


        const index =
            dashboardState.listings.findIndex(
                item =>
                    String(item.id) ===
                    String(listingId)
            );


        if (index !== -1) {

            dashboardState.listings[
                index
            ] =
                updatedListing;

        }


        loadDashboardStatistics();

        renderRecentListings();

        renderActivity();


        closeListingReview();


        const messages = {

            approved:
                "Listing approved successfully.",

            rejected:
                "Listing rejected successfully.",

            needs_changes:
                "Listing marked as needing changes."

        };


        alert(
            messages[decision] ||
            "Listing updated successfully."
        );


    } catch (error) {

        console.error(
            "Listing decision failed.",
            error
        );


        alert(

            "The listing could not be updated. " +
            "Please check that IndexedDB storage.js is loaded."

        );

    }

}


/* =====================================================
   CLOSE REVIEW
===================================================== */

function closeListingReview() {

    const modal =
        getElement(
            "tipecoOwnerListingReviewModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "is-open"
    );


    document.body.style.overflow =
        "";


    const body =
        getElement(
            "tipecoReviewBody"
        );


    if (body) {

        body.innerHTML =
            "";

    }


    const actions =
        getElement(
            "tipecoReviewActions"
        );


    if (actions) {

        actions.innerHTML =
            "";

    }

}


/* =====================================================
   SIDEBAR
===================================================== */

function initSidebar() {

    const sidebar =
        getElement(
            "ownerSidebar"
        );


    const toggle =
        getElement(
            "sidebarToggle"
        );


    if (
        sidebar &&
        toggle
    ) {

        toggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "active"
                );

            }
        );

    }


    const sectionLinks =
        document.querySelectorAll(
            "[data-section]"
        );


    sectionLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    sectionLinks.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    link.classList.add(
                        "active"
                    );


                    const sectionId =
                        link.dataset.section;


                    const target =
                        getElement(
                            sectionId
                        );


                    if (target) {

                        target.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }


                    if (
                        sidebar &&
                        window.innerWidth <= 900
                    ) {

                        sidebar.classList.remove(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

function initLogout() {

    const buttons =
        document.querySelectorAll(

            "#ownerLogoutBtn, " +
            "#logoutBtn, " +
            '[data-action="logout"]'

        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();


                    try {

                        if (
                            typeof window.tipecoLogout ===
                            "function"
                        ) {

                            await window.tipecoLogout();

                        }

                        else {

                            window.location.href =
                                "login.html";

                        }

                    } catch (error) {

                        console.error(
                            "Owner logout failed.",
                            error
                        );

                        window.location.href =
                            "login.html";

                    }

                }
            );

        }
    );

}


/* =====================================================
   REFRESH DASHBOARD
===================================================== */

async function refreshOwnerDashboard() {

    try {

        await Promise.all([

            loadOwnerUsers(),

            loadOwnerListings(),

            loadOwnerReports()

        ]);


        loadDashboardStatistics();

        renderRecentUsers();

        renderRecentListings();

        renderActivity();


        dashboardState.lastRefresh =
            new Date();


        console.log(
            `TIPECO Owner Dashboard ${DASHBOARD_VERSION} refreshed.`,
            dashboardState.lastRefresh
        );


    } catch (error) {

        console.error(
            "Owner dashboard refresh failed.",
            error
        );

    }

}


/* =====================================================
   AUTO REFRESH
===================================================== */

function initAutoRefresh() {

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


    const loading =
        getElement(
            "ownerAuthLoading"
        );


    if (loading) {

        loading.style.display =
            "none";

    }

}


/* =====================================================
   GLOBAL OWNER REVIEW API
===================================================== */

window.tipecoOpenListingReview =
    openListingReview;

window.tipecoRefreshOwnerDashboard =
    refreshOwnerDashboard;


/* =====================================================
   INITIALIZATION
===================================================== */

async function initializeOwnerDashboard() {

    console.log(
        `TIPECO GROUP Owner Dashboard ${DASHBOARD_VERSION} initializing...`
    );


    const authorized =
        await protectOwnerDashboard();


    if (!authorized) {

        return;

    }


    await loadOwnerProfile();


    initSidebar();

    initLogout();

    showOwnerDashboard();


    await refreshOwnerDashboard();


    initAutoRefresh();


    console.log(
        `TIPECO GROUP Owner Dashboard ${DASHBOARD_VERSION} ready.`
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

}

else {

    initializeOwnerDashboard();

}
