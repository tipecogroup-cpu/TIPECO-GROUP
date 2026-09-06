/* =====================================================
   TIPECO GROUP - LISTING JAVASCRIPT
   Version: 3.0
   REAL PROJECT
   Firebase Firestore + Firebase Storage

   Works with:
   - auth.js v7.2
   - firebase-config.js
   - add-listing.html v2.2

   Production Flow:

   Seller
      ↓
   Add Listing
      ↓
   Firebase Storage
      ↓
   Photos / Video URLs
      ↓
   Firestore listings
      ↓
   status = "pending"
      ↓
   Owner Verification Center
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
   FIREBASE AUTH
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

const SELLER_ROLE = "seller";

const LOGIN_PAGE = "login.html";

const MY_LISTINGS_PAGE = "my-listings.html";


/* =====================================================
   PAGE READY
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    initializeListingPage();

});


/* =====================================================
   INITIALIZE LISTING PAGE
===================================================== */

async function initializeListingPage() {

    const addListingForm =
        document.getElementById("addListingForm");


    /* =================================================
       STOP IF FORM DOES NOT EXIST
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
       LOAD CURRENT FIREBASE USER
    ================================================== */

    onAuthStateChanged(
        auth,
        async function (user) {

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


            try {

                await reload(user);

            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to refresh authentication state.",
                    error
                );

            }


            /* =================================================
               GET FIRESTORE PROFILE
            ================================================= */

            let profile = null;


            try {

                if (
                    typeof window.tipecoGetCurrentProfile ===
                    "function"
                ) {

                    profile =
                        await window.tipecoGetCurrentProfile();

                }


                /* =============================================
                   FALLBACK
                ============================================== */

                if (!profile) {

                    const userRef =
                        doc(
                            db,
                            "users",
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

                }

            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to load seller profile.",
                    error
                );

                alert(
                    "Unable to load your account information. Please login again."
                );

                return;
            }


            /* =================================================
               PROFILE REQUIRED
            ================================================== */

            if (!profile) {

                alert(
                    "Your TIPECO GROUP account profile could not be found."
                );

                return;
            }


            /* =================================================
               ROLE CHECK
            ================================================= */

            const userRole =
                String(
                    profile.role ||
                    profile.accountType ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                userRole !== SELLER_ROLE
            ) {

                console.warn(
                    "TIPECO Listing: User is not a seller.",
                    userRole
                );


                alert(
                    "Only sellers / service providers can create listings."
                );


                return;
            }


            /* =================================================
               DISPLAY SELLER INFORMATION
            ================================================= */

            updateSellerInformation(
                profile,
                user
            );


            /* =================================================
               LOGOUT
            ================================================= */

            initializeLogout();


            /* =================================================
               SUBMIT LISTING
            ================================================= */

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
                "TIPECO Listing: Firebase listing engine ready."
            );

        }
    );

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
        .forEach(function (element) {

            element.textContent =
                sellerName;

        });


    document
        .querySelectorAll(
            "[data-user-role]"
        )
        .forEach(function (element) {

            element.textContent =
                sellerRole;

        });

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
       VERIFY USER
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
       VERIFY SELLER ROLE
    ================================================== */

    const userRole =
        String(
            profile.role ||
            profile.accountType ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        userRole !== SELLER_ROLE
    ) {

        alert(
            "Only sellers / service providers can create listings."
        );

        return;
    }


    /* =================================================
       GET FORM VALUES
    ================================================== */

    const listingTitle =
        getValue("listingTitle");


    const listingCategory =
        getValue("listingCategory");


    const listingType =
        getValue("listingType");


    const listingPrice =
        getValue("listingPrice");


    const listingLocation =
        getValue("listingLocation");


    const listingDescription =
        getValue("listingDescription");


    const listingPhone =
        getValue("listingPhone");


    const listingAgreement =
        document.getElementById(
            "listingAgreement"
        );


    /* =================================================
       REQUIRED FIELDS
    ================================================== */

    if (
        !listingTitle ||
        !listingCategory ||
        !listingType ||
        !listingPrice ||
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
                photoInput.files
            )
            : [];


    const videoFile =
        videoInput &&
        videoInput.files.length > 0
            ? videoInput.files[0]
            : null;


    /* =================================================
       LISTING ID
    ================================================= */

    const listingId =
        createListingId();


    /* =================================================
       SELLER INFORMATION
    ================================================= */

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
    ================================================= */

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


        /* =================================================
           UPLOAD PHOTOS
        ================================================== */

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


        /* =================================================
           UPLOAD VIDEO
        ================================================= */

        let videoUrl = null;


        if (videoFile) {

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


        /* =================================================
           CREATE FIRESTORE LISTING
        ================================================= */

        const listing = {

            /* =============================================
               IDENTIFICATION
            ============================================== */

            id:
                listingId,

            sellerId:
                user.uid,


            /* =============================================
               SELLER
            ============================================== */

            sellerName:
                sellerName,

            sellerEmail:
                sellerEmail,

            sellerPhone:
                sellerPhone,


            /* =============================================
               COMPATIBILITY OWNER FIELDS
            ============================================== */

            ownerName:
                sellerName,

            ownerEmail:
                sellerEmail,

            ownerPhone:
                sellerPhone,

            ownerAccountType:
                SELLER_ROLE,


            /* =============================================
               LISTING INFORMATION
            ============================================== */

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


            /* =============================================
               MEDIA
            ============================================== */

            images:
                imageUrls,

            videoUrl:
                videoUrl,


            /* =============================================
               VERIFICATION
            ============================================== */

            status:
                "pending",

            verificationStatus:
                "pending",

            verified:
                false,

            reviewedBy:
                null,

            reviewedAt:
                null,

            rejectionReason:
                null,


            /* =============================================
               TIMESTAMPS
            ============================================== */

            createdAt:
                serverTimestamp(),

            submittedAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        /* =================================================
           SAVE TO FIRESTORE
        ================================================== */

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


        /* =================================================
           SUCCESS
        ================================================= */

        alert(
            "Listing submitted successfully! It is now pending TIPECO GROUP verification."
        );


        /* =================================================
           GO TO MY LISTINGS
        ================================================= */

        window.location.href =
            MY_LISTINGS_PAGE;


    } catch (error) {

        console.error(
            "TIPECO Listing: Listing submission failed.",
            error
        );


        /* =================================================
           FIREBASE ERROR MESSAGE
        ================================================= */

        let message =
            "Unable to submit your listing. Please try again.";


        if (
            error &&
            error.code ===
            "storage/unauthorized"
        ) {

            message =
                "You do not have permission to upload listing media. Please contact TIPECO GROUP.";

        }


        else if (
            error &&
            error.code ===
            "storage/unauthenticated"
        ) {

            message =
                "Your login session has expired. Please login again.";

        }


        else if (
            error &&
            error.code ===
            "permission-denied"
        ) {

            message =
                "You do not have permission to create this listing.";

        }


        else if (
            error &&
            error.code ===
            "storage/unknown"
        ) {

            message =
                "Firebase Storage could not process the upload. Please try again.";

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
                file.type || "image/jpeg"
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
                file.type || "video/mp4"
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
        .forEach(function (button) {

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

        });

}


/* =====================================================
   DEBUG
===================================================== */

console.log(
    "TIPECO GROUP listing.js Version 3.0 loaded."
);
