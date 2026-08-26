/* =====================================================
   TIPECO GROUP - MY LISTINGS
   Version: 4.0

   FINAL FIX
   Works with:
   - auth.js v2.1
   - storage.js v2.0
   - listing.js v2.0
   - my-listings.html v3.0

   STORAGE:
   IndexedDB
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    console.log("====================================");
    console.log("TIPECO MY LISTINGS v4.0 STARTED");
    console.log("====================================");


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const grid =
        document.getElementById("myListingsGrid");

    const emptyState =
        document.getElementById("emptyListings");

    const countElement =
        document.getElementById("listingsCount");

    const errorElement =
        document.getElementById("listingsError");

    const loadingElement =
        document.getElementById("listingsLoading");


    if (!grid || !emptyState || !countElement) {

        console.error(
            "TIPECO My Listings: HTML elements missing."
        );

        return;
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizeEmail(email) {

        return String(email || "")
            .trim()
            .toLowerCase();
    }


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
       SHOW ERROR
    ===================================================== */

    function showError(message) {

        if (loadingElement) {

            loadingElement.style.display =
                "none";
        }


        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        if (grid) {

            grid.innerHTML = "";
        }


        if (countElement) {

            countElement.textContent =
                "Unable to load listings.";
        }


        if (errorElement) {

            errorElement.textContent =
                message;

            errorElement.style.display =
                "block";
        }

    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    const storedUser =
        localStorage.getItem(
            "tipecoUser"
        );


    if (!storedUser) {

        console.log(
            "TIPECO My Listings: No user found."
        );


        if (loadingElement) {

            loadingElement.style.display =
                "none";
        }


        countElement.textContent =
            "Please login to view your listings.";


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
            "TIPECO My Listings: Invalid user data.",
            error
        );


        showError(
            "Unable to read your account information."
        );

        return;
    }


    if (
        !currentUser ||
        !currentUser.email
    ) {

        showError(
            "Your account email is missing."
        );

        return;
    }


    const userEmail =
        normalizeEmail(
            currentUser.email
        );


    console.log(
        "TIPECO My Listings: Current user email:",
        userEmail
    );


    /* =====================================================
       LOAD LISTINGS
    ===================================================== */

    try {

        if (
            typeof getTipecoListings !==
            "function"
        ) {

            throw new Error(
                "getTipecoListings() is not available."
            );
        }


        console.log(
            "TIPECO My Listings: Reading IndexedDB..."
        );


        /* =================================================
           IMPORTANT FIX

           We DO NOT use:
           getTipecoListingsByOwner()

           Instead:
           get ALL listings
           then filter by normalized email.
        ================================================== */

        const allListings =
            await getTipecoListings();


        console.log(
            "TIPECO My Listings: ALL listings:",
            allListings
        );


        if (
            !Array.isArray(
                allListings
            )
        ) {

            throw new Error(
                "IndexedDB returned invalid listings data."
            );
        }


        /* =================================================
           FILTER CURRENT USER
        ================================================== */

        const myListings =
            allListings.filter(
                function (listing) {

                    if (
                        !listing ||
                        !listing.ownerEmail
                    ) {

                        return false;
                    }


                    return (
                        normalizeEmail(
                            listing.ownerEmail
                        ) ===
                        userEmail
                    );

                }
            );


        console.log(
            "TIPECO My Listings: MY listings:",
            myListings
        );


        /* =================================================
           SORT NEWEST FIRST
        ================================================== */

        myListings.sort(
            function (a, b) {

                return (
                    new Date(
                        b.createdAt || 0
                    ).getTime()
                    -
                    new Date(
                        a.createdAt || 0
                    ).getTime()
                );

            }
        );


        /* =================================================
           HIDE LOADING
        ================================================= */

        if (loadingElement) {

            loadingElement.style.display =
                "none";
        }


        /* =================================================
           UPDATE COUNT
        ================================================= */

        countElement.textContent =
            myListings.length +
            (
                myListings.length === 1
                    ? " listing"
                    : " listings"
            );


        /* =================================================
           EMPTY
        ================================================= */

        if (
            myListings.length === 0
        ) {

            grid.innerHTML = "";

            emptyState.style.display =
                "block";


            console.log(
                "TIPECO My Listings: No listings for current user."
            );


            return;
        }


        /* =================================================
           SHOW LISTINGS
        ================================================= */

        emptyState.style.display =
            "none";


        grid.innerHTML = "";


        for (
            const listing of myListings
        ) {

            const card =
                await createListingCard(
                    listing
                );


            grid.appendChild(
                card
            );

        }


        console.log(
            "TIPECO My Listings: Rendering completed."
        );


    } catch (error) {

        console.error(
            "TIPECO My Listings ERROR:",
            error
        );


        showError(
            "Unable to load your listings. Please refresh the page."
        );

    }


    /* =====================================================
       CREATE LISTING CARD
    ===================================================== */

    async function createListingCard(listing) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "my-listing-card";


        /* =================================================
           STATUS
        ================================================== */

        const status =
            String(
                listing.status ||
                "pending"
            ).toLowerCase();


        let statusClass =
            "status-pending";


        let statusText =
            "Pending Verification";


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
           MEDIA
        ================================================== */

        let photosHTML = "";

        let videoHTML = "";


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

                    if (
                        typeof getTipecoMedia !==
                        "function"
                    ) {

                        continue;
                    }


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
                        "TIPECO photo error:",
                        error
                    );

                }

            }


            if (
                photoElements.length > 0
            ) {

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

                if (
                    typeof getTipecoMedia ===
                    "function"
                ) {

                    const media =
                        await getTipecoMedia(
                            listing.video
                        );


                    if (
                        media &&
                        media.file
                    ) {

                        const videoURL =
                            URL.createObjectURL(
                                media.file
                            );


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
                                            media.mimeType ||
                                            "video/mp4"
                                        )}"
                                    >

                                </video>

                            </div>

                        `;

                    }

                }

            } catch (error) {

                console.error(
                    "TIPECO video error:",
                    error
                );

            }

        }


        /* =================================================
           MEDIA FALLBACK
        ================================================== */

        let mediaHTML =
            "";


        if (
            !photosHTML &&
            !videoHTML
        ) {

            mediaHTML = `

                <div class="listing-media">

                    <div class="media-empty">

                        📷 No photos or video added.

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
                "Your listing was rejected during verification.";

        }


        /* =================================================
           CARD
        ================================================== */

        card.innerHTML = `

            <div class="listing-card-top">

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


                <div class="listing-details">

                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Category
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.category ||
                                "—"
                            )}
                        </span>

                    </div>


                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Type
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.type ||
                                "—"
                            )}
                        </span>

                    </div>


                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Price
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.price ||
                                "—"
                            )}
                        </span>

                    </div>


                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Location
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.location ||
                                "—"
                            )}
                        </span>

                    </div>

                </div>


                <p class="listing-description">

                    ${escapeHTML(
                        listing.description ||
                        "No description provided."
                    )}

                </p>


                ${photosHTML}

                ${videoHTML}

                ${mediaHTML}


                <div class="verification-box">

                    <strong>
                        TIPECO GROUP Verification:
                    </strong>

                    ${escapeHTML(
                        verificationMessage
                    )}

                </div>

            </div>


            <div class="listing-card-footer">

                <span class="listing-date">

                    Submitted:
                    ${escapeHTML(
                        formatDate(
                            listing.createdAt
                        )
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
       DELETE LISTING
    ===================================================== */

    grid.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    ".listing-delete-btn"
                );


            if (!button) {
                return;
            }


            const listingId =
                button.dataset.listingId;


            if (!listingId) {

                alert(
                    "Listing ID is missing."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this listing?"
                );


            if (!confirmed) {
                return;
            }


            button.disabled =
                true;


            button.textContent =
                "Deleting...";


            try {

                const listing =
                    await getTipecoListing(
                        listingId
                    );


                if (!listing) {

                    throw new Error(
                        "Listing not found."
                    );

                }


                /* SECURITY */

                if (
                    normalizeEmail(
                        listing.ownerEmail
                    ) !==
                    userEmail
                ) {

                    throw new Error(
                        "You are not allowed to delete this listing."
                    );

                }


                /* DELETE PHOTOS */

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

                        } catch (error) {

                            console.error(
                                "Photo delete error:",
                                error
                            );

                        }

                    }

                }


                /* DELETE VIDEO */

                if (listing.video) {

                    try {

                        await deleteTipecoMedia(
                            listing.video
                        );

                    } catch (error) {

                        console.error(
                            "Video delete error:",
                            error
                        );

                    }

                }


                /* DELETE LISTING */

                await deleteTipecoListing(
                    listingId
                );


                alert(
                    "Listing deleted successfully."
                );


                location.reload();


            } catch (error) {

                console.error(
                    "TIPECO delete error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to delete listing."
                );


                button.disabled =
                    false;


                button.textContent =
                    "🗑️ Delete";

            }

        }
    );


    console.log(
        "===================================="
    );

    console.log(
        "TIPECO MY LISTINGS v4.0 READY"
    );

    console.log(
        "Current user:",
        userEmail
    );

    console.log(
        "IndexedDB: ACTIVE"
    );

    console.log(
        "===================================="

    );

});
