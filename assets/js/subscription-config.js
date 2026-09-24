/* =========================================================
   TIPECO GROUP
   SUBSCRIPTION CONFIGURATION
   REAL PROJECT
   VERSION 1.0
========================================================= */

/*
   IMPORTANT:
   Subscription != Approval

   A subscription only gives a seller eligibility to submit
   listings. Every listing still requires TIPECO Owner review
   and approval before becoming public.
*/


export const SUBSCRIPTION_COLLECTION = "subscriptions";
export const PAYMENTS_COLLECTION = "payments";


/* =========================================================
   SUBSCRIPTION PLANS
========================================================= */

export const SUBSCRIPTION_PLANS = Object.freeze({

    starter: Object.freeze({
        id: "starter",
        name: "Starter",

        price: 2000,
        currency: "RWF",

        durationDays: 30,

        activePostLimit: 30,

        videoAllowed: false
    }),

    business: Object.freeze({
        id: "business",
        name: "Business",

        price: 5000,
        currency: "RWF",

        durationDays: 60,

        activePostLimit: 90,

        videoAllowed: true
    }),

    professional: Object.freeze({
        id: "professional",
        name: "Professional",

        price: 10000,
        currency: "RWF",

        durationDays: 90,

        activePostLimit: 200,

        videoAllowed: true
    })

});


/* =========================================================
   HELPERS
========================================================= */

export function getSubscriptionPlan(planId) {

    if (!planId) {
        return null;
    }

    return SUBSCRIPTION_PLANS[String(planId).toLowerCase()] || null;
}


export function getAllSubscriptionPlans() {

    return Object.values(SUBSCRIPTION_PLANS);
}


export function isValidSubscriptionPlan(planId) {

    return Boolean(getSubscriptionPlan(planId));
}


/* =========================================================
   STATUS CONSTANTS
========================================================= */

export const SUBSCRIPTION_STATUS = Object.freeze({

    PENDING: "pending",

    ACTIVE: "active",

    SUSPENDED: "suspended",

    CANCELLED: "cancelled",

    EXPIRED: "expired"
});


/* =========================================================
   PAYMENT STATUS
========================================================= */

export const PAYMENT_STATUS = Object.freeze({

    PENDING: "pending",

    CONFIRMED: "confirmed",

    FAILED: "failed",

    CANCELLED: "cancelled",

    REFUNDED: "refunded"
});


/* =========================================================
   PAYMENT METHOD
========================================================= */

export const PAYMENT_METHOD = Object.freeze({

    MOMO: "momo"
});


/* =========================================================
   MOMO MERCHANT INFORMATION
========================================================= */

/*
   This is a merchant identifier/code, NOT an API secret.

   Do NOT put MTN API credentials or secret keys here.
*/

export const MOMO_MERCHANT = Object.freeze({

    code: "578849",

    name: "TIMOTHEE",

    currency: "RWF"
});


/* =========================================================
   SUBSCRIPTION RULES
========================================================= */

export const SUBSCRIPTION_RULES = Object.freeze({

    /*
       Existing active listings are NOT deleted when a
       subscription expires.
    */
    expireActiveListings: true,

    /*
       Renewal does NOT automatically reactivate all
       previously active listings.
    */
    autoReactivateListings: false,

    /*
       Upgrade takes effect immediately.
    */
    upgradeImmediate: true,

    /*
       Downgrade takes effect at the end of the current
       subscription period.
    */
    downgradeAtPeriodEnd: true,

    /*
       Payment must be confirmed before subscription
       becomes active.
    */
    requirePaymentConfirmation: true,

    /*
       Subscription never automatically approves a listing.
    */
    subscriptionEqualsApproval: false
});
