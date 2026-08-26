/* =====================================================
   TIPECO GROUP - LISTING JAVASCRIPT
   Version: 1.0
   Add Listing Management

   Works with:
   - auth.js
   - storage.js
   - add-listing.html
===================================================== */


/* =====================================================
   WAIT FOR PAGE
===================================================== */

document.addEventListener("DOMContentLoaded", function () {


    /* =================================================
       ADD LISTING FORM
    ================================================== */

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
               MEDIA FILES
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
                Date.now();


            /* =================================================
               MEDIA IDS
            ================================================== */

            const photoMediaIds = [];


            let videoMediaId = null;


            /* =================================================
               SAVE PHOTOS
            ================================================== */

            try {

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


                /* =================================================
                   SAVE VIDEO
                ================================================== */

                if (videoFile) {

                    videoMediaId =
                        listingId +
                        "-video";


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

                return;
            }


            /* =================================================
               CREATE LISTING OBJECT
            ================================================== */

            const listing = {

                id:
                    listingId,


                /* OWNER */

                ownerName:
                    currentUser.fullName || "",

                ownerEmail:
                    currentUser.email || "",

                ownerPhone:
                    currentUser.phone || "",

                ownerAccountType:
                    currentUser.accountType || "seller",


                /* LISTING */

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


                /* MEDIA */

                photos:
                    photoMediaIds,

                video:
                    videoMediaId,


                /* VERIFICATION */

                status:
                    "pending",

                verificationStatus:
                    "pending",

                verified:
                    false,


                /* TIMESTAMP */

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };


            /* =================================================
               GET EXISTING LISTINGS
            ================================================== */

            let listings = [];


            const storedListings =
                localStorage.getItem(
                    "tipecoListings"
                );


            if (storedListings) {

                try {

                    const parsedListings =
                        JSON.parse(
                            storedListings
                        );


                    if (
                        Array.isArray(
                            parsedListings
                        )
                    ) {

                        listings =
                            parsedListings;

                    }

                } catch (error) {

                    console.warn(
                        "TIPECO Listing: Existing listing data could not be read."
                    );

                    listings = [];

                }

            }


            /* =================================================
               ADD NEW LISTING
            ================================================== */

            listings.push(
                listing
            );


            /* =================================================
               SAVE LISTINGS
            ================================================== */

            try {

                localStorage.setItem(
                    "tipecoListings",
                    JSON.stringify(
                        listings
                    )
                );

            } catch (error) {

                console.error(
                    "TIPECO Listing: Unable to save listing.",
                    error
                );

                alert(
                    "Unable to save your listing."
                );

                return;
            }


            /* =================================================
               SUCCESS
            ================================================== */

            console.log(
                "TIPECO Listing: Listing created successfully.",
                listing
            );


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
