/* =====================================================
   TIPECO GROUP - SERVICES JAVASCRIPT
   Version: 2.0
   Customer / Service Provider System
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       USER DATA
    ===================================================== */

    const storedUser = localStorage.getItem("tipecoUser");

    let currentUser = null;

    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (error) {
            console.error("Unable to read TIPECO user data.");
        }
    }


    /* =====================================================
       ACCOUNT TYPE
    ===================================================== */

    const accountType =
        currentUser?.accountType || "service-seeker";


    const isProvider =
        accountType === "service-provider";


    const isCustomer =
        accountType === "service-seeker";


    /* =====================================================
       DOM ELEMENTS
    ===================================================== */

    const serviceSearchForm =
        document.getElementById("serviceSearchForm");

    const serviceSearchInput =
        document.getElementById("serviceSearch");

    const serviceGrid =
        document.getElementById("serviceGrid");

    const serviceEmpty =
        document.getElementById("serviceEmpty");

    const serviceSort =
        document.getElementById("serviceSort");

    const categoryButtons =
        document.querySelectorAll(".service-category-card");

    const serviceCards =
        Array.from(
            document.querySelectorAll(".service-card")
        );


    /* =====================================================
       ACTIVE CATEGORY
    ===================================================== */

    let activeCategory = "all";


    /* =====================================================
       FILTER SERVICES
    ===================================================== */

    function filterServices() {

        const searchTerm =
            serviceSearchInput
                ? serviceSearchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        let visibleCount = 0;


        serviceCards.forEach(function (card) {

            const title =
                (
                    card.dataset.title || ""
                ).toLowerCase();

            const category =
                (
                    card.dataset.category || ""
                ).toLowerCase();

            const location =
                (
                    card.dataset.location || ""
                ).toLowerCase();

            const provider =
                (
                    card.dataset.provider || ""
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                title.includes(searchTerm) ||
                category.includes(searchTerm) ||
                location.includes(searchTerm) ||
                provider.includes(searchTerm);


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

        });


        if (serviceEmpty) {

            serviceEmpty.style.display =
                visibleCount === 0
                    ? "block"
                    : "none";

        }

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    if (serviceSearchForm) {

        serviceSearchForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                filterServices();

            }
        );

    }


    if (serviceSearchInput) {

        serviceSearchInput.addEventListener(
            "input",
            filterServices
        );

    }


    /* =====================================================
       SERVICE CATEGORIES
    ===================================================== */

    categoryButtons.forEach(function (button) {

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


                button.classList.add("active");


                activeCategory =
                    button.dataset.category ||
                    "all";


                filterServices();

            }
        );

    });


    /* =====================================================
       SORT SERVICES
    ===================================================== */

    if (serviceSort && serviceGrid) {

        serviceSort.addEventListener(
            "change",
            function () {

                const sortValue =
                    serviceSort.value;


                const sortedCards =
                    [...serviceCards];


                if (
                    sortValue === "price-low"
                ) {

                    sortedCards.sort(
                        function (a, b) {

                            return Number(
                                a.dataset.price || 0
                            ) -
                            Number(
                                b.dataset.price || 0
                            );

                        }
                    );

                }


                if (
                    sortValue === "price-high"
                ) {

                    sortedCards.sort(
                        function (a, b) {

                            return Number(
                                b.dataset.price || 0
                            ) -
                            Number(
                                a.dataset.price || 0
                            );

                        }
                    );

                }


                if (
                    sortValue === "latest"
                ) {

                    sortedCards.sort(
                        function (a, b) {

                            return Number(
                                b.dataset.time || 0
                            ) -
                            Number(
                                a.dataset.time || 0
                            );

                        }
                    );

                }


                sortedCards.forEach(
                    function (card) {

                        serviceGrid.appendChild(
                            card
                        );

                    }
                );


                filterServices();

            }
        );

    }


    /* =====================================================
       SAVE SERVICE
    ===================================================== */

    const saveButtons =
        document.querySelectorAll(
            ".save-service"
        );


    saveButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                if (!currentUser) {

                    alert(
                        "Please login to save services."
                    );

                    window.location.href =
                        "login.html";

                    return;

                }


                button.classList.toggle("saved");


                if (
                    button.classList.contains("saved")
                ) {

                    button.textContent = "♥";

                    button.setAttribute(
                        "aria-label",
                        "Remove from saved services"
                    );

                } else {

                    button.textContent = "♡";

                    button.setAttribute(
                        "aria-label",
                        "Save service"
                    );

                }

            }
        );

    });


    /* =====================================================
       CONTACT SERVICE PROVIDER
    ===================================================== */

    const contactButtons =
        document.querySelectorAll(
            ".contact-provider-btn"
        );


    contactButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                if (!currentUser) {

                    alert(
                        "Please login to contact a service provider."
                    );

                    window.location.href =
                        "login.html";

                    return;

                }


                const providerName =
                    button.dataset.provider ||
                    "this service provider";


                alert(
                    "You are contacting " +
                    providerName +
                    ". Messaging will be available in the next TIPECO GROUP update."
                );

            }
        );

    });


    /* =====================================================
       REQUEST SERVICE
    ===================================================== */

    const requestButtons =
        document.querySelectorAll(
            ".request-service-btn"
        );


    requestButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                if (!currentUser) {

                    alert(
                        "Please login to request a service."
                    );

                    window.location.href =
                        "login.html";

                    return;

                }


                if (isProvider) {

                    alert(
                        "Service Providers manage their own services. Switch to a Customer account to request a service."
                    );

                    return;

                }


                const serviceName =
                    button.dataset.service ||
                    "this service";


                alert(
                    "Your request for " +
                    serviceName +
                    " will be available in the next TIPECO GROUP update."
                );

            }
        );

    });


    /* =====================================================
       PROVIDER - ADD SERVICE
    ===================================================== */

    const addServiceButtons =
        document.querySelectorAll(
            ".add-service-btn"
        );


    addServiceButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (!currentUser) {

                    alert(
                        "Please login to add your service."
                    );

                    window.location.href =
                        "login.html";

                    return;

                }


                if (!isProvider) {

                    alert(
                        "Only Service Providers can post services."
                    );

                    return;

                }


                window.location.href =
                    "create-service.html";

            }
        );

    });


    /* =====================================================
       PROVIDER NOTICE
    ===================================================== */

    const providerOnlyElements =
        document.querySelectorAll(
            "[data-provider-only]"
        );


    providerOnlyElements.forEach(
        function (element) {

            if (isProvider) {

                element.style.display = "";

            } else {

                element.style.display = "none";

            }

        }
    );


    /* =====================================================
       CUSTOMER ONLY ELEMENTS
    ===================================================== */

    const customerOnlyElements =
        document.querySelectorAll(
            "[data-customer-only]"
        );


    customerOnlyElements.forEach(
        function (element) {

            if (isCustomer) {

                element.style.display = "";

            } else {

                element.style.display = "none";

            }

        }
    );


    /* =====================================================
       DISPLAY CURRENT USER
    ===================================================== */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    userNameElements.forEach(
        function (element) {

            if (currentUser) {

                element.textContent =
                    currentUser.fullName;

            }

        }
    );


    /* =====================================================
       DISPLAY ACCOUNT ROLE
    ===================================================== */

    const userRoleElements =
        document.querySelectorAll(
            "[data-user-role]"
        );


    userRoleElements.forEach(
        function (element) {

            if (isProvider) {

                element.textContent =
                    "Service Provider";

            } else {

                element.textContent =
                    "Customer";

            }

        }
    );


    /* =====================================================
       PROVIDER BADGES
    ===================================================== */

    const providerBadges =
        document.querySelectorAll(
            ".service-provider-badge"
        );


    providerBadges.forEach(
        function (badge) {

            badge.textContent =
                "✓ Verified Provider";

        }
    );


    /* =====================================================
       INITIAL FILTER
    ===================================================== */

    filterServices();


    /* =====================================================
       LOG
    ===================================================== */

    console.log(
        "TIPECO GROUP Services V2.0 loaded successfully."
    );

    console.log(
        "Account type:",
        accountType
    );

});
