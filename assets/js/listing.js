/* =====================================================
   TIPECO GROUP - LISTING JAVASCRIPT
   Version: 4.0
   REAL PROJECT

   FIREBASE SOURCE OF TRUTH
   - Firebase Authentication
   - Firestore
   - Firebase Storage

   NO:
   - storage.js
   - IndexedDB
   - localStorage authentication

   FLOW:

   Seller
      ↓
   Firebase Auth
      ↓
   Seller Profile
      ↓
   Subscription Check
      ↓
   Add Listing
      ↓
   Firebase Storage
      ↓
   Photos / Video URLs
      ↓
   Firestore / listings
      ↓
   status = pending
      ↓
   Owner Verification
      ↓
   Approve / Reject / Request Changes
      ↓
   Marketplace
      ↓
   Approved listings only
===================================================== */


/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    auth,
    db,
    storage
} from "./firebase-config.js";


/* =====================================================
   FIREBASE AUTHENTICATION
===================================================== */

import {
    onAuthStateChanged,
    reload
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =====================================================
   FIRESTORE
===================================================== */

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   FIREBASE STORAGE
===================================================== */

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


/* =====================================================
   CONFIGURATION
===================================================== */

const LISTINGS_COLLECTION = "listings";

const USERS_COLLECTION = "users";

const SELLER_ROLE = "seller";

const LOGIN_PAGE = "login.html";

const MY_LISTINGS_PAGE = "my-listings.html";


/* =====================================================
   PAGE READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeListingPage
);


/* =====================================================
   INITIALIZE LISTING PAGE
===================================================== */

async function initializeListingPage() {

    const addListingForm =
        document.getElementById("addListingForm");


    /* =================================================
       FORM REQUIRED
    ================================================== */

    if (!addListingForm) {

        console.log(
            "TIPECO Listing: Add Listing form not found."
        );

        return;
    }


    console.log(
        "TIPECO Listing: Add Listing form found."
    );


    /* =================================================
       FIREBASE AUTH STATE
    ================================================== */

    onAuthStateChanged(
        auth,
        async function (user) {

            /* =============================================
               AUTH REQUIRED
            ============================================== */

            if (!user) {

                console.warn(
                    "TIPECO Listing: No authenticated user."
                );

                alert(
                    "Please login before creating a listing."
                );

                window.location.href =
                    LOGIN_PAGE;

                return;
            }


            /* =============================================
               REFRESH AUTH STATE
            ============================================== */

            try {

                await reload(user);

            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to refresh authentication state.",
                    error
                );

            }


            /* =============================================
               EMAIL VERIFICATION
            ============================================== */

            if (!user.emailVerified) {

                alert(
                    "Please verify your email address before creating a listing."
                );

                return;
            }


            /* =============================================
               LOAD PROFILE
            ============================================== */

            let profile = null;


            try {

                const userRef =
                    doc(
                        db,
                        USERS_COLLECTION,
                        user.uid
                    );


                const userSnapshot =
                    await getDoc(
                        userRef
                    );


                if (
                    userSnapshot.exists()
                ) {

                    profile = {

                        id:
                            userSnapshot.id,

                        ...userSnapshot.data()

                    };

                }

            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to load seller profile.",
                    error
                );

                alert(
                    "Unable to load your account information. Please try again."
                );

                return;
            }


            /* =============================================
               PROFILE REQUIRED
            ============================================== */

            if (!profile) {

                alert(
                    "Your TIPECO GROUP account profile could not be found."
                );

                return;
            }


            /* =============================================
               SELLER ROLE
            ============================================== */

            const userRole =
                getProfileRole(profile);


            if (
                userRole !== SELLER_ROLE
            ) {

                console.warn(
                    "TIPECO Listing: User is not a seller.",
                    userRole
                );

                alert(
                    "Only approved sellers / service providers can create listings."
                );

                return;
            }


            /* =============================================
               SUBSCRIPTION GATE
               
               IMPORTANT:
               We do NOT invent a subscription schema here.
               The exact subscription collection/fields must
               be connected once the project's subscription
               implementation is supplied.
            ============================================== */

            const subscriptionCheck =
                checkSubscriptionReadiness(
                    profile
                );


            if (
                subscriptionCheck.blocked
            ) {

                alert(
                    subscriptionCheck.message
                );

                return;
            }


            /* =============================================
               SELLER INFORMATION
            ============================================== */

            updateSellerInformation(
                profile,
                user
            );


            /* =============================================
               LOGOUT
            ============================================== */

            initializeLogout();


            /* =============================================
               PREVENT DUPLICATE SUBMIT LISTENERS
            ============================================== */

            if (
                addListingForm.dataset.listenerReady ===
                "true"
            ) {

                return;
            }


            addListingForm.dataset.listenerReady =
                "true";


            /* =============================================
               SUBMIT
            ============================================== */

            addListingForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    await submitListing(
                        addListingForm,
                        user,
                        profile
                    );

                }
            );


            console.log(
                "TIPECO Listing: Firestore listing engine ready."
            );

        }
    );

}


/* =====================================================
   PROFILE ROLE
===================================================== */

function getProfileRole(
    profile
) {

    return String(
        profile?.role ||
        profile?.accountType ||
        profile?.userRole ||
        ""
    )
        .trim()
        .toLowerCase();

}


/* =====================================================
   SUBSCRIPTION READINESS
===================================================== */

/*
   IMPORTANT:

   TIPECO architecture requires:

       Subscription != Approval

   Therefore this function is deliberately isolated.

   We will connect the exact subscription schema here
   after the project's Subscription implementation is
   confirmed.

   This version does NOT silently grant subscription access
   based on an invented Firestore field.
*/

function checkSubscriptionReadiness(
    profile
) {

    /*
       If the profile explicitly contains a known inactive
       subscription signal, block listing creation.

       Otherwise we do not manufacture a subscription
       decision from unknown data.
    */

    const explicitStatus =
        profile?.subscription?.status ||
        profile?.subscriptionStatus ||
        null;


    if (
        typeof explicitStatus === "string"
    ) {

        const normalizedStatus =
            explicitStatus
                .trim()
                .toLowerCase();


        const inactiveStatuses = [
            "inactive",
            "expired",
            "cancelled",
            "canceled",
            "suspended",
            "disabled"
        ];


        if (
            inactiveStatuses.includes(
                normalizedStatus
            )
        ) {

            return {

                blocked: true,

                message:
                    "Your TIPECO subscription is not active. Please activate an eligible subscription before creating a listing."

            };

        }

    }


    /*
       IMPORTANT:
       Exact subscription verification should be connected
       here when the subscription schema is finalized.
    */

    return {

        blocked: false,

        message: ""

    };

}


/* =====================================================
   UPDATE SELLER INFORMATION
===================================================== */

function updateSellerInformation(
    profile,
    user
) {

    const sellerName =
        profile.name ||
        profile.fullName ||
        profile.displayName ||
        user.displayName ||
        "";


    const sellerRole =
        profile.role ||
        profile.accountType ||
        SELLER_ROLE;


    document
        .querySelectorAll(
            "[data-user-name]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    sellerName;

            }
        );


    document
        .querySelectorAll(
            "[data-user-role]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    sellerRole;

            }
        );

}


/* =====================================================
   SUBMIT LISTING
===================================================== */

async function submitListing(
    addListingForm,
    user,
    profile
) {

    console.log(
        "TIPECO Listing: Submit started."
    );


    /* =================================================
       AUTH CHECK
    ================================================== */

    if (!user) {

        alert(
            "Please login before creating a listing."
        );

        window.location.href =
            LOGIN_PAGE;

        return;
    }


    /* =================================================
       EMAIL VERIFICATION
    ================================================== */

    if (!user.emailVerified) {

        alert(
            "Please verify your email address before creating a listing."
        );

        return;
    }


    /* =================================================
       SELLER ROLE CHECK
    ================================================== */

    const userRole =
        getProfileRole(
            profile
        );


    if (
        userRole !== SELLER_ROLE
    ) {

        alert(
            "Only approved sellers / service providers can create listings."
        );

        return;
    }


    /* =================================================
       SUBSCRIPTION CHECK
    ================================================== */

    const subscriptionCheck =
        checkSubscriptionReadiness(
            profile
        );


    if (
        subscriptionCheck.blocked
    ) {

        alert(
            subscriptionCheck.message
        );

        return;
    }


    /* =================================================
       FORM VALUES
    ================================================== */

    const listingTitle =
        getValue(
            "listingTitle"
        );


    const listingCategory =
        normalizeCategory(
            getValue(
                "listingCategory"
            )
        );


    const listingType =
        normalizeListingType(
            getValue(
                "listingType"
            )
        );


    const listingPriceRaw =
        getValue(
            "listingPrice"
        );


    const listingLocation =
        getValue(
            "listingLocation"
        );


    const listingDescription =
        getValue(
            "listingDescription"
        );


    const listingPhone =
        getValue(
            "listingPhone"
        );


    const listingAgreement =
        document.getElementById(
            "listingAgreement"
        );


    /* =================================================
       REQUIRED FIELD VALIDATION
    ================================================== */

    if (
        !listingTitle ||
        !listingCategory ||
        !listingType ||
        !listingPriceRaw ||
        !listingLocation ||
        !listingDescription ||
        !listingPhone
    ) {

        alert(
            "Please complete all required listing information."
        );

        return;
    }


    /* =================================================
       PRICE VALIDATION
    ================================================== */

    const listingPrice =
        Number(
            listingPriceRaw
        );


    if (
        !Number.isFinite(
            listingPrice
        ) ||
        listingPrice < 0
    ) {

        alert(
            "Please enter a valid price."
        );

        return;
    }


    /* =================================================
       AGREEMENT
    ================================================== */

    if (
        !listingAgreement ||
        !listingAgreement.checked
    ) {

        alert(
            "Please confirm that the information provided is accurate."
        );

        return;
    }


    /* =================================================
       MEDIA INPUTS
    ================================================== */

    const photoInput =
        document.getElementById(
            "listingPhotos"
        );


    const videoInput =
        document.getElementById(
            "listingVideo"
        );


    const photoFiles =
        photoInput
            ? Array.from(
                photoInput.files || []
            )
            : [];


    const videoFile =
        videoInput &&
        videoInput.files &&
        videoInput.files.length > 0
            ? videoInput.files[0]
            : null;


    /* =================================================
       MEDIA VALIDATION
    ================================================== */

    const invalidPhoto =
        photoFiles.find(
            function (file) {

                return !file.type.startsWith(
                    "image/"
                );

            }
        );


    if (invalidPhoto) {

        alert(
            "One or more selected photos are not valid image files."
        );

        return;
    }


    if (
        videoFile &&
        !videoFile.type.startsWith(
            "video/"
        )
    ) {

        alert(
            "The selected video file is not valid."
        );

        return;
    }


    /* =================================================
       LISTING ID
    ================================================== */

    const listingId =
        createListingId();


    /* =================================================
       SELLER INFORMATION
    ================================================== */

    const sellerName =
        profile.name ||
        profile.fullName ||
        profile.displayName ||
        user.displayName ||
        "";


    const sellerEmail =
        profile.email ||
        user.email ||
        "";


    const sellerPhone =
        profile.phone ||
        "";


    /* =================================================
       SUBMIT BUTTON
    ================================================== */

    const submitButton =
        addListingForm.querySelector(
            'button[type="submit"]'
        );


    setSubmitButton(
        submitButton,
        true,
        "Uploading..."
    );


    try {

        /* =============================================
           UPLOAD PHOTOS
        ============================================== */

        const imageUrls = [];


        for (
            let i = 0;
            i < photoFiles.length;
            i++
        ) {

            const file =
                photoFiles[i];


            console.log(
                "TIPECO Listing: Uploading image:",
                file.name
            );


            const imageUrl =
                await uploadListingImage(
                    listingId,
                    file,
                    i
                );


            imageUrls.push(
                imageUrl
            );

        }


        /* =============================================
           UPLOAD VIDEO
        ============================================== */

        let videoUrl =
            null;


        if (
            videoFile
        ) {

            console.log(
                "TIPECO Listing: Uploading video:",
                videoFile.name
            );


            videoUrl =
                await uploadListingVideo(
                    listingId,
                    videoFile
                );

        }


        /* =============================================
           FIRESTORE LISTING OBJECT
        ============================================== */

        const listing = {

            /* =========================================
               IDENTIFICATION
            ========================================== */

            id:
                listingId,

            sellerId:
                user.uid,


            /* =========================================
               SELLER
            ========================================== */

            sellerName:
                sellerName,

            sellerEmail:
                sellerEmail,

            sellerPhone:
                sellerPhone,


            /* =========================================
               OWNER COMPATIBILITY
            ========================================== */

            ownerName:
                sellerName,

            ownerEmail:
                sellerEmail,

            ownerPhone:
                sellerPhone,

            ownerAccountType:
                SELLER_ROLE,


            /* =========================================
               LISTING INFORMATION
            ========================================== */

            title:
                listingTitle,

            category:
                listingCategory,

            type:
                listingType,

            description:
                listingDescription,

            price:
                listingPrice,

            location:
                listingLocation,

            contactPhone:
                listingPhone,


            /* =========================================
               MEDIA
            ========================================== */

            images:
                imageUrls,

            videoUrl:
                videoUrl,


            /* =========================================
               MODERATION / VERIFICATION
            ========================================== */

            status:
                "pending",

            verificationStatus:
                "pending",

            approvalStatus:
                "pending",

            verified:
                false,

            reviewedBy:
                null,

            reviewedAt:
                null,

            rejectionReason:
                null,


            /* =========================================
               TIMESTAMPS
            ========================================== */

            createdAt:
                serverTimestamp(),

            submittedAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        /* =============================================
           SAVE TO FIRESTORE
        ============================================== */

        console.log(
            "TIPECO Listing: Saving listing to Firestore..."
        );


        await setDoc(
            doc(
                db,
                LISTINGS_COLLECTION,
                listingId
            ),
            listing
        );


        console.log(
            "TIPECO Listing: Listing saved successfully.",
            listingId
        );


        /* =============================================
           SUCCESS
        ============================================== */

        alert(
            "Listing submitted successfully! It is now pending TIPECO GROUP verification."
        );


        /* =============================================
           REDIRECT
        ============================================== */

        window.location.href =
            MY_LISTINGS_PAGE;


    } catch (error) {

        console.error(
            "TIPECO Listing: Listing submission failed.",
            error
        );


        let message =
            "Unable to submit your listing. Please try again.";


        /* =============================================
           FIREBASE STORAGE ERRORS
        ============================================== */

        if (
            error?.code ===
            "storage/unauthorized"
        ) {

            message =
                "You do not have permission to upload listing media. Please contact TIPECO GROUP.";

        }


        else if (
            error?.code ===
            "storage/unauthenticated"
        ) {

            message =
                "Your login session has expired. Please login again.";

        }


        else if (
            error?.code ===
            "storage/canceled"
        ) {

            message =
                "The media upload was canceled.";

        }


        else if (
            error?.code ===
            "storage/quota-exceeded"
        ) {

            message =
                "The available Firebase Storage quota has been exceeded.";

        }


        /* =============================================
           FIRESTORE ERRORS
        ============================================== */

        else if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "You do not have permission to create this listing.";

        }


        else if (
            error?.code ===
            "unauthenticated"
        ) {

            message =
                "Your login session has expired. Please login again.";

        }


        alert(
            message
        );


        setSubmitButton(
            submitButton,
            false,
            "Submit for Verification"
        );

    }

}


/* =====================================================
   CATEGORY NORMALIZATION
===================================================== */

function normalizeCategory(
    value
) {

    const category =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    const categoryMap = {

        "construction":
            "construction-products",

        "construction-products":
            "construction-products",

        "paint":
            "paint-construction",

        "paint-construction":
            "paint-construction",

        "vehicles":
            "vehicles",

        "real-estate":
            "real-estate",

        "electronics":
            "electronics",

        "home-furniture":
            "home-furniture",

        "services":
            "services",

        "other":
            "other"

    };


    return (
        categoryMap[category] ||
        category
    );

}


/* =====================================================
   LISTING TYPE NORMALIZATION
===================================================== */

function normalizeListingType(
    value
) {

    const type =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    const typeMap = {

        "sell":
            "sell",

        "sale":
            "sell",

        "buy":
            "sell",

        "rent":
            "rent",

        "service":
            "service",

        "job":
            "job",

        "other":
            "other"

    };


    return (
        typeMap[type] ||
        type
    );

}


/* =====================================================
   GET FORM VALUE
===================================================== */

function getValue(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/* =====================================================
   CREATE LISTING ID
===================================================== */

function createListingId() {

    return (
        "listing-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


/* =====================================================
   SAFE FILE NAME
===================================================== */

function safeFileName(
    fileName
) {

    return String(
        fileName || "file"
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


/* =====================================================
   UPLOAD IMAGE
===================================================== */

async function uploadListingImage(
    listingId,
    file,
    index
) {

    if (!file) {

        throw new Error(
            "Invalid image file."
        );

    }


    const fileName =
        safeFileName(
            file.name
        );


    const storagePath =
        "listings/" +
        listingId +
        "/images/" +
        index +
        "-" +
        fileName;


    const storageReference =
        ref(
            storage,
            storagePath
        );


    await uploadBytes(
        storageReference,
        file,
        {
            contentType:
                file.type ||
                "image/jpeg"
        }
    );


    return await getDownloadURL(
        storageReference
    );

}


/* =====================================================
   UPLOAD VIDEO
===================================================== */

async function uploadListingVideo(
    listingId,
    file
) {

    if (!file) {

        throw new Error(
            "Invalid video file."
        );

    }


    const fileName =
        safeFileName(
            file.name
        );


    const storagePath =
        "listings/" +
        listingId +
        "/video/" +
        fileName;


    const storageReference =
        ref(
            storage,
            storagePath
        );


    await uploadBytes(
        storageReference,
        file,
        {
            contentType:
                file.type ||
                "video/mp4"
        }
    );


    return await getDownloadURL(
        storageReference
    );

}


/* =====================================================
   SUBMIT BUTTON STATE
===================================================== */

function setSubmitButton(
    button,
    disabled,
    text
) {

    if (!button) {

        return;

    }


    button.disabled =
        disabled;


    button.textContent =
        text;

}


/* =====================================================
   LOGOUT
===================================================== */

function initializeLogout() {

    document
        .querySelectorAll(
            '[data-action="logout"]'
        )
        .forEach(
            function (button) {

                if (
                    button.dataset.logoutReady ===
                    "true"
                ) {

                    return;
                }


                button.dataset.logoutReady =
                    "true";


                button.addEventListener(
                    "click",
                    async function (event) {

                        event.preventDefault();


                        if (
                            typeof window.tipecoLogout ===
                            "function"
                        ) {

                            await window.tipecoLogout();

                            return;
                        }


                        console.warn(
                            "TIPECO Listing: tipecoLogout() is not available."
                        );

                    }
                );

            }
        );

}


/* =====================================================
   DEBUG
===================================================== */

console.log(
    "TIPECO GROUP listing.js Version 4.0 loaded."
);
