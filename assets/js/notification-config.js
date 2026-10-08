/* =========================================================
   TIPECO GROUP — NOTIFICATION CONFIG v1.0
   Central Notification Configuration
   Firebase Firestore Backend
   ========================================================= */


/* =========================================================
   COLLECTIONS
   ========================================================= */

export const NOTIFICATIONS_COLLECTION = "notifications";


/* =========================================================
   NOTIFICATION TYPES
   ========================================================= */

export const NOTIFICATION_TYPES = Object.freeze({

    SUBSCRIPTION: "subscription",

    PAYMENT: "payment",

    LISTING_SUBMITTED: "listing_submitted",

    LISTING_REVIEW: "listing_review",

    LISTING_APPROVED: "listing_approved",

    LISTING_REJECTED: "listing_rejected",

    LISTING_NEEDS_CHANGES: "listing_needs_changes",

    CHAT_MESSAGE: "chat_message",

    JOB_APPLICATION: "job_application",

    ACCOUNT: "account",

    SECURITY: "security",

    SYSTEM: "system",

    OWNER: "owner"

});


/* =========================================================
   NOTIFICATION PRIORITY
   ========================================================= */

export const NOTIFICATION_PRIORITIES = Object.freeze({

    LOW: "low",

    NORMAL: "normal",

    HIGH: "high",

    URGENT: "urgent"

});


/* =========================================================
   NOTIFICATION STATUS
   ========================================================= */

export const NOTIFICATION_STATUS = Object.freeze({

    UNREAD: "unread",

    READ: "read"

});


/* =========================================================
   NOTIFICATION ACTIONS
   ========================================================= */

export const NOTIFICATION_ACTIONS = Object.freeze({

    OPEN: "open",

    MARK_READ: "mark_read",

    MARK_ALL_READ: "mark_all_read"

});


/* =========================================================
   NOTIFICATION DOCUMENT FIELDS
   ========================================================= */

export const NOTIFICATION_FIELDS = Object.freeze({

    ID: "id",

    USER_ID: "userId",

    TYPE: "type",

    TITLE: "title",

    MESSAGE: "message",

    LINK: "link",

    RELATED_ID: "relatedId",

    STATUS: "status",

    IS_READ: "isRead",

    PRIORITY: "priority",

    CREATED_AT: "createdAt",

    READ_AT: "readAt"

});


/* =========================================================
   DEFAULT VALUES
   ========================================================= */

export const NOTIFICATION_DEFAULTS = Object.freeze({

    STATUS: NOTIFICATION_STATUS.UNREAD,

    IS_READ: false,

    PRIORITY: NOTIFICATION_PRIORITIES.NORMAL

});


/* =========================================================
   PAGINATION / DISPLAY
   ========================================================= */

export const NOTIFICATION_LIMITS = Object.freeze({

    DEFAULT_PAGE_SIZE: 20,

    MAX_PAGE_SIZE: 50,

    UNREAD_COUNT_LIMIT: 100

});


/* =========================================================
   USER NOTIFICATION RULES
   ========================================================= */

export const NOTIFICATION_RULES = Object.freeze({

    PRIVATE_ONLY: true,

    USER_ONLY: true,

    OWNER_CONTROL: true,

    FIREBASE_SOURCE_OF_TRUTH: true,

    LOCAL_STORAGE_AUTH: false,

    PUBLIC_NOTIFICATIONS: false,

    GROUP_NOTIFICATIONS: false,

    SYSTEM_NOTIFICATIONS: true,

    PRESERVE_CREATED_AT: true,

    PRESERVE_READ_AT: true

});


/* =========================================================
   SUPPORTED RELATED RESOURCES
   ========================================================= */

export const NOTIFICATION_RELATED_RESOURCES = Object.freeze({

    SUBSCRIPTION: "subscription",

    PAYMENT: "payment",

    LISTING: "listing",

    CHAT: "chat",

    JOB: "job",

    ACCOUNT: "account",

    SYSTEM: "system"

});


/* =========================================================
   BELL CONFIGURATION
   ========================================================= */

export const NOTIFICATION_BELL_CONFIG = Object.freeze({

    ENABLED: true,

    SHOW_UNREAD_COUNT: true,

    MAX_UNREAD_BADGE: 99,

    SHOW_EMPTY_STATE: true,

    AUTO_REFRESH: true

});


/* =========================================================
   NOTIFICATION RETENTION
   =========================================================

   Notifications are not automatically deleted by the
   client-side notification system.

   Retention/deletion, if ever required, remains an
   Owner/backend-controlled operation.
   ========================================================= */

export const NOTIFICATION_RETENTION = Object.freeze({

    AUTO_DELETE: false,

    OWNER_CONTROLLED: true

});
