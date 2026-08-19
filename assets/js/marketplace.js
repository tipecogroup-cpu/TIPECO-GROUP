/* =====================================================
   TIPECO GROUP - MARKETPLACE JAVASCRIPT
   BUY & SELL
   Version: 2.0
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const searchForm =
        document.getElementById("marketplaceSearchForm");

    const searchInput =
        document.getElementById("marketplaceSearch");

    const listingGrid =
        document.getElementById("listingGrid");

    const listingEmpty =
        document.getElementById("listingEmpty");

    const categoryButtons =
        document.querySelectorAll(".category-card");

    const listingSort =
        document.getElementById("listingSort");

    const listingCards =
        Array.from(
            document.querySelectorAll(".listing-card")
        );


    /* =====================================================
       ACTIVE CATEGORY
    ===================================================== */

    let activeCategory = "all";


    /* =====================================================
       STORAGE KEY
    ===================================================== */

    const SAVED_LISTINGS_KEY =
        "tipecoSavedListings";


    /* =====================================================
       LOAD SAVED LISTINGS
    ===================================================== */

    function getSavedListings() {

        try {

            const saved =
                localStorage.getItem(
                    SAVED_LISTINGS_KEY
                );

            return saved
                ? JSON.parse(saved)
                : [];

        } catch (error) {

            console.error(
                "Unable to load saved listings.",
                error
            );

            return [];
        }
    }


    /* =====================================================
       SAVE LISTINGS TO STORAGE
    ===================================================== */

    function saveListingsToStorage(savedListings) {

        try {

            localStorage.setItem(
                SAVED_LISTINGS_KEY,
                JSON.stringify(savedListings)
            );

        } catch (error) {

            console.error(
                "Unable to save listings.",
                error
            );
        }
    }


    /* =====================================================
       CREATE LISTING ID
    ===================================================== */

    function getListingId(card, index) {

        if (card.dataset.id) {

            return card.dataset.id;

        }

        const title =
            card.dataset.title ||
            `listing-${index}`;

        const category =
            card.dataset.category ||
            "other";

        return (
            category +
            "-" +
            title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
        );
    }


    /* =====================================================
       PREPARE LISTING IDS
    ===================================================== */

    listingCards.forEach(
        function (card, index) {

            card.dataset.id =
                getListingId(card, index);

        }
    );


    /* =====================================================
       UPDATE SAVE BUTTON
    ===================================================== */

    function updateSaveButtons() {

        const savedListings =
            getSavedListings();

        const saveButtons =
            document.querySelectorAll(
                ".save-listing"
            );

        saveButtons.forEach(
            function (button) {

                const card =
                    button.closest(".listing-card");

                if (!card) {
                    return;
                }

                const listingId =
                    card.dataset.id;

                const isSaved =
                    savedListings.includes(
                        listingId
                    );

                if (isSaved) {

                    button.classList.add(
                        "saved"
                    );

                    button.textContent = "♥";

                    button.setAttribute(
                        "aria-label",
                        "Remove saved listing"
                    );

                } else {

                    button.classList.remove(
                        "saved"
                    );

                    button.textContent = "♡";

                    button.setAttribute(
                        "aria-label",
                        "Save listing"
                    );
                }

            }
        );
    }


    /* =====================================================
       FILTER LISTINGS
    ===================================================== */

    function filterListings() {

        if (!searchInput || !listingEmpty) {
            return;
        }

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();

        let visibleCount = 0;


        listingCards.forEach(
            function (card) {

                const title =
                    (
                        card.dataset.title ||
                        ""
                    ).toLowerCase();

                const category =
                    (
                        card.dataset.category ||
                        ""
                    ).toLowerCase();

                const content =
                    card.textContent
                        .toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    title.includes(searchTerm) ||
                    category.includes(searchTerm) ||
                    content.includes(searchTerm);


                const matchesCategory =
                    activeCategory === "all" ||
                    category === activeCategory;


                if (
                    matchesSearch &&
                    matchesCategory
                ) {

                    card.style.display = "";

                    visibleCount++;

                } else {

                    card.style.display = "none";
                }

            }
        );


        if (visibleCount === 0) {

            listingEmpty.style.display =
                "block";

        } else {

            listingEmpty.style.display =
                "none";
        }
    }


    /* =====================================================
       SEARCH FORM
    ===================================================== */

    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                filterListings();

            }
        );
    }


    /* =====================================================
       LIVE SEARCH
    ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterListings();

            }
        );
    }


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    categoryButtons.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    activeCategory =
                        button.dataset.category ||
                        "all";


                    filterListings();

                }
            );

        }
    );


    /* =====================================================
       SORT LISTINGS
    ===================================================== */

    if (listingSort && listingGrid) {

        listingSort.addEventListener(
            "change",
            function () {

                const sortValue =
                    listingSort.value;


                const sortedCards =
                    [...listingCards];


                if (
                    sortValue === "price-low"
                ) {

                    sortedCards.sort(
                        function (a, b) {

                            return (
                                Number(
                                    a.dataset.price || 0
                                ) -
                                Number(
                                    b.dataset.price || 0
                                )
                            );

                        }
                    );

                }


                else if (
                    sortValue === "price-high"
                ) {

                    sortedCards.sort(
                        function (a, b) {

                            return (
                                Number(
                                    b.dataset.price || 0
                                ) -
                                Number(
                                    a.dataset.price || 0
                                )
                            );

                        }
                    );

                }


                else {

                    /*
                     * Latest:
                     * restore original order
                     */

                    sortedCards.sort(
                        function (a, b) {

                            return (
                                listingCards.indexOf(a) -
                                listingCards.indexOf(b)
                            );

                        }
                    );
                }


                sortedCards.forEach(
                    function (card) {

                        listingGrid.appendChild(
                            card
                        );

                    }
                );


                filterListings();

            }
        );
    }


    /* =====================================================
       SAVE / UNSAVE LISTING
    ===================================================== */

    function handleSaveListing(button) {

        const card =
            button.closest(".listing-card");

        if (!card) {
            return;
        }


        const listingId =
            card.dataset.id;


        let savedListings =
            getSavedListings();


        const alreadySaved =
            savedListings.includes(
                listingId
            );


        if (alreadySaved) {

            savedListings =
                savedListings.filter(
                    function (id) {

                        return id !== listingId;

                    }
                );

        } else {

            savedListings.push(
                listingId
            );
        }


        saveListingsToStorage(
            savedListings
        );


        updateSaveButtons();


        /* USER FEEDBACK */

        if (alreadySaved) {

            showMarketplaceMessage(
                "Listing removed from Saved Items."
            );

        } else {

            showMarketplaceMessage(
                "Listing saved successfully."
            );
        }

    }


    /* =====================================================
       SAVE BUTTON EVENTS
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const saveButton =
                event.target.closest(
                    ".save-listing"
                );

            if (!saveButton) {
                return;
            }

            event.preventDefault();

            handleSaveListing(
                saveButton
            );

        }
    );


    /* =====================================================
       VIEW LISTING DETAILS
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const viewButton =
                event.target.closest(
                    ".view-listing-btn"
                );

            if (!viewButton) {
                return;
            }


            event.preventDefault();


            const card =
                viewButton.closest(
                    ".listing-card"
                );


            if (!card) {
                return;
            }


            const title =
                card.dataset.title ||
                "Listing";


            showMarketplaceMessage(
                `${title} details will be available in the next marketplace update.`
            );

        }
    );


    /* =====================================================
       MARKETPLACE MESSAGE
    ===================================================== */

    function showMarketplaceMessage(message) {

        let messageBox =
            document.getElementById(
                "marketplaceMessage"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );

            messageBox.id =
                "marketplaceMessage";


            messageBox.style.position =
                "fixed";

            messageBox.style.left =
                "50%";

            messageBox.style.bottom =
                "25px";

            messageBox.style.transform =
                "translateX(-50%)";

            messageBox.style.zIndex =
                "9999";

            messageBox.style.padding =
                "12px 18px";

            messageBox.style.borderRadius =
                "8px";

            messageBox.style.background =
                "#0D47A1";

            messageBox.style.color =
                "#ffffff";

            messageBox.style.fontSize =
                "13px";

            messageBox.style.fontWeight =
                "700";

            messageBox.style.boxShadow =
                "0 8px 25px rgba(0,0,0,0.18)";

            messageBox.style.opacity =
                "0";

            messageBox.style.transition =
                "opacity 0.25s ease";

            document.body.appendChild(
                messageBox
            );
        }


        messageBox.textContent =
            message;


        messageBox.style.opacity =
            "1";


        clearTimeout(
            messageBox.hideTimer
        );


        messageBox.hideTimer =
            setTimeout(
                function () {

                    messageBox.style.opacity =
                        "0";

                },
                2500
            );
    }


    /* =====================================================
       CHECK LOGIN STATUS
    ===================================================== */

    function isUserLoggedIn() {

        const localLogin =
            localStorage.getItem(
                "tipecoLoggedIn"
            );

        const sessionLogin =
            sessionStorage.getItem(
                "tipecoLoggedIn"
            );


        return (
            localLogin === "true" ||
            sessionLogin === "true"
        );
    }


    /* =====================================================
       START SELLING
    ===================================================== */

    const startSellingButton =
        document.querySelector(
            '.marketplace-primary-btn[href="dashboard.html"]'
        );


    if (startSellingButton) {

        startSellingButton.addEventListener(
            "click",
            function (event) {

                /*
                 * User must be logged in
                 * before posting a listing.
                 */

                if (!isUserLoggedIn()) {

                    event.preventDefault();


                    alert(
                        "Please login or create an account before you start selling."
                    );


                    window.location.href =
                        "login.html";

                }

            }
        );
    }


    /* =====================================================
       MY ACCOUNT
    ===================================================== */

    const accountButton =
        document.querySelector(
            ".marketplace-account-btn"
        );


    if (accountButton) {

        accountButton.addEventListener(
            "click",
            function (event) {

                if (!isUserLoggedIn()) {

                    event.preventDefault();


                    alert(
                        "Please login to access your account."
                    );


                    window.location.href =
                        "login.html";
                }

            }
        );
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateSaveButtons();

    filterListings();


    /* =====================================================
       MARKETPLACE READY
    ===================================================== */

    console.log(
        "TIPECO GROUP Marketplace V2.0 loaded successfully."
    );

});
