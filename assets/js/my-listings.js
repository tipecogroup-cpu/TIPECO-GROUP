/* =====================================================
   TIPECO GROUP - MY LISTINGS
   Version: 3.0

   Compatible with:
   - auth.js
   - storage.js v2.0
   - listing.js v2.0
   - my-listings.html v3.0

   STORAGE:
   IndexedDB only

   IMPORTANT:
   Listings are stored in:
       TIPECO_GROUP_DB
       listings

   Photos / Videos are stored in:
       TIPECO_GROUP_DB
       listingMedia
===================================================== */


document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const listingsGrid =
        document.getElementById("myListingsGrid");

    const emptyState =
        document.getElementById("emptyListings");

    const listingsCount =
        document.getElementById("listingsCount");

    const errorState =
        document.getElementById("listingsError");

    const loadingState =
        document.getElementById("listingsLoading");


    /* =====================================================
       BASIC CHECK
    ===================================================== */

    if (
        !listingsGrid ||
        !emptyState ||
        !listingsCount
    ) {

        console.error(
            "TIPECO My Listings: Required elements are missing."
        );

        return;
    }


    /* =====================================================
       HIDE ERROR
    ===================================================== */

    if (errorState) {

        errorState.style.display = "none";

    }


    /* =====================================================
       SHOW LOADING
    ===================================================== */

    if (loadingState) {

        loadingState.style.display = "block";

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       CURRENT USER
    ===================================================== */

    const storedUser =
        localStorage.getItem("tipecoUser");


    if (!storedUser) {

        listingsCount.textContent =
            "Please login to view your listings.";

        if (loadingState) {

            loadingState.style.display = "none";

        }

        emptyState.style.display = "none";

        return;
    }


    let currentUser;


    try {

        currentUser =
            JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "TIPECO My Listings: Invalid user data.",
            error
        );

        showError(
            "Unable to read your account information."
        );

        return;
    }


    /* =====================================================
       VALIDATE USER
    ===================================================== */

    if (
        !currentUser ||
        !currentUser.email
    ) {

        showError(
            "Your account information is incomplete."
        );

        return;
    }


    const userEmail =
        String(currentUser.email)
            .trim()
            .toLowerCase();


    console.log(
        "TIPECO My Listings: Current user:",
        userEmail
    );


    /* =====================================================
       LOAD LISTINGS
    ===================================================== */

    loadMyListings();


    /* =====================================================
       LOAD MY LISTINGS
    ===================================================== */

    async function loadMyListings() {

        try {

            if (typeof getTipecoListingsByOwner !== "function") {

                throw new Error(
                    "getTipecoListingsByOwner() is not available. Check storage.js."
                );
            }


            const allUserListings =
                await getTipecoListingsByOwner(
                    currentUser.email
                );


            console.log(
                "TIPECO My Listings: Listings found:",
                allUserListings
            );


            /* =============================================
               SAFETY FILTER
            ============================================== */

            const listings =
                Array.isArray(allUserListings)

                    ? allUserListings.filter(
                        function (listing) {

                            if (
                                !listing ||
                                !listing.ownerEmail
                            ) {

                                return false;
                            }


                            return String(
                                listing.ownerEmail
                            )
                                .trim()
                                .toLowerCase()
                                ===
                                userEmail;

                        }
                    )

                    : [];


            /* =============================================
               SORT NEWEST FIRST
            ============================================== */

            listings.sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            a.createdAt || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            b.createdAt || 0
                        ).getTime();

                    return dateB - dateA;

                }
            );


            /* =============================================
               UPDATE COUNT
            ============================================== */

            updateListingsCount(
                listings.length
            );


            /* =============================================
               HIDE LOADING
            ============================================== */

            if (loadingState) {

                loadingState.style.display =
                    "none";

            }


            /* =============================================
               EMPTY
            ============================================== */

            if (listings.length === 0) {

                listingsGrid.innerHTML = "";

                emptyState.style.display =
                    "block";

                return;
            }


            /* =============================================
               SHOW LISTINGS
            ============================================== */

            emptyState.style.display =
                "none";


            listingsGrid.innerHTML = "";


            for (
                const listing of listings
            ) {

                const card =
                    await createListingCard(
                        listing
                    );

                listingsGrid.appendChild(
                    card
                );
            }


            console.log(
                "TIPECO My Listings: Render complete."
            );


        } catch (error) {

            console.error(
                "TIPECO My Listings: Failed to load listings.",
                error
            );

            showError(
                "Unable to load your listings. Please refresh the page and try again."
            );
        }
    }


    /* =====================================================
       UPDATE COUNT
    ===================================================== */

    function updateListingsCount(count) {

        listingsCount.textContent =
            count +
            (
                count === 1
                    ? " listing"
                    : " listings"
            );
    }


    /* =====================================================
       SHOW ERROR
    ===================================================== */

    function showError(message) {

        if (loadingState) {

            loadingState.style.display =
                "none";
        }


        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        if (listingsGrid) {

            listingsGrid.innerHTML = "";
        }


        if (listingsCount) {

            listingsCount.textContent =
                "Unable to load listings.";
        }


        if (errorState) {

            errorState.textContent =
                message;

            errorState.style.display =
                "block";
        }
    }


    /* =====================================================
       CREATE LISTING CARD
    ===================================================== */

    async function createListingCard(listing) {

        const card =
            document.createElement("article");


        card.className =
            "my-listing-card";


        /* =================================================
           STATUS
        ================================================== */

        let statusClass =
            "status-pending";

        let statusText =
            "Pending Verification";


        const status =
            String(
                listing.status || "pending"
            ).toLowerCase();


        if (
            status === "verified" ||
            status === "approved"
        ) {

            statusClass =
                "status-verified";

            statusText =
                "Verified";
        }


        if (
            status === "rejected"
        ) {

            statusClass =
                "status-rejected";

            statusText =
                "Rejected";
        }


        /* =================================================
           DATE
        ================================================== */

        const dateText =
            formatDate(
                listing.createdAt
            );


        /* =================================================
           MEDIA
        ================================================== */

        let photosHTML = "";

        let videoHTML = "";

        let mediaFound = false;


        /* =================================================
           PHOTOS
        ================================================== */

        if (
            Array.isArray(
                listing.photos
            ) &&
            listing.photos.length > 0
        ) {

            const photoElements = [];


            for (
                const mediaId of listing.photos
            ) {

                if (!mediaId) {
                    continue;
                }


                try {

                    const media =
                        await getTipecoMedia(
                            mediaId
                        );


                    if (
                        media &&
                        media.file
                    ) {

                        const imageURL =
                            URL.createObjectURL(
                                media.file
                            );


                        mediaFound = true;


                        photoElements.push(`

                            <img
                                class="listing-photo"
                                src="${imageURL}"
                                alt="${escapeHTML(
                                    media.name ||
                                    "Listing photo"
                                )}"
                                loading="lazy"
                            >

                        `);
                    }


                } catch (error) {

                    console.error(
                        "TIPECO: Unable to load photo:",
                        mediaId,
                        error
                    );
                }
            }


            if (photoElements.length > 0) {

                photosHTML = `

                    <div class="listing-media">

                        <div class="listing-media-title">

                            📸 Photos

                        </div>

                        <div class="listing-photo-grid">

                            ${photoElements.join("")}

                        </div>

                    </div>

                `;
            }
        }


        /* =================================================
           VIDEO
        ================================================== */

        if (listing.video) {

            try {

                const videoMedia =
                    await getTipecoMedia(
                        listing.video
                    );


                if (
                    videoMedia &&
                    videoMedia.file
                ) {

                    const videoURL =
                        URL.createObjectURL(
                            videoMedia.file
                        );


                    mediaFound = true;


                    videoHTML = `

                        <div class="listing-media">

                            <div class="listing-media-title">

                                🎥 Video

                            </div>

                            <video
                                class="listing-video"
                                controls
                                preload="metadata"
                            >

                                <source
                                    src="${videoURL}"
                                    type="${escapeHTML(
                                        videoMedia.mimeType ||
                                        "video/mp4"
                                    )}"
                                >

                                Your browser does not
                                support video playback.

                            </video>

                        </div>

                    `;
                }


            } catch (error) {

                console.error(
                    "TIPECO: Unable to load video:",
                    listing.video,
                    error
                );
            }
        }


        /* =================================================
           EMPTY MEDIA
        ================================================== */

        let mediaHTML = "";


        if (!mediaFound) {

            mediaHTML = `

                <div class="listing-media">

                    <div class="media-empty">

                        📷 No photos or video added
                        to this listing.

                    </div>

                </div>

            `;
        }


        /* =================================================
           VERIFICATION MESSAGE
        ================================================== */

        let verificationMessage =
            "Your listing has been submitted and is waiting for TIPECO GROUP verification.";


        if (
            status === "verified" ||
            status === "approved"
        ) {

            verificationMessage =
                "Your listing has been verified by TIPECO GROUP.";
        }


        if (
            status === "rejected"
        ) {

            verificationMessage =
                "Your listing was rejected during verification. Please review the information and contact TIPECO GROUP if necessary.";
        }


        /* =================================================
           CARD HTML
        ================================================== */

        card.innerHTML = `

            <div class="listing-card-top">


                <!-- =========================================
                     HEADER
                ========================================== -->

                <div class="listing-card-header">

                    <h2>

                        ${escapeHTML(
                            listing.title ||
                            "Untitled Listing"
                        )}

                    </h2>


                    <span
                        class="listing-status ${statusClass}"
                    >

                        ${statusText}

                    </span>

                </div>



                <!-- =========================================
                     DETAILS
                ========================================== -->

                <div class="listing-details">


                    <div class="listing-detail">

                        <span
                            class="listing-detail-label"
                        >

                            Category

                        </span>

                        <span
                            class="listing-detail-value"
                        >

                            ${escapeHTML(
                                listing.category ||
                                "—"
                            )}

                        </span>

                    </div>



                    <div class="listing-detail">

                        <span
                            class="listing-detail-label"
                        >

                            Type

                        </span>

                        <span
                            class="listing-detail-value"
                        >

                            ${escapeHTML(
                                listing.type ||
                                "—"
                            )}

                        </span>

                    </div>



                    <div class="listing-detail">

                        <span
                            class="listing-detail-label"
                        >

                            Price

                        </span>

                        <span
                            class="listing-detail-value"
                        >

                            ${escapeHTML(
                                listing.price ||
                                "—"
                            )}

                        </span>

                    </div>



                    <div class="listing-detail">

                        <span
                            class="listing-detail-label"
                        >

                            Location

                        </span>

                        <span
                            class="listing-detail-value"
                        >

                            ${escapeHTML(
                                listing.location ||
                                "—"
                            )}

                        </span>

                    </div>

                </div>



                <!-- =========================================
                     DESCRIPTION
                ========================================== -->

                <p class="listing-description">

                    ${escapeHTML(
                        listing.description ||
                        "No description provided."
                    )}

                </p>



                <!-- =========================================
                     PHOTOS
                ========================================== -->

                ${photosHTML}



                <!-- =========================================
                     VIDEO
                ========================================== -->

                ${videoHTML}



                <!-- =========================================
                     MEDIA EMPTY
                ========================================== -->

                ${mediaHTML}



                <!-- =========================================
                     VERIFICATION
                ========================================== -->

                <div class="verification-box">

                    <strong>
                        TIPECO GROUP Verification:
                    </strong>

                    ${escapeHTML(
                        verificationMessage
                    )}

                </div>

            </div>



            <!-- =============================================
                 FOOTER
            ============================================== -->

            <div class="listing-card-footer">


                <span class="listing-date">

                    Submitted:
                    ${escapeHTML(
                        dateText
                    )}

                </span>


                <button
                    type="button"
                    class="listing-delete-btn"
                    data-listing-id="${escapeHTML(
                        listing.id
                    )}"
                >

                    🗑️ Delete

                </button>

            </div>

        `;


        return card;
    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(value) {

        if (!value) {

            return "Date unavailable";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Date unavailable";
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
       DELETE LISTING
    ===================================================== */

    listingsGrid.addEventListener(
        "click",
        async function (event) {

            const deleteButton =
                event.target.closest(
                    ".listing-delete-btn"
                );


            if (!deleteButton) {

                return;
            }


            const listingId =
                deleteButton.dataset.listingId;


            if (!listingId) {

                alert(
                    "Listing ID is missing."
                );

                return;
            }


            /* =============================================
               CONFIRM
            ============================================== */

            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this listing? This will also remove its photos and video."
                );


            if (!confirmed) {

                return;
            }


            /* =============================================
               DISABLE BUTTON
            ============================================== */

            deleteButton.disabled =
                true;

            deleteButton.textContent =
                "Deleting...";


            try {

                /* =========================================
                   GET LISTING
                ========================================== */

                const listing =
                    await getTipecoListing(
                        listingId
                    );


                if (!listing) {

                    throw new Error(
                        "Listing not found."
                    );
                }


                /* =========================================
                   SECURITY CHECK
                ========================================== */

                if (
                    !listing.ownerEmail ||
                    String(
                        listing.ownerEmail
                    )
                        .trim()
                        .toLowerCase()
                        !==
                        userEmail
                ) {

                    throw new Error(
                        "You are not allowed to delete this listing."
                    );
                }


                /* =========================================
                   DELETE PHOTOS
                ========================================== */

                if (
                    Array.isArray(
                        listing.photos
                    )
                ) {

                    for (
                        const mediaId
                        of listing.photos
                    ) {

                        if (!mediaId) {
                            continue;
                        }


                        try {

                            await deleteTipecoMedia(
                                mediaId
                            );

                        } catch (mediaError) {

                            console.error(
                                "TIPECO: Photo deletion failed:",
                                mediaId,
                                mediaError
                            );
                        }
                    }
                }


                /* =========================================
                   DELETE VIDEO
                ========================================== */

                if (listing.video) {

                    try {

                        await deleteTipecoMedia(
                            listing.video
                        );

                    } catch (videoError) {

                        console.error(
                            "TIPECO: Video deletion failed:",
                            videoError
                        );
                    }
                }


                /* =========================================
                   DELETE LISTING
                ========================================== */

                await deleteTipecoListing(
                    listingId
                );


                console.log(
                    "TIPECO: Listing deleted:",
                    listingId
                );


                /* =========================================
                   SUCCESS
                ========================================== */

                alert(
                    "Listing deleted successfully."
                );


                /* =========================================
                   RELOAD LISTINGS
                ========================================== */

                await loadMyListings();


            } catch (error) {

                console.error(
                    "TIPECO: Unable to delete listing.",
                    error
                );


                alert(
                    error.message ||
                    "Unable to delete this listing. Please try again."
                );


                deleteButton.disabled =
                    false;

                deleteButton.textContent =
                    "🗑️ Delete";
            }

        }
    );


    /* =====================================================
       DEBUG
    ===================================================== */

    console.log(
        "=========================================="
    );

    console.log(
        "TIPECO MY LISTINGS v3.0"
    );

    console.log(
        "IndexedDB mode: ACTIVE"
    );

    console.log(
        "Current user:",
        currentUser.email
    );

    console.log(
        "=========================================="
    );

});
