/* =========================================================
   TIPECO GROUP
   SUBSCRIPTION SERVICE
   MANUAL MOMO PAYMENT + OWNER VERIFICATION
   FIRESTORE DATA LAYER
   VERSION 1.1
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

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}


function isSubscriptionExpired(subscription) {

    if (!subscription?.expiresAt) {
        return false;
    }

    const expiresAt =
        getDateValue(subscription.expiresAt);

    if (!expiresAt) {
        return false;
    }

    return expiresAt.getTime() <= Date.now();
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


    /*
       Prevent another subscription request while an
       active subscription already exists.
    */

    const activeSubscription =
        await getActiveSellerSubscription(
            sellerId
        );


    if (activeSubscription) {

        throw new Error(
            "You already have an active subscription."
        );
    }


    /*
       Prevent duplicate pending subscription requests.
    */

    const pendingQuery = query(
        collection(
            db,
            SUBSCRIPTION_COLLECTION
        ),

        where(
            "sellerId",
            "==",
            sellerId
        ),

        where(
            "status",
            "==",
            SUBSCRIPTION_STATUS.PENDING
        ),

        limit(1)
    );


    const pendingSnapshot =
        await getDocs(
            pendingQuery
        );


    if (!pendingSnapshot.empty) {

        throw new Error(
            "You already have a pending subscription request. Please wait for Owner verification."
        );
    }


    const subscriptionRef =
        doc(
            collection(
                db,
                SUBSCRIPTION_COLLECTION
            )
        );


    const subscriptionData = {

        sellerId,

        planId: plan.id,
        planName: plan.name,

        price: plan.price,
        currency: plan.currency,

        durationDays:
            plan.durationDays,

        activePostLimit:
            plan.activePostLimit,

        videoAllowed:
            plan.videoAllowed,

        status:
            SUBSCRIPTION_STATUS.PENDING,

        paymentStatus:
            PAYMENT_STATUS.PENDING,

        paymentId: null,

        startedAt: null,
        expiresAt: null,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()
    };


    await setDoc(
        subscriptionRef,
        subscriptionData
    );


    return {

        subscriptionId:
            subscriptionRef.id,

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
        throw new Error(
            "Subscription ID is required."
        );
    }


    const plan =
        requirePlan(planId);


    if (
        Number(amount) !==
        Number(plan.price)
    ) {

        throw new Error(
            "Payment amount does not match the selected plan."
        );
    }


    /*
       Verify subscription ownership and state.
    */

    const subscriptionRef =
        doc(
            db,
            SUBSCRIPTION_COLLECTION,
            subscriptionId
        );


    const subscriptionSnapshot =
        await getDoc(
            subscriptionRef
        );


    if (
        !subscriptionSnapshot.exists()
    ) {

        throw new Error(
            "Subscription request not found."
        );
    }


    const subscription =
        subscriptionSnapshot.data();


    if (
        subscription.sellerId !==
        sellerId
    ) {

        throw new Error(
            "You do not own this subscription request."
        );
    }


    if (
        subscription.status !==
        SUBSCRIPTION_STATUS.PENDING
    ) {

        throw new Error(
            "This subscription request is no longer pending."
        );
    }


    const paymentRef =
        doc(
            collection(
                db,
                PAYMENTS_COLLECTION
            )
        );


    const paymentData = {

        sellerId,

        subscriptionId,

        planId:
            plan.id,

        amount:
            plan.price,

        currency:
            plan.currency,

        paymentMethod:
            PAYMENT_METHOD.MOMO,

        merchantCode:
            MOMO_MERCHANT.code,

        merchantName:
            MOMO_MERCHANT.name,

        paymentReference,

        paymentStatus:
            PAYMENT_STATUS.PENDING,

        screenshotUrl:
            null,

        initiatedAt:
            serverTimestamp(),

        submittedAt:
            null,

        confirmedAt:
            null,

        reviewedBy:
            null,

        reviewedAt:
            null,

        reviewReason:
            null,

        updatedAt:
            serverTimestamp()
    };


    await setDoc(
        paymentRef,
        paymentData
    );


    /*
       Connect the subscription request to
       the payment record.
    */

    await updateDoc(
        subscriptionRef,
        {

            paymentId:
                paymentRef.id,

            updatedAt:
                serverTimestamp()
        }
    );


    return {

        paymentId:
            paymentRef.id,

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
        throw new Error(
            "Payment ID is required."
        );
    }

    if (!screenshotUrl) {
        throw new Error(
            "Payment screenshot is required."
        );
    }


    const paymentRef =
        doc(
            db,
            PAYMENTS_COLLECTION,
            paymentId
        );


    const paymentSnapshot =
        await getDoc(
            paymentRef
        );


    if (
        !paymentSnapshot.exists()
    ) {

        throw new Error(
            "Payment record not found."
        );
    }


    const payment =
        paymentSnapshot.data();


    /*
       Screenshot can only be attached while
       the payment is still pending.
    */

    if (
        payment.paymentStatus !==
        PAYMENT_STATUS.PENDING
    ) {

        throw new Error(
            "This payment is no longer pending and cannot accept a new screenshot."
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

export async function getPaymentById(
    paymentId
) {

    if (!paymentId) {
        return null;
    }


    const paymentRef =
        doc(
            db,
            PAYMENTS_COLLECTION,
            paymentId
        );


    const snapshot =
        await getDoc(
            paymentRef
        );


    if (!snapshot.exists()) {
        return null;
    }


    return {

        id:
            snapshot.id,

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


    const subscriptionRef =
        doc(
            db,
            SUBSCRIPTION_COLLECTION,
            subscriptionId
        );


    const snapshot =
        await getDoc(
            subscriptionRef
        );


    if (!snapshot.exists()) {
        return null;
    }


    return {

        id:
            snapshot.id,

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


    const subscriptionsRef =
        collection(
            db,
            SUBSCRIPTION_COLLECTION
        );


    const activeQuery =
        query(
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


    const snapshot =
        await getDocs(
            activeQuery
        );


    if (snapshot.empty) {
        return null;
    }


    const subscriptions =
        snapshot.docs.map(
            item => ({
                id:
                    item.id,

                ...item.data()
            })
        );


    /*
       Find a subscription that is genuinely
       still within its active period.
    */

    const activeSubscription =
        subscriptions.find(
            subscription =>
                !isSubscriptionExpired(
                    subscription
                )
        );


    /*
       If Firestore still says ACTIVE but the
       expiration date has passed, return null.

       The Owner/management workflow can later
       mark the record EXPIRED and deactivate
       its listings.
    */

    return activeSubscription || null;
}


/* =========================================================
   GET SELLER SUBSCRIPTION FOR LISTING
========================================================= */

export async function getSellerListingEntitlement(
    sellerId
) {

    requireSellerId(sellerId);


    const subscription =
        await getActiveSellerSubscription(
            sellerId
        );


    if (!subscription) {

        return {

            eligible:
                false,

            subscription:
                null,

            activePostLimit:
                0,

            videoAllowed:
                false,

            reason:
                "No active subscription."
        };
    }


    return {

        eligible:
            true,

        subscription,

        activePostLimit:
            Number(
                subscription.activePostLimit || 0
            ),

        videoAllowed:
            subscription.videoAllowed === true,

        reason:
            ""
    };
}


/* =========================================================
   GET SELLER PENDING PAYMENTS
========================================================= */

export async function getSellerPendingPayments(
    sellerId
) {

    requireSellerId(sellerId);


    const paymentsRef =
        collection(
            db,
            PAYMENTS_COLLECTION
        );


    const pendingQuery =
        query(
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


    const snapshot =
        await getDocs(
            pendingQuery
        );


    return snapshot.docs.map(
        item => ({

            id:
                item.id,

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
    reason =
        "Payment verified by Owner"
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


    const paymentRef =
        doc(
            db,
            PAYMENTS_COLLECTION,
            paymentId
        );


    const paymentSnapshot =
        await getDoc(
            paymentRef
        );


    if (
        !paymentSnapshot.exists()
    ) {

        throw new Error(
            "Payment not found."
        );
    }


    const payment =
        paymentSnapshot.data();


    /*
       Only pending payments can be confirmed.
    */

    if (
        payment.paymentStatus !==
        PAYMENT_STATUS.PENDING
    ) {

        throw new Error(
            "Only pending payments can be confirmed."
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
    reason =
        "Payment verified and subscription activated"
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


    const subscriptionRef =
        doc(
            db,
            SUBSCRIPTION_COLLECTION,
            subscriptionId
        );


    const subscriptionSnapshot =
        await getDoc(
            subscriptionRef
        );


    if (
        !subscriptionSnapshot.exists()
    ) {

        throw new Error(
            "Subscription not found."
        );
    }


    const subscription =
        subscriptionSnapshot.data();


    const plan =
        requirePlan(
            subscription.planId
        );


    if (
        subscription.status ===
        SUBSCRIPTION_STATUS.ACTIVE
    ) {

        throw new Error(
            "This subscription is already active."
        );
    }


    /*
       If a payment ID is supplied, verify that the
       payment belongs to this subscription.
    */

    if (paymentId) {

        const paymentRef =
            doc(
                db,
                PAYMENTS_COLLECTION,
                paymentId
            );


        const paymentSnapshot =
            await getDoc(
                paymentRef
            );


        if (
            !paymentSnapshot.exists()
        ) {

            throw new Error(
                "Payment not found."
            );
        }


        const payment =
            paymentSnapshot.data();


        if (
            payment.subscriptionId !==
            subscriptionId
        ) {

            throw new Error(
                "Payment does not belong to this subscription."
            );
        }


        if (
            payment.sellerId !==
            subscription.sellerId
        ) {

            throw new Error(
                "Payment seller does not match subscription seller."
            );
        }


        /*
           Subscription can only be activated after
           Owner has confirmed the payment.
        */

        if (
            payment.paymentStatus !==
            PAYMENT_STATUS.CONFIRMED
        ) {

            throw new Error(
                "Payment must be confirmed by Owner before the subscription can be activated."
            );
        }
    }


    /*
       Activation time.

       We keep the existing project architecture
       and calculate the plan period from activation.
    */

    const startedAt =
        new Date();


    const expiresAt =
        new Date(
            startedAt
        );


    expiresAt.setDate(
        expiresAt.getDate() +
        Number(
            plan.durationDays
        )
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

                action:
                    "activate",

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
       Confirm the payment as part of activation.
    */

    if (paymentId) {

        const paymentRef =
            doc(
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


    const paymentRef =
        doc(
            db,
            PAYMENTS_COLLECTION,
            paymentId
        );


    const snapshot =
        await getDoc(
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


    if (payment.subscriptionId) {

        const subscriptionRef =
            doc(
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


    const subscriptionRef =
        doc(
            db,
            SUBSCRIPTION_COLLECTION,
            subscriptionId
        );


    const snapshot =
        await getDoc(
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

                action:
                    "suspend",

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


    const subscriptionRef =
        doc(
            db,
            SUBSCRIPTION_COLLECTION,
            subscriptionId
        );


    const snapshot =
        await getDoc(
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

                action:
                    "cancel",

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


    const subscriptionRef =
        doc(
            db,
            SUBSCRIPTION_COLLECTION,
            subscriptionId
        );


    const snapshot =
        await getDoc(
            subscriptionRef
        );


    if (!snapshot.exists()) {
        throw new Error(
            "Subscription not found."
        );
    }


    const subscription =
        snapshot.data();


    const currentExpiry =
        getDateValue(
            subscription.expiresAt
        ) || new Date();


    const newExpiry =
        new Date(
            currentExpiry
        );


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

                action:
                    "extend",

                changedBy:
                    ownerId,

                previousStatus:
                    subscription.status ||
                    null,

                newStatus:
                    subscription.status ||
                    null,

                additionalDays:
                    Number(
                        additionalDays
                    ),

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
