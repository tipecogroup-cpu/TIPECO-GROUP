/* =====================================================
   TIPECO GROUP - LISTING JAVASCRIPT
   Version: 2.0
   Add Listing Management
   IndexedDB Version

   Works with:
   - auth.js
   - storage.js v2.0
   - add-listing.html
===================================================== */


/* =====================================================
   WAIT FOR PAGE
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

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
       SUBMIT LISTING
    ================================================== */

    addListingForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            console.log(
                "TIPECO Listing: Submit started."
            );


            /* =================================================
               CURRENT USER
            ================================================== */

            const storedUser =
                localStorage.getItem(
                    "tipecoUser"
                );


            if (!storedUser) {

                alert(
                    "Please login before creating a listing."
                );

                window.location.href =
                    "login.html";

                return;
            }


            let currentUser;


            try {

                currentUser =
                    JSON.parse(
                        storedUser
                    );

            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to read user.",
                    error
                );

                alert(
                    "Unable to read your account information."
                );

                return;
            }


            /* =================================================
               ACCOUNT TYPE CHECK
            ================================================== */

            if (
                !currentUser ||
                currentUser.accountType !== "seller"
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
                document.getElementById(
                    "listingTitle"
                ).value.trim();


            const listingCategory =
                document.getElementById(
                    "listingCategory"
                ).value;


            const listingType =
                document.getElementById(
                    "listingType"
                ).value;


            const listingPrice =
                document.getElementById(
                    "listingPrice"
                ).value;


            const listingLocation =
                document.getElementById(
                    "listingLocation"
                ).value.trim();


            const listingDescription =
                document.getElementById(
                    "listingDescription"
                ).value.trim();


            const listingPhone =
                document.getElementById(
                    "listingPhone"
                ).value.trim();


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
            ================================================== */

            const listingId =
                "listing-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 8);


            /* =================================================
               MEDIA IDS
            ================================================== */

            const photoMediaIds = [];


            let videoMediaId = null;


            /* =================================================
               DISABLE SUBMIT BUTTON
            ================================================== */

            const submitButton =
                addListingForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Saving Listing...";

            }


            /* =================================================
               SAVE MEDIA
            ================================================== */

            try {


                /* =============================================
                   SAVE PHOTOS
                ============================================== */

                for (
                    let i = 0;
                    i < photoFiles.length;
                    i++
                ) {

                    const file =
                        photoFiles[i];


                    const mediaId =
                        listingId +
                        "-photo-" +
                        i;


                    console.log(
                        "TIPECO Listing: Saving photo:",
                        file.name
                    );


                    await saveTipecoMedia({

                        id:
                            mediaId,

                        listingId:
                            listingId,

                        type:
                            "image",

                        name:
                            file.name,

                        mimeType:
                            file.type,

                        size:
                            file.size,

                        file:
                            file,

                        createdAt:
                            new Date().toISOString()

                    });


                    photoMediaIds.push(
                        mediaId
                    );

                }


                /* =============================================
                   SAVE VIDEO
                ============================================== */

                if (videoFile) {

                    videoMediaId =
                        listingId +
                        "-video";


                    console.log(
                        "TIPECO Listing: Saving video:",
                        videoFile.name
                    );


                    await saveTipecoMedia({

                        id:
                            videoMediaId,

                        listingId:
                            listingId,

                        type:
                            "video",

                        name:
                            videoFile.name,

                        mimeType:
                            videoFile.type,

                        size:
                            videoFile.size,

                        file:
                            videoFile,

                        createdAt:
                            new Date().toISOString()

                    });

                }


            } catch (error) {

                console.error(
                    "TIPECO Listing: Media storage failed.",
                    error
                );


                alert(
                    "Unable to save listing photos or video. Please try again."
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Submit for Verification";

                }


                return;
            }


            /* =================================================
               CREATE LISTING OBJECT
            ================================================== */

            const now =
                new Date().toISOString();


            const listing = {

                /* =============================================
                   IDENTIFICATION
                ============================================== */

                id:
                    listingId,


                /* =============================================
                   OWNER
                ============================================== */

                ownerName:
                    currentUser.fullName || "",

                ownerEmail:
                    currentUser.email || "",

                ownerPhone:
                    currentUser.phone || "",

                ownerAccountType:
                    currentUser.accountType || "seller",


                /* =============================================
                   LISTING INFORMATION
                ============================================== */

                title:
                    listingTitle,

                category:
                    listingCategory,

                type:
                    listingType,

                price:
                    listingPrice,

                location:
                    listingLocation,

                description:
                    listingDescription,

                contactPhone:
                    listingPhone,


                /* =============================================
                   MEDIA REFERENCES
                ============================================== */

                photos:
                    photoMediaIds,

                video:
                    videoMediaId,


                /* =============================================
                   VERIFICATION
                ============================================== */

                status:
                    "pending",

                verificationStatus:
                    "pending",

                verified:
                    false,


                /* =============================================
                   TIMESTAMPS
                ============================================== */

                createdAt:
                    now,

                updatedAt:
                    now

            };


            /* =================================================
               SAVE LISTING TO INDEXEDDB
            ================================================== */

            try {

                console.log(
                    "TIPECO Listing: Saving listing to IndexedDB..."
                );


                await saveTipecoListing(
                    listing
                );


                console.log(
                    "TIPECO Listing: Listing saved successfully.",
                    listing
                );


            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to save listing.",
                    error
                );


                /*
                 * IMPORTANT:
                 * If listing storage fails after media
                 * has already been saved, remove the media
                 * so we don't leave orphaned files.
                 */

                try {

                    for (
                        const mediaId
                        of photoMediaIds
                    ) {

                        await deleteTipecoMedia(
                            mediaId
                        );

                    }


                    if (videoMediaId) {

                        await deleteTipecoMedia(
                            videoMediaId
                        );

                    }

                } catch (cleanupError) {

                    console.error(
                        "TIPECO Listing: Media cleanup failed.",
                        cleanupError
                    );

                }


                alert(
                    "Unable to save your listing. Please try again."
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Submit for Verification";

                }


                return;
            }


            /* =================================================
               SUCCESS
            ================================================== */

            alert(
                "Listing submitted successfully! It is now pending TIPECO GROUP verification."
            );


            /* =================================================
               GO TO MY LISTINGS
            ================================================== */

            window.location.href =
                "my-listings.html";

        }
    );

});
