/* =====================================================
   TIPECO GROUP - OWNER DASHBOARD
   Version: 1.0
===================================================== */


/* =====================================================
   DOM ELEMENTS
===================================================== */

const ownerSidebar = document.getElementById("ownerSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const ownerLogoutBtn = document.getElementById("ownerLogoutBtn");
const ownerNavLinks = document.querySelectorAll(".owner-nav a");
const quickActionButtons = document.querySelectorAll(".quick-action");


/* =====================================================
   SIDEBAR TOGGLE
===================================================== */

if (sidebarToggle && ownerSidebar) {

    sidebarToggle.addEventListener("click", function () {

        ownerSidebar.classList.toggle("open");

    });

}


/* =====================================================
   CLOSE SIDEBAR AFTER NAVIGATION
===================================================== */

ownerNavLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        if (window.innerWidth <= 768) {

            ownerSidebar.classList.remove("open");

        }

    });

});


/* =====================================================
   ACTIVE NAVIGATION
===================================================== */

ownerNavLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        ownerNavLinks.forEach(function (item) {

            item.parentElement.classList.remove("active");

        });

        link.parentElement.classList.add("active");

    });

});


/* =====================================================
   QUICK ACTIONS
===================================================== */

quickActionButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const action = button.dataset.action;

        if (!action) {
            return;
        }

        const target = document.getElementById(action);

        if (target) {

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

});


/* =====================================================
   LOGOUT
===================================================== */

if (ownerLogoutBtn) {

    ownerLogoutBtn.addEventListener("click", function () {

        const confirmLogout = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmLogout) {
            return;
        }


        /*
         * Authentication logout will be connected
         * with auth.js in the next step.
         */

        console.log("Owner logout requested.");

    });

}


/* =====================================================
   NOTIFICATION BUTTON
===================================================== */

const notificationBtn =
    document.getElementById("notificationBtn");

if (notificationBtn) {

    notificationBtn.addEventListener("click", function () {

        alert("No new notifications.");

    });

}


/* =====================================================
   INITIAL DASHBOARD STATE
===================================================== */

function initializeOwnerDashboard() {

    console.log("TIPECO GROUP Owner Dashboard loaded.");

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeOwnerDashboard
);
