/* =========================================================
   TIPECO GROUP
   SUBSCRIPTION SERVICE
   MANUAL MOMO PAYMENT + OWNER VERIFICATION
   FIRESTORE DATA LAYER
   VERSION 1.0
========================================================= */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    serverTimestamp,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";

import {
    SUBSCRIPTION_COLLECTION,
    PAYMENTS_COLLECTION,
    SUBSCRIPTION_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
    MOMO_MERCHANT,
    getSubscriptionPlan
} from "./subscription-config.js";


/* =========================================================
   INTERNAL HELPERS
========================================================= */

function requireSellerId(sellerId) {

    if (!sellerId) {
        throw new Error("Seller ID is required.");
    }
}


function requirePlan(planId) {

    const plan = getSubscriptionPlan(planId);

    if (!plan) {
        throw new Error("Invalid subscription plan.");
    }

    return plan;
}


/* =========================================================
   CREATE SUBSCRIPTION REQUEST
========================================================= */

export async function createSubscriptionRequest({
    sellerId,
    planId
}) {

    requireSellerId(sellerId);

    const plan = requirePlan(planId);


    const subscriptionRef = doc(
        collection(db, SUBSCRIPTION_COLLECTION)
    );


    const subscriptionData = {

        sellerId,

        planId: plan.id,
        planName: plan.name,

        price: plan.price,
        currency: plan.currency,

        durationDays: plan.durationDays,

        activePostLimit: plan.activePostLimit,

        videoAllowed: plan.videoAllowed,

        status: SUBSCRIPTION_STATUS.PENDING,

        paymentStatus: PAYMENT_STATUS.PENDING,

        paymentId: null,

        startedAt: null,
        expiresAt: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };


    await setDoc(
        subscriptionRef,
        subscriptionData
    );


    return {

        subscriptionId: subscriptionRef.id,

        ...subscriptionData
    };
}


/* =========================================================
   CREATE PAYMENT RECORD
========================================================= */

export async function createPaymentRecord({
    sellerId,
    subscriptionId,
    planId,
    amount,
    paymentReference = null
}) {

    requireSellerId(sellerId);

    if (!subscriptionId) {
        throw new Error("Subscription ID is required.");
    }


    const plan = requirePlan(planId);


    if (Number(amount) !== Number(plan.price)) {
        throw new Error(
            "Payment amount does not match the selected plan."
        );
    }


    const paymentRef = doc(
        collection(db, PAYMENTS_COLLECTION)
    );


    const paymentData = {

        sellerId,

        subscriptionId,

        planId: plan.id,

        amount: plan.price,

        currency: "RWF",

        paymentMethod: PAYMENT_METHOD.MOMO,

        merchantCode: MOMO_MERCHANT.code,

        merchantName: MOMO_MERCHANT.name,

        paymentReference,

        paymentStatus: PAYMENT_STATUS.PENDING,

        screenshotUrl: null,

        initiatedAt: serverTimestamp(),

        submittedAt: null,

        confirmedAt: null,

        reviewedBy: null,

        reviewedAt: null,

        reviewReason: null,

        updatedAt: serverTimestamp()
    };


    await setDoc(
        paymentRef,
        paymentData
    );


    return {

        paymentId: paymentRef.id,

        ...paymentData
    };
}


/* =========================================================
   ATTACH PAYMENT SCREENSHOT
========================================================= */

export async function attachPaymentScreenshot({
    paymentId,
    screenshotUrl
}) {

    if (!paymentId) {
        throw new Error("Payment ID is required.");
    }

    if (!screenshotUrl) {
        throw new Error("Payment screenshot is required.");
    }


    const paymentRef = doc(
        db,
        PAYMENTS_COLLECTION,
        paymentId
    );


    const paymentSnapshot = await getDoc(
        paymentRef
    );


    if (!paymentSnapshot.exists()) {
        throw new Error("Payment record not found.");
    }


    const payment = paymentSnapshot.data();


    if (
        payment.paymentStatus ===
        PAYMENT_STATUS.CONFIRMED
    ) {
        throw new Error(
            "This payment has already been confirmed."
        );
    }


    await updateDoc(
        paymentRef,
        {

            screenshotUrl,

            submittedAt:
                serverTimestamp(),

            paymentStatus:
                PAYMENT_STATUS.PENDING,

            updatedAt:
                serverTimestamp()
        }
    );


    return true;
}


/* =========================================================
   GET PAYMENT BY ID
========================================================= */

export async function getPaymentById(paymentId) {

    if (!paymentId) {
        return null;
    }


    const paymentRef = doc(
        db,
        PAYMENTS_COLLECTION,
        paymentId
    );


    const snapshot = await getDoc(
        paymentRef
    );


    if (!snapshot.exists()) {
        return null;
    }


    return {

        id: snapshot.id,

        ...snapshot.data()
    };
}


/* =========================================================
   GET SUBSCRIPTION BY ID
========================================================= */

export async function getSubscriptionById(
    subscriptionId
) {

    if (!subscriptionId) {
        return null;
    }


    const subscriptionRef = doc(
        db,
        SUBSCRIPTION_COLLECTION,
        subscriptionId
    );


    const snapshot = await getDoc(
        subscriptionRef
    );


    if (!snapshot.exists()) {
        return null;
    }


    return {

        id: snapshot.id,

        ...snapshot.data()
    };
}


/* =========================================================
   GET SELLER ACTIVE SUBSCRIPTION
========================================================= */

export async function getActiveSellerSubscription(
    sellerId
) {

    requireSellerId(sellerId);


    const subscriptionsRef = collection(
        db,
        SUBSCRIPTION_COLLECTION
    );


    const activeQuery = query(
        subscriptionsRef,

        where(
            "sellerId",
            "==",
            sellerId
        ),

        where(
            "status",
            "==",
            SUBSCRIPTION_STATUS.ACTIVE
        ),

        limit(10)
    );


    const snapshot = await getDocs(
        activeQuery
    );


    if (snapshot.empty) {
        return null;
    }


    const subscriptions =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    /*
       Normally only one subscription should be
       active for a seller.
    */

    return subscriptions[0];
}


/* =========================================================
   GET SELLER PENDING PAYMENTS
========================================================= */

export async function getSellerPendingPayments(
    sellerId
) {

    requireSellerId(sellerId);


    const paymentsRef = collection(
        db,
        PAYMENTS_COLLECTION
    );


    const pendingQuery = query(
        paymentsRef,

        where(
            "sellerId",
            "==",
            sellerId
        ),

        where(
            "paymentStatus",
            "==",
            PAYMENT_STATUS.PENDING
        ),

        limit(20)
    );


    const snapshot = await getDocs(
        pendingQuery
    );


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );
}


/* =========================================================
   OWNER — CONFIRM PAYMENT
========================================================= */

export async function confirmPayment({
    paymentId,
    ownerId,
    reason = "Payment verified by Owner"
}) {

    if (!paymentId) {
        throw new Error("Payment ID is required.");
    }

    if (!ownerId) {
        throw new Error("Owner ID is required.");
    }


    const paymentRef = doc(
        db,
        PAYMENTS_COLLECTION,
        paymentId
    );


    const paymentSnapshot = await getDoc(
        paymentRef
    );


    if (!paymentSnapshot.exists()) {
        throw new Error("Payment not found.");
    }


    const payment =
        paymentSnapshot.data();


    if (
        payment.paymentStatus ===
        PAYMENT_STATUS.CONFIRMED
    ) {

        throw new Error(
            "This payment is already confirmed."
        );
    }


    await updateDoc(
        paymentRef,
        {

            paymentStatus:
                PAYMENT_STATUS.CONFIRMED,

            confirmedAt:
                serverTimestamp(),

            reviewedBy:
                ownerId,

            reviewedAt:
                serverTimestamp(),

            reviewReason:
                reason,

            updatedAt:
                serverTimestamp()
        }
    );


    return true;
}


/* =========================================================
   OWNER — ACTIVATE SUBSCRIPTION
========================================================= */

export async function activateSubscription({
    subscriptionId,
    paymentId,
    ownerId,
    reason = "Payment verified and subscription activated"
}) {

    if (!subscriptionId) {
        throw new Error(
            "Subscription ID is required."
        );
    }

    if (!ownerId) {
        throw new Error(
            "Owner ID is required."
        );
    }


    const subscriptionRef = doc(
        db,
        SUBSCRIPTION_COLLECTION,
        subscriptionId
    );


    const subscriptionSnapshot =
        await getDoc(subscriptionRef);


    if (!subscriptionSnapshot.exists()) {
        throw new Error(
            "Subscription not found."
        );
    }


    const subscription =
        subscriptionSnapshot.data();


    const plan = requirePlan(
        subscription.planId
    );


    /*
       Prevent accidental duplicate activation.
    */

    if (
        subscription.status ===
        SUBSCRIPTION_STATUS.ACTIVE
    ) {

        throw new Error(
            "This subscription is already active."
        );
    }


    /*
       Calculate expiration from activation time.
    */

    const startedAt = new Date();

    const expiresAt = new Date(
        startedAt
    );

    expiresAt.setDate(
        expiresAt.getDate() +
        Number(plan.durationDays)
    );


    await updateDoc(
        subscriptionRef,
        {

            status:
                SUBSCRIPTION_STATUS.ACTIVE,

            paymentStatus:
                PAYMENT_STATUS.CONFIRMED,

            paymentId:
                paymentId ||
                subscription.paymentId ||
                null,

            startedAt,

            expiresAt,

            updatedAt:
                serverTimestamp(),

            audit: {

                action: "activate",

                changedBy:
                    ownerId,

                previousStatus:
                    subscription.status ||
                    null,

                newStatus:
                    SUBSCRIPTION_STATUS.ACTIVE,

                reason,

                changedAt:
                    serverTimestamp()
            }
        }
    );


    /*
       Make sure the payment is also confirmed.
    */

    if (paymentId) {

        const paymentRef = doc(
            db,
            PAYMENTS_COLLECTION,
            paymentId
        );


        await updateDoc(
            paymentRef,
            {

                paymentStatus:
                    PAYMENT_STATUS.CONFIRMED,

                confirmedAt:
                    serverTimestamp(),

                reviewedBy:
                    ownerId,

                reviewedAt:
                    serverTimestamp(),

                reviewReason:
                    reason,

                updatedAt:
                    serverTimestamp()
            }
        );
    }


    return true;
}


/* =========================================================
   OWNER — REJECT PAYMENT
========================================================= */

export async function rejectPayment({
    paymentId,
    ownerId,
    reason
}) {

    if (!paymentId) {
        throw new Error(
            "Payment ID is required."
        );
    }

    if (!ownerId) {
        throw new Error(
            "Owner ID is required."
        );
    }

    if (!reason) {
        throw new Error(
            "A rejection reason is required."
        );
    }


    const paymentRef = doc(
        db,
        PAYMENTS_COLLECTION,
        paymentId
    );


    const snapshot = await getDoc(
        paymentRef
    );


    if (!snapshot.exists()) {
        throw new Error(
            "Payment not found."
        );
    }


    const payment =
        snapshot.data();


    await updateDoc(
        paymentRef,
        {

            paymentStatus:
                PAYMENT_STATUS.FAILED,

            reviewedBy:
                ownerId,

            reviewedAt:
                serverTimestamp(),

            reviewReason:
                reason,

            updatedAt:
                serverTimestamp()
        }
    );


    /*
       Keep the subscription pending.
       We do NOT activate it.
    */

    if (payment.subscriptionId) {

        const subscriptionRef = doc(
            db,
            SUBSCRIPTION_COLLECTION,
            payment.subscriptionId
        );


        await updateDoc(
            subscriptionRef,
            {

                paymentStatus:
                    PAYMENT_STATUS.FAILED,

                updatedAt:
                    serverTimestamp()
            }
        );
    }


    return true;
}


/* =========================================================
   OWNER — SUSPEND SUBSCRIPTION
========================================================= */

export async function suspendSubscription({
    subscriptionId,
    ownerId,
    reason
}) {

    if (!subscriptionId) {
        throw new Error(
            "Subscription ID is required."
        );
    }

    if (!ownerId) {
        throw new Error(
            "Owner ID is required."
        );
    }


    const subscriptionRef = doc(
        db,
        SUBSCRIPTION_COLLECTION,
        subscriptionId
    );


    const snapshot = await getDoc(
        subscriptionRef
    );


    if (!snapshot.exists()) {
        throw new Error(
            "Subscription not found."
        );
    }


    const subscription =
        snapshot.data();


    await updateDoc(
        subscriptionRef,
        {

            status:
                SUBSCRIPTION_STATUS.SUSPENDED,

            updatedAt:
                serverTimestamp(),

            audit: {

                action: "suspend",

                changedBy:
                    ownerId,

                previousStatus:
                    subscription.status ||
                    null,

                newStatus:
                    SUBSCRIPTION_STATUS.SUSPENDED,

                reason:
                    reason ||
                    "Suspended by Owner",

                changedAt:
                    serverTimestamp()
            }
        }
    );


    return true;
}


/* =========================================================
   OWNER — CANCEL SUBSCRIPTION
========================================================= */

export async function cancelSubscription({
    subscriptionId,
    ownerId,
    reason
}) {

    if (!subscriptionId) {
        throw new Error(
            "Subscription ID is required."
        );
    }

    if (!ownerId) {
        throw new Error(
            "Owner ID is required."
        );
    }


    const subscriptionRef = doc(
        db,
        SUBSCRIPTION_COLLECTION,
        subscriptionId
    );


    const snapshot = await getDoc(
        subscriptionRef
    );


    if (!snapshot.exists()) {
        throw new Error(
            "Subscription not found."
        );
    }


    const subscription =
        snapshot.data();


    await updateDoc(
        subscriptionRef,
        {

            status:
                SUBSCRIPTION_STATUS.CANCELLED,

            updatedAt:
                serverTimestamp(),

            audit: {

                action: "cancel",

                changedBy:
                    ownerId,

                previousStatus:
                    subscription.status ||
                    null,

                newStatus:
                    SUBSCRIPTION_STATUS.CANCELLED,

                reason:
                    reason ||
                    "Cancelled by Owner",

                changedAt:
                    serverTimestamp()
            }
        }
    );


    return true;
}


/* =========================================================
   OWNER — EXTEND SUBSCRIPTION
========================================================= */

export async function extendSubscription({
    subscriptionId,
    ownerId,
    additionalDays,
    reason
}) {

    if (!subscriptionId) {
        throw new Error(
            "Subscription ID is required."
        );
    }

    if (!ownerId) {
        throw new Error(
            "Owner ID is required."
        );
    }

    if (
        !Number.isFinite(
            Number(additionalDays)
        ) ||
        Number(additionalDays) <= 0
    ) {

        throw new Error(
            "Additional days must be greater than zero."
        );
    }


    const subscriptionRef = doc(
        db,
        SUBSCRIPTION_COLLECTION,
        subscriptionId
    );


    const snapshot = await getDoc(
        subscriptionRef
    );


    if (!snapshot.exists()) {
        throw new Error(
            "Subscription not found."
        );
    }


    const subscription =
        snapshot.data();


    let currentExpiry;


    if (
        subscription.expiresAt &&
        typeof subscription.expiresAt.toDate === "function"
    ) {

        currentExpiry =
            subscription.expiresAt.toDate();

    } else if (
        subscription.expiresAt instanceof Date
    ) {

        currentExpiry =
            subscription.expiresAt;

    } else {

        currentExpiry =
            new Date();
    }


    const newExpiry =
        new Date(currentExpiry);


    newExpiry.setDate(
        newExpiry.getDate() +
        Number(additionalDays)
    );


    await updateDoc(
        subscriptionRef,
        {

            expiresAt:
                newExpiry,

            updatedAt:
                serverTimestamp(),

            audit: {

                action: "extend",

                changedBy:
                    ownerId,

                previousStatus:
                    subscription.status ||
                    null,

                newStatus:
                    subscription.status ||
                    null,

                additionalDays:
                    Number(additionalDays),

                reason:
                    reason ||
                    "Extended by Owner",

                changedAt:
                    serverTimestamp()
            }
        }
    );


    return true;
}
