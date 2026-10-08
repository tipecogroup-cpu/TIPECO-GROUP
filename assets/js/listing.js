/* =========================================================
   TIPECO GROUP — LISTING.JS v4.1
   Firebase Auth + Firestore + Firebase Storage
   Subscription Entitlement + Owner Approval
   ========================================================= */

import {
    auth,
    db,
    storage
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    reload
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

import {
    getSellerListingEntitlement
} from "./subscription-service.js";


/* =========================================================
   CONSTANTS
   ========================================================= */

const LISTINGS_COLLECTION = "listings";
const USERS_COLLECTION = "users";

const LOGIN_PAGE = "login.html";
const MY_LISTINGS_PAGE = "my-listings.html";


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function showMessage(message, type = "info") {
    const container =
        $("#listingMessage") ||
        $("#formMessage") ||
        $(".form-message");

    if (!container) {
        alert(message);
        return;
    }

    container.textContent = message;
    container.className = `form-message ${type}`;
    container.hidden = false;
}

function clearMessage() {
    const container =
        $("#listingMessage") ||
        $("#formMessage") ||
        $(".form-message");

    if (!container) return;

    container.textContent = "";
    container.hidden = true;
}


/* =========================================================
   USER PROFILE
   ========================================================= */

async function getUserProfile(uid) {
    if (!uid) return null;

    const userRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function requireAuthenticatedUser() {
    const user = auth.currentUser;

    if (!user) {
        window.location.href = LOGIN_PAGE;
        return null;
    }

    try {
        await reload(user);
    } catch (error) {
        console.error("Unable to reload Firebase user:", error);
    }

    const refreshedUser = auth.currentUser;

    if (!refreshedUser) {
        window.location.href = LOGIN_PAGE;
        return null;
    }

    if (!refreshedUser.emailVerified) {
        showMessage(
            "Please verify your email address before publishing a listing.",
            "warning"
        );
        return null;
    }

    return refreshedUser;
}


/* =========================================================
   SUBSCRIPTION / LISTING ENTITLEMENT
   ========================================================= */

async function getListingEntitlement(uid) {
    try {
        const entitlement = await getSellerListingEntitlement(uid);

        if (!entitlement || entitlement.eligible !== true) {
            return {
                eligible: false,
                activePostLimit: 0,
                videoAllowed: false,
                subscription: null
            };
        }

        return entitlement;

    } catch (error) {
        console.error("Failed to load listing entitlement:", error);

        throw new Error(
            "Unable to verify your subscription entitlement. Please try again."
        );
    }
}


/* =========================================================
   COUNT CURRENT LISTINGS
   =========================================================

   Current publishing/review workload:

   pending + approved + needs_changes

   rejected/inactive/expired are not counted.
   ========================================================= */

async function countCurrentListings(uid) {
    const listingsRef = collection(db, LISTINGS_COLLECTION);

    const q = query(
        listingsRef,
        where("sellerId", "==", uid)
    );

    const snapshot = await getDocs(q);

    let count = 0;

    snapshot.forEach((listingDoc) => {
        const data = listingDoc.data();

        const status =
            String(data.status || "").toLowerCase();

        if (
            status === "pending" ||
            status === "approved" ||
            status === "needs_changes"
        ) {
            count++;
        }
    });

    return count;
}


/* =========================================================
   CATEGORY NORMALIZATION
   ========================================================= */

function normalizeCategory(category) {
    const value = String(category || "")
        .trim()
        .toLowerCase();

    const categoryMap = {
        construction: "construction-products",
        "construction products": "construction-products",
        "construction-products": "construction-products",

        paint: "paint-construction",
        "paint & construction": "paint-construction",
        "paint-construction": "paint-construction",

        vehicle: "vehicles",
        vehicles: "vehicles",

        "real estate": "real-estate",
        "real-estate": "real-estate",

        electronics: "electronics",

        "home & furniture": "home-furniture",
        "home-furniture": "home-furniture",

        services: "services",

        other: "other"
    };

    return categoryMap[value] || value;
}


/* =========================================================
   LISTING TYPE NORMALIZATION
   ========================================================= */

function normalizeListingType(type) {
    const value = String(type || "")
        .trim()
        .toLowerCase();

    if (
        value === "sell" ||
        value === "sale" ||
        value === "buy"
    ) {
        return "sell";
    }

    if (value === "rent") {
        return "rent";
    }

    if (
        value === "service" ||
        value === "services"
    ) {
        return "service";
    }

    if (
        value === "job" ||
        value === "jobs"
    ) {
        return "job";
    }

    return "other";
}


/* =========================================================
   FILE VALIDATION
   ========================================================= */

function validateImages(files) {
    if (!files || files.length === 0) {
        return {
            valid: true,
            files: []
        };
    }

    const validFiles = [];

    for (const file of files) {
        if (!file.type.startsWith("image/")) {
            return {
                valid: false,
                message: `Invalid image file: ${file.name}`
            };
        }

        validFiles.push(file);
    }

    return {
        valid: true,
        files: validFiles
    };
}


function validateVideo(file) {
    if (!file) {
        return {
            valid: true,
            file: null
        };
    }

    if (!file.type.startsWith("video/")) {
        return {
            valid: false,
            message: "The selected video file is not a valid video."
        };
    }

    return {
        valid: true,
        file
    };
}


/* =========================================================
   UPLOAD IMAGES
   ========================================================= */

async function uploadImages(listingId, files) {
    const imageUrls = [];

    for (let index = 0; index < files.length; index++) {
        const file = files[index];

        const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const storagePath =
            `listings/${listingId}/images/${index}-${Date.now()}-${safeName}`;

        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file);

        const url = await getDownloadURL(storageRef);

        imageUrls.push(url);
    }

    return imageUrls;
}


/* =========================================================
   UPLOAD VIDEO
   ========================================================= */

async function uploadVideo(listingId, file) {
    if (!file) {
        return null;
    }

    const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_");

    const storagePath =
        `listings/${listingId}/video/${Date.now()}-${safeName}`;

    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
}


/* =========================================================
   FORM INITIALIZATION
   ========================================================= */

function initializeListingForm() {
    const form =
        $("#listingForm") ||
        $("form[data-listing-form]");

    if (!form) {
        console.warn("Listing form not found.");
        return;
    }

    form.addEventListener("submit", handleSubmit);

    console.log("TIPECO listing form initialized.");
}


/* =========================================================
   SUBMIT LISTING
   ========================================================= */

async function handleSubmit(event) {
    event.preventDefault();

    clearMessage();

    const submitButton =
        $("#submitListingBtn") ||
        $("#submitBtn") ||
        event.submitter;

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {

        /* -------------------------------------------------
           1. AUTH
           ------------------------------------------------- */

        const user = await requireAuthenticatedUser();

        if (!user) {
            return;
        }


        /* -------------------------------------------------
           2. PROFILE
           ------------------------------------------------- */

        const profile = await getUserProfile(user.uid);

        if (!profile) {
            throw new Error(
                "Your TIPECO profile could not be found."
            );
        }


        /* -------------------------------------------------
           3. ACCOUNT STATUS
           ------------------------------------------------- */

        const accountStatus =
            String(profile.accountStatus || "").toLowerCase();

        if (
            accountStatus === "blocked" ||
            accountStatus === "suspended"
        ) {
            throw new Error(
                "Your TIPECO account is currently restricted."
            );
        }

        if (accountStatus === "pending_verification") {
            throw new Error(
                "Please complete your email verification before publishing."
            );
        }


        /* -------------------------------------------------
           4. SUBSCRIPTION ENTITLEMENT
           ------------------------------------------------- */

        const entitlement =
            await getListingEntitlement(user.uid);

        if (!entitlement.eligible) {
            throw new Error(
                "An active TIPECO subscription is required before publishing a listing."
            );
        }


        /* -------------------------------------------------
           5. READ FORM
           ------------------------------------------------- */

        const title =
            $("#title")?.value.trim() ||
            $("#listingTitle")?.value.trim() ||
            "";

        const categoryRaw =
            $("#category")?.value ||
            "";

        const typeRaw =
            $("#type")?.value ||
            $("#listingType")?.value ||
            "";

        const priceRaw =
            $("#price")?.value.trim() ||
            "";

        const location =
            $("#location")?.value.trim() ||
            "";

        const description =
            $("#description")?.value.trim() ||
            "";

        /*
         * Phone is intentionally read only for validation.
         * It is NOT stored inside the public listing document.
         * Owner can use sellerId to access the user's controlled
         * profile/contact information.
         */
        const contactPhone =
            $("#phone")?.value.trim() ||
            $("#contactPhone")?.value.trim() ||
            "";

        const agreement =
            $("#agreement")?.checked ||
            $("#termsAgreement")?.checked ||
            false;

        const imageInput =
            $("#photos") ||
            $("#images");

        const videoInput =
            $("#video");


        /* -------------------------------------------------
           6. REQUIRED FIELDS
           ------------------------------------------------- */

        if (!title) {
            throw new Error("Please enter a listing title.");
        }

        if (!categoryRaw) {
            throw new Error("Please select a category.");
        }

        if (!typeRaw) {
            throw new Error("Please select a listing type.");
        }

        if (!priceRaw) {
            throw new Error("Please enter the price.");
        }

        if (!location) {
            throw new Error("Please enter the location.");
        }

        if (!description) {
            throw new Error("Please enter a description.");
        }

        if (!contactPhone) {
            throw new Error("Please provide a contact phone number.");
        }

        if (!agreement) {
            throw new Error(
                "You must accept the TIPECO listing terms."
            );
        }


        /* -------------------------------------------------
           7. PRICE
           ------------------------------------------------- */

        const price = Number(priceRaw);

        if (!Number.isFinite(price) || price < 0) {
            throw new Error(
                "Please enter a valid price."
            );
        }


        /* -------------------------------------------------
           8. NORMALIZE
           ------------------------------------------------- */

        const category =
            normalizeCategory(categoryRaw);

        const type =
            normalizeListingType(typeRaw);


        /* -------------------------------------------------
           9. FILES
           ------------------------------------------------- */

        const imageFiles =
            imageInput
                ? Array.from(imageInput.files || [])
                : [];

        const videoFile =
            videoInput?.files?.[0] || null;


        const imageValidation =
            validateImages(imageFiles);

        if (!imageValidation.valid) {
            throw new Error(imageValidation.message);
        }


        const videoValidation =
            validateVideo(videoFile);

        if (!videoValidation.valid) {
            throw new Error(videoValidation.message);
        }


        /* -------------------------------------------------
           10. VIDEO ENTITLEMENT
           ------------------------------------------------- */

        if (videoFile && entitlement.videoAllowed !== true) {
            throw new Error(
                "Video listings require a TIPECO subscription plan that includes video."
            );
        }


        /* -------------------------------------------------
           11. ACTIVE POST LIMIT
           ------------------------------------------------- */

        const currentListingCount =
            await countCurrentListings(user.uid);

        const activePostLimit =
            Number(entitlement.activePostLimit || 0);

        if (
            activePostLimit <= 0 ||
            currentListingCount >= activePostLimit
        ) {
            throw new Error(
                `You have reached your current subscription limit of ${activePostLimit} active posts.`
            );
        }


        /* -------------------------------------------------
           12. CREATE LISTING ID
           -------------------------------------------------

           IMPORTANT:
           The same document reference is used for both
           the Firestore document ID and listingData.id.
           ------------------------------------------------- */

        const listingRef =
            doc(collection(db, LISTINGS_COLLECTION));

        const listingId =
            listingRef.id;


        /* -------------------------------------------------
           13. UPLOAD MEDIA
           ------------------------------------------------- */

        showMessage(
            "Uploading your listing media...",
            "info"
        );

        const imageUrls =
            await uploadImages(
                listingId,
                imageFiles
            );

        const videoUrl =
            await uploadVideo(
                listingId,
                videoFile
            );


        /* -------------------------------------------------
           14. CREATE LISTING
           ------------------------------------------------- */

        showMessage(
            "Submitting your listing for TIPECO review...",
            "info"
        );

        const sellerName =
            profile.fullName ||
            profile.name ||
            profile.displayName ||
            user.displayName ||
            "TIPECO User";

        const sellerEmail =
            profile.email ||
            user.email ||
            "";


        const listingData = {

            /* Identity */
            id: listingId,
            sellerId: user.uid,

            /* Seller information
               Phone/contact is intentionally NOT stored
               in the public listings document. */

            sellerName,
            sellerEmail,

            /* Listing */
            title,
            category,
            type,
            description,
            price,
            location,

            /* Media */
            images: imageUrls,
            videoUrl: videoUrl || null,

            /* Moderation */
            status: "pending",
            verificationStatus: "pending",
            approvalStatus: "pending",

            verified: false,

            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,

            /* Timestamps */
            createdAt: serverTimestamp(),
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };


        /*
         * Use setDoc(listingRef) instead of addDoc().
         * This guarantees:
         *
         * listingData.id === Firestore document ID
         */
        await setDoc(
            listingRef,
            listingData
        );


        /* -------------------------------------------------
           15. SUCCESS
           ------------------------------------------------- */

        showMessage(
            "Listing submitted successfully. It is now waiting for TIPECO Owner review.",
            "success"
        );

        setTimeout(() => {
            window.location.href = MY_LISTINGS_PAGE;
        }, 1200);


    } catch (error) {

        console.error(
            "TIPECO listing submission error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to submit your listing. Please try again.",
            "error"
        );

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        console.log(
            "No authenticated Firebase user."
        );
        return;
    }

    try {

        await reload(user);

        if (!auth.currentUser) {
            return;
        }

        if (!auth.currentUser.emailVerified) {
            showMessage(
                "Please verify your email before creating a listing.",
                "warning"
            );
            return;
        }

        const profile =
            await getUserProfile(auth.currentUser.uid);

        if (!profile) {
            showMessage(
                "Your TIPECO profile could not be loaded.",
                "error"
            );
            return;
        }

        const accountStatus =
            String(profile.accountStatus || "").toLowerCase();

        if (
            accountStatus === "blocked" ||
            accountStatus === "suspended"
        ) {
            showMessage(
                "Your account is currently restricted from publishing listings.",
                "error"
            );
            return;
        }

        initializeListingForm();

    } catch (error) {

        console.error(
            "Listing page initialization failed:",
            error
        );

        showMessage(
            "Unable to initialize the listing page.",
            "error"
        );
    }
});
