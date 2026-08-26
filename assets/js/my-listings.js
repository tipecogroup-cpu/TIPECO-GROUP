/* =====================================================
   TIPECO GROUP - MY LISTINGS
   Version: 5.0

   Compatible with:
   - auth.js v2.1
   - storage.js v2.0
   - listing.js v2.0
   - my-listings.html v3.0

   PURPOSE:
   Load and display current user's listings
   from TIPECO IndexedDB.
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    console.log("====================================");
    console.log("TIPECO MY LISTINGS v5.0");
    console.log("====================================");


    /* =====================================================
       HTML ELEMENTS
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


    if (!grid) {

        console.error(
            "TIPECO My Listings: #myListingsGrid not found."
        );

        return;
    }


    /* =====================================================
       INITIAL UI
    ===================================================== */

    grid.innerHTML = "";

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (errorElement) {
        errorElement.style.display = "none";
    }

    if (loadingElement) {
        loadingElement.style.display = "block";
    }

    if (countElement) {
        countElement.textContent =
            "Loading listings...";
    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    const storedUser =
        localStorage.getItem("tipecoUser");


    if (!storedUser) {

        console.warn(
            "TIPECO My Listings: No user found."
        );

        finishLoading();

        if (countElement) {

            countElement.textContent =
                "Please login to view your listings.";

        }

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
            "Your account information could not be read."
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
        String(currentUser.email)
            .trim()
            .toLowerCase();


    console.log(
        "TIPECO My Listings: Current user:",
        userEmail
    );


    /* =====================================================
       CHECK STORAGE FUNCTION
    ===================================================== */

    if (
        typeof getTipecoListingsByOwner !==
        "function"
    ) {

        console.error(
            "TIPECO My Listings: getTipecoListingsByOwner() is missing."
        );

        showError(
            "Listing storage is not available. Please check storage.js."
        );

        return;
    }


    /* =====================================================
       LOAD LISTINGS
    ===================================================== */

    try {

        const result =
            await getTipecoListingsByOwner(
                currentUser.email
            );


        console.log(
            "TIPECO My Listings: IndexedDB result:",
            result
        );


        const listings =
            Array.isArray(result)
                ? result.filter(function (listing) {

                    if (!listing) {
                        return false;
                    }

                    if (!listing.ownerEmail) {
                        return false;
                    }

                    return String(
                        listing.ownerEmail
                    )
                        .trim()
                        .toLowerCase()
                        ===
                        userEmail;

                })
                : [];


        console.log(
            "TIPECO My Listings: User listings:",
            listings
        );


        /* =================================================
           SORT
        ================================================= */

        listings.sort(function (a, b) {

            return new Date(
                b.createdAt || 0
            ).getTime()
            -
            new Date(
                a.createdAt || 0
            ).getTime();

        });


        /* =================================================
           UPDATE COUNT
        ================================================= */

        if (countElement) {

            countElement.textContent =
                listings.length +
                (
                    listings.length === 1
                        ? " listing"
                        : " listings"
                );

        }


        finishLoading();


        /* =================================================
           EMPTY
        ================================================= */

        if (listings.length === 0) {

            grid.innerHTML = "";

            if (emptyState) {

                emptyState.style.display =
                    "block";

            }

            console.log(
                "TIPECO My Listings: No listings found."
            );

            return;
        }


        /* =================================================
           DISPLAY LISTINGS
        ================================================= */

        if (emptyState) {

            emptyState.style.display =
                "none";

        }


        for (
            const listing of listings
        ) {

            const card =
                createListingCard(
                    listing
                );

            grid.appendChild(card);

        }


        console.log(
            "TIPECO My Listings: Display completed."
        );


    } catch (error) {

        console.error(
            "TIPECO My Listings: Failed to load.",
            error
        );

        showError(
            "Unable to load your listings. Please refresh the page."
        );

    }


    /* =====================================================
       FINISH LOADING
    ===================================================== */

    function finishLoading() {

        if (loadingElement) {

            loadingElement.style.display =
                "none";

        }

    }


    /* =====================================================
       SHOW ERROR
    ===================================================== */

    function showError(message) {

        finishLoading();


        grid.innerHTML = "";


        if (emptyState) {

            emptyState.style.display =
                "none";

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
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       CREATE LISTING CARD
    ===================================================== */

    function createListingCard(listing) {

        const card =
            document.createElement("article");


        card.className =
            "my-listing-card";


        /* =================================================
           STATUS
        ================================================= */

        const rawStatus =
            String(
                listing.status || "pending"
            ).toLowerCase();


        let statusClass =
            "status-pending";

        let statusText =
            "Pending Verification";


        if (
            rawStatus === "verified" ||
            rawStatus === "approved"
        ) {

            statusClass =
                "status-verified";

            statusText =
                "Verified";

        }


        if (
            rawStatus === "rejected"
        ) {

            statusClass =
                "status-rejected";

            statusText =
                "Rejected";

        }


        /* =================================================
           VERIFICATION MESSAGE
        ================================================= */

        let verificationMessage =
            "Your listing has been submitted and is waiting for TIPECO GROUP verification.";


        if (
            rawStatus === "verified" ||
            rawStatus === "approved"
        ) {

            verificationMessage =
                "Your listing has been verified by TIPECO GROUP.";

        }


        if (
            rawStatus === "rejected"
        ) {

            verificationMessage =
                "Your listing was rejected during verification.";

        }


        /* =================================================
           DATE
        ================================================= */

        const dateText =
            formatDate(
                listing.createdAt
            );


        /* =================================================
           CARD
        ================================================= */

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
                                listing.category || "—"
                            )}
                        </span>

                    </div>


                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Type
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.type || "—"
                            )}
                        </span>

                    </div>


                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Price
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.price || "—"
                            )}
                        </span>

                    </div>


                    <div class="listing-detail">

                        <span class="listing-detail-label">
                            Location
                        </span>

                        <span class="listing-detail-value">
                            ${escapeHTML(
                                listing.location || "—"
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
                    ${escapeHTML(dateText)}

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


            button.disabled = true;

            button.textContent =
                "Deleting...";


            try {

                if (
                    typeof getTipecoListing !==
                    "function"
                ) {

                    throw new Error(
                        "getTipecoListing() is unavailable."
                    );

                }


                if (
                    typeof deleteTipecoListing !==
                    "function"
                ) {

                    throw new Error(
                        "deleteTipecoListing() is unavailable."
                    );

                }


                const listing =
                    await getTipecoListing(
                        listingId
                    );


                if (!listing) {

                    throw new Error(
                        "Listing not found."
                    );

                }


                /* =============================================
                   OWNER SECURITY
                ============================================== */

                if (
                    String(
                        listing.ownerEmail || ""
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


                /* =============================================
                   DELETE PHOTOS
                ============================================== */

                if (
                    Array.isArray(
                        listing.photos
                    ) &&
                    typeof deleteTipecoMedia ===
                    "function"
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

                            console.warn(
                                "Unable to delete media:",
                                mediaId,
                                mediaError
                            );

                        }

                    }

                }


                /* =============================================
                   DELETE VIDEO
                ============================================== */

                if (
                    listing.video &&
                    typeof deleteTipecoMedia ===
                    "function"
                ) {

                    try {

                        await deleteTipecoMedia(
                            listing.video
                        );

                    } catch (videoError) {

                        console.warn(
                            "Unable to delete video:",
                            videoError
                        );

                    }

                }


                /* =============================================
                   DELETE LISTING
                ============================================== */

                await deleteTipecoListing(
                    listingId
                );


                alert(
                    "Listing deleted successfully."
                );


                /* =============================================
                   RELOAD PAGE DATA
                ============================================== */

                window.location.reload();


            } catch (error) {

                console.error(
                    "TIPECO My Listings: Delete failed.",
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
        "TIPECO My Listings v5.0 initialized successfully."
    );

});
