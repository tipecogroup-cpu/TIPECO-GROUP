/* =========================================================
   TIPECO GROUP
   SELLER SUBSCRIPTION PAGE
   MANUAL MOMO PAYMENT + SCREENSHOT
   FIREBASE AUTH + FIRESTORE + STORAGE
   VERSION 2.0
========================================================= */

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

import {
    auth,
    storage
} from "./firebase-config.js";

import {
    SUBSCRIPTION_PLANS
} from "./subscription-config.js";

import {
    createSubscriptionRequest,
    createPaymentRecord,
    attachPaymentScreenshot,
    getActiveSellerSubscription,
    getSellerPendingPayments
} from "./subscription-service.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const plansGrid =
    document.getElementById("plansGrid");

const paymentPanel =
    document.getElementById("paymentPanel");

const selectedPlanName =
    document.getElementById("selectedPlanName");

const selectedPlanPrice =
    document.getElementById("selectedPlanPrice");

const paymentForm =
    document.getElementById("paymentForm");

const paymentReference =
    document.getElementById("paymentReference");

const paymentScreenshot =
    document.getElementById("paymentScreenshot");

const submitPaymentBtn =
    document.getElementById("submitPaymentBtn");

const paymentStatus =
    document.getElementById("paymentStatus");

const subscriptionInfo =
    document.getElementById("subscriptionInfo");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let selectedPlan = null;

let currentSubscription = null;

let pendingPayments = [];


/* =========================================================
   CONSTANTS
========================================================= */

const MAX_SCREENSHOT_SIZE =
    5 * 1024 * 1024;

const ALLOWED_SCREENSHOT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/* =========================================================
   UTILITIES
========================================================= */

function formatRwf(amount) {

    const numericAmount =
        Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "0 RWF";
    }

    return `${numericAmount.toLocaleString("en-US")} RWF`;
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


function showStatus(message, type = "error") {

    if (!paymentStatus) {
        return;
    }

    paymentStatus.textContent =
        message;

    paymentStatus.className =
        `payment-status visible ${type}`;
}


function clearStatus() {

    if (!paymentStatus) {
        return;
    }

    paymentStatus.textContent =
        "";

    paymentStatus.className =
        "payment-status";
}


function getDateValue(value) {

    if (!value) {
        return null;
    }

    if (
        value &&
        typeof value.toDate === "function"
    ) {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


function formatDate(value) {

    const date =
        getDateValue(value);

    if (!date) {
        return "Not available";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   RENDER PLANS
========================================================= */

function renderPlans() {

    if (!plansGrid) {
        return;
    }

    plansGrid.innerHTML = "";


    Object.values(SUBSCRIPTION_PLANS)
        .forEach(plan => {

            const card =
                document.createElement("article");

            card.className =
                "plan-card";

            card.dataset.planId =
                plan.id;


            const videoText =
                plan.videoAllowed
                    ? "Video listings allowed"
                    : "Video listings not allowed";


            card.innerHTML = `

                <h2>
                    ${escapeHtml(plan.name)}
                </h2>

                <div class="plan-price">
                    ${formatRwf(plan.price)}
                </div>

                <div class="plan-duration">
                    ${Number(plan.durationDays)}
                    days
                </div>

                <ul class="plan-features">

                    <li>
                        ✅
                        ${Number(plan.activePostLimit)}
                        active posts
                    </li>

                    <li>
                        ${
                            plan.videoAllowed
                                ? "✅"
                                : "❌"
                        }
                        ${videoText}
                    </li>

                    <li>
                        ✅ Owner review
                    </li>

                    <li>
                        ✅ Protected marketplace
                    </li>

                </ul>

                <button
                    type="button"
                    class="plan-select"
                    data-plan-id="${escapeHtml(plan.id)}"
                >
                    Choose ${escapeHtml(plan.name)}
                </button>
            `;


            plansGrid.appendChild(card);

        });


    document
        .querySelectorAll(".plan-select")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectPlan(
                        button.dataset.planId
                    );

                }
            );

        });
}


/* =========================================================
   SELECT PLAN
========================================================= */

function selectPlan(planId) {

    clearStatus();


    if (
        !planId ||
        !SUBSCRIPTION_PLANS[planId]
    ) {

        showStatus(
            "Invalid subscription plan.",
            "error"
        );

        return;
    }


    selectedPlan =
        SUBSCRIPTION_PLANS[planId];


    document
        .querySelectorAll(".plan-card")
        .forEach(card => {

            card.classList.toggle(
                "selected",
                card.dataset.planId === planId
            );

        });


    if (selectedPlanName) {

        selectedPlanName.textContent =
            selectedPlan.name;
    }


    if (selectedPlanPrice) {

        selectedPlanPrice.textContent =
            formatRwf(selectedPlan.price);
    }


    if (paymentPanel) {

        paymentPanel.classList.add(
            "visible"
        );

        paymentPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    /*
       If there is already an active subscription,
       do not allow a second normal payment request.
    */

    if (currentSubscription) {

        showStatus(
            "You already have an active subscription. Subscription changes will be handled through the TIPECO subscription management workflow.",
            "error"
        );

        return;
    }


    /*
       If there is already a pending payment,
       prevent duplicate payment requests.
    */

    if (pendingPayments.length > 0) {

        showStatus(
            "You already have a payment pending Owner verification. Please wait for the current payment to be reviewed before submitting another payment.",
            "error"
        );
    }
}


/* =========================================================
   LOAD ACTIVE SUBSCRIPTION
========================================================= */

async function loadCurrentSubscription() {

    if (!currentUser || !subscriptionInfo) {
        return;
    }


    try {

        currentSubscription =
            await getActiveSellerSubscription(
                currentUser.uid
            );


        if (!currentSubscription) {

            renderNoActiveSubscription();

            return;
        }


        renderCurrentSubscription(
            currentSubscription
        );


    } catch (error) {

        console.error(
            "Subscription load error:",
            error
        );


        subscriptionInfo.textContent =
            "Unable to load subscription information.";
    }
}


/* =========================================================
   RENDER NO ACTIVE SUBSCRIPTION
========================================================= */

function renderNoActiveSubscription() {

    if (!subscriptionInfo) {
        return;
    }


    if (pendingPayments.length > 0) {

        subscriptionInfo.innerHTML = `
            <p>
                You do not currently have an active subscription.
            </p>

            <p>
                <strong>
                    Payment status:
                </strong>
                Pending Owner verification.
            </p>
        `;

        return;
    }


    subscriptionInfo.innerHTML = `
        <p>
            You do not currently have an active subscription.
        </p>
    `;
}


/* =========================================================
   RENDER CURRENT SUBSCRIPTION
========================================================= */

function renderCurrentSubscription(
    subscription
) {

    if (!subscriptionInfo) {
        return;
    }


    const planName =
        escapeHtml(
            subscription.planName || "-"
        );


    const status =
        escapeHtml(
            subscription.status || "-"
        );


    const activePostLimit =
        Number(
            subscription.activePostLimit || 0
        );


    const videoAllowed =
        subscription.videoAllowed
            ? "Allowed"
            : "Not allowed";


    const expires =
        formatDate(
            subscription.expiresAt
        );


    subscriptionInfo.innerHTML = `

        <p>
            <strong>Plan:</strong>
            ${planName}
        </p>

        <p>
            <strong>Status:</strong>
            <span class="subscription-status">
                ${status}
            </span>
        </p>

        <p>
            <strong>Active post limit:</strong>
            ${activePostLimit}
        </p>

        <p>
            <strong>Video:</strong>
            ${videoAllowed}
        </p>

        <p>
            <strong>Expires:</strong>
            ${expires}
        </p>

    `;
}


/* =========================================================
   LOAD PENDING PAYMENTS
========================================================= */

async function loadPendingPayments() {

    if (!currentUser) {
        return;
    }


    try {

        pendingPayments =
            await getSellerPendingPayments(
                currentUser.uid
            );


        if (
            !Array.isArray(
                pendingPayments
            )
        ) {

            pendingPayments = [];
        }


        /*
           If there is no active subscription,
           refresh the information area so that
           the seller can see the pending state.
        */

        if (!currentSubscription) {

            renderNoActiveSubscription();
        }


    } catch (error) {

        console.error(
            "Pending payment load error:",
            error
        );

        pendingPayments = [];
    }
}


/* =========================================================
   VALIDATE SCREENSHOT
========================================================= */

function validateScreenshot(file) {

    if (!file) {

        throw new Error(
            "Payment screenshot is required."
        );
    }


    if (
        !ALLOWED_SCREENSHOT_TYPES
            .includes(file.type)
    ) {

        throw new Error(
            "Only JPG, PNG, or WebP screenshots are allowed."
        );
    }


    if (
        file.size >
        MAX_SCREENSHOT_SIZE
    ) {

        throw new Error(
            "Payment screenshot must not exceed 5 MB."
        );
    }
}


/* =========================================================
   UPLOAD PAYMENT SCREENSHOT
========================================================= */

async function uploadScreenshot(
    file,
    sellerId,
    paymentId
) {

    validateScreenshot(file);


    const safeName =
        file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


    const storagePath =
        `payments/${sellerId}/${paymentId}/${Date.now()}-${safeName}`;


    const storageRef =
        ref(
            storage,
            storagePath
        );


    await uploadBytes(
        storageRef,
        file,
        {
            contentType: file.type
        }
    );


    return await getDownloadURL(
        storageRef
    );
}


/* =========================================================
   SUBMIT PAYMENT
========================================================= */

async function submitPayment(event) {

    event.preventDefault();

    clearStatus();


    if (!currentUser) {

        showStatus(
            "Please log in before submitting payment.",
            "error"
        );

        return;
    }


    /*
       Do not create another subscription
       while one is already active.
    */

    if (currentSubscription) {

        showStatus(
            "You already have an active subscription. Please use the subscription management workflow for an upgrade or downgrade.",
            "error"
        );

        return;
    }


    /*
       Do not allow duplicate pending payments.
    */

    if (pendingPayments.length > 0) {

        showStatus(
            "You already have a payment pending Owner verification. Please wait for the current payment to be reviewed.",
            "error"
        );

        return;
    }


    if (!selectedPlan) {

        showStatus(
            "Please choose a subscription plan first.",
            "error"
        );

        return;
    }


    const reference =
        paymentReference
            ? paymentReference.value.trim()
            : "";


    const screenshot =
        paymentScreenshot &&
        paymentScreenshot.files
            ? paymentScreenshot.files[0]
            : null;


    if (!reference) {

        showStatus(
            "Please enter your payment reference.",
            "error"
        );

        return;
    }


    if (
        reference.length < 3
    ) {

        showStatus(
            "Please enter a valid payment reference.",
            "error"
        );

        return;
    }


    try {

        validateScreenshot(
            screenshot
        );

    } catch (error) {

        showStatus(
            error.message,
            "error"
        );

        return;
    }


    submitPaymentBtn.disabled =
        true;

    submitPaymentBtn.textContent =
        "Submitting...";


    try {

        /* =============================================
           STEP 1
           CREATE SUBSCRIPTION REQUEST
        ============================================== */

        const subscription =
            await createSubscriptionRequest({

                sellerId:
                    currentUser.uid,

                planId:
                    selectedPlan.id

            });


        if (
            !subscription ||
            !subscription.subscriptionId
        ) {

            throw new Error(
                "Unable to create subscription request."
            );
        }


        /* =============================================
           STEP 2
           CREATE PAYMENT RECORD
        ============================================== */

        const payment =
            await createPaymentRecord({

                sellerId:
                    currentUser.uid,

                subscriptionId:
                    subscription.subscriptionId,

                planId:
                    selectedPlan.id,

                amount:
                    selectedPlan.price,

                paymentReference:
                    reference

            });


        if (
            !payment ||
            !payment.paymentId
        ) {

            throw new Error(
                "Unable to create payment record."
            );
        }


        /* =============================================
           STEP 3
           UPLOAD SCREENSHOT
        ============================================== */

        const screenshotUrl =
            await uploadScreenshot(

                screenshot,

                currentUser.uid,

                payment.paymentId

            );


        /* =============================================
           STEP 4
           ATTACH SCREENSHOT URL
        ============================================== */

        await attachPaymentScreenshot({

            paymentId:
                payment.paymentId,

            screenshotUrl

        });


        /* =============================================
           STEP 5
           IMPORTANT
           DO NOT ACTIVATE HERE.
        ============================================== */

        showStatus(
            "Payment submitted successfully. Your subscription is now pending Owner verification.",
            "success"
        );


        if (paymentForm) {
            paymentForm.reset();
        }


        selectedPlan =
            null;


        document
            .querySelectorAll(".plan-card")
            .forEach(card => {

                card.classList.remove(
                    "selected"
                );

            });


        /*
           Reload pending state.
        */

        await loadPendingPayments();

        await loadCurrentSubscription();


    } catch (error) {

        console.error(
            "Payment submission error:",
            error
        );


        showStatus(
            error?.message ||
            "Unable to submit payment. Please try again.",
            "error"
        );


    } finally {

        submitPaymentBtn.disabled =
            false;

        submitPaymentBtn.textContent =
            "Submit Payment for Verification";
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        if (!user.emailVerified) {

            window.location.href =
                "login.html";

            return;
        }


        currentUser =
            user;


        /*
           Render plans first.
        */

        renderPlans();


        /*
           Load active subscription.
        */

        await loadCurrentSubscription();


        /*
           Load pending payments.
        */

        await loadPendingPayments();

    }
);


/* =========================================================
   PAYMENT FORM EVENT
========================================================= */

if (paymentForm) {

    paymentForm.addEventListener(
        "submit",
        submitPayment
    );
}
