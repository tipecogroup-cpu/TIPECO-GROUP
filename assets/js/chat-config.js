/* =========================================================
   TIPECO GROUP
   TIPECO CHAT CONFIGURATION
   REAL PROJECT
   VERSION 1.0
========================================================= */

/*
   IMPORTANT:
   TIPECO CHAT is a protected communication service.

   Chat is NOT public.
   Users may communicate only through authorized
   conversations.

   TIPECO CHAT does not replace Owner moderation.
*/


/* =========================================================
   FIRESTORE COLLECTIONS
========================================================= */

export const CHAT_COLLECTION = "chatConversations";

export const CHAT_MESSAGES_COLLECTION = "messages";

export const CHAT_REPORTS_COLLECTION = "chatReports";

export const CHAT_BLOCKS_COLLECTION = "chatBlocks";


/* =========================================================
   CONVERSATION TYPES
========================================================= */

export const CHAT_CONVERSATION_TYPE = Object.freeze({

    LISTING: "listing",

    JOB: "job"
});


/* =========================================================
   CONVERSATION STATUS
========================================================= */

export const CHAT_CONVERSATION_STATUS = Object.freeze({

    ACTIVE: "active",

    BLOCKED: "blocked",

    CLOSED: "closed",

    MODERATED: "moderated"
});


/* =========================================================
   MESSAGE STATUS
========================================================= */

export const CHAT_MESSAGE_STATUS = Object.freeze({

    ACTIVE: "active",

    EDITED: "edited",

    DELETED_FOR_SELF: "deleted_for_self",

    REMOVED_BY_OWNER: "removed_by_owner"
});


/* =========================================================
   CHAT REQUEST STATUS
========================================================= */

export const CHAT_REQUEST_STATUS = Object.freeze({

    PENDING: "pending",

    ACCEPTED: "accepted",

    DECLINED: "declined",

    CANCELLED: "cancelled"
});


/* =========================================================
   BLOCK STATUS
========================================================= */

export const CHAT_BLOCK_STATUS = Object.freeze({

    ACTIVE: "active",

    REMOVED: "removed"
});


/* =========================================================
   REPORT STATUS
========================================================= */

export const CHAT_REPORT_STATUS = Object.freeze({

    PENDING: "pending",

    REVIEWING: "reviewing",

    RESOLVED: "resolved",

    DISMISSED: "dismissed"
});


/* =========================================================
   REPORT REASONS
========================================================= */

export const CHAT_REPORT_REASON = Object.freeze({

    SCAM: "scam",

    FRAUD: "fraud",

    HARASSMENT: "harassment",

    ABUSE: "abuse",

    SPAM: "spam",

    INAPPROPRIATE_CONTENT: "inappropriate_content",

    IMPERSONATION: "impersonation",

    OTHER: "other"
});


/* =========================================================
   OWNER MODERATION ACTIONS
========================================================= */

export const CHAT_MODERATION_ACTION = Object.freeze({

    REVIEW: "review",

    REMOVE_MESSAGE: "remove_message",

    CLOSE_CONVERSATION: "close_conversation",

    BLOCK_USER: "block_user",

    RESOLVE_REPORT: "resolve_report",

    DISMISS_REPORT: "dismiss_report"
});


/* =========================================================
   MESSAGE EDITING
========================================================= */

export const CHAT_MESSAGE_RULES = Object.freeze({

    /*
       User may edit their own message.
    */
    allowMessageEdit: true,

    /*
       Editing is intended for recent messages.
       The exact time window will be enforced by
       chat-service.js.
    */
    messageEditWindowMinutes: 15,

    /*
       User may hide their own message from their
       own view without deleting moderation evidence.
    */
    allowDeleteForSelf: true,

    /*
       Owner may remove a message for moderation.
    */
    ownerCanRemoveMessage: true,

    /*
       Moderated messages must remain traceable.
    */
    preserveModerationRecord: true
});


/* =========================================================
   CHAT PRIVACY RULES
========================================================= */

export const CHAT_PRIVACY_RULES = Object.freeze({

    /*
       Personal contact information should not be
       published as part of marketplace communication.
    */
    protectPersonalContactInformation: true,

    /*
       Chat conversations are private.
    */
    privateConversationsOnly: true,

    /*
       Users can only access conversations in which
       they are authorized participants.
    */
    participantAccessOnly: true,

    /*
       Owner moderation remains available.
    */
    ownerModerationEnabled: true
});


/* =========================================================
   CHAT FEATURE RULES
========================================================= */

export const CHAT_RULES = Object.freeze({

    /*
       One-to-one communication only.
    */
    oneToOneOnly: true,

    /*
       Chat can be connected to an approved marketplace
       listing.
    */
    listingChatEnabled: true,

    /*
       Chat can be connected to a job.
    */
    jobChatEnabled: true,

    /*
       Group conversations are not enabled.
    */
    groupChatEnabled: false,

    /*
       Public chat is not enabled.
    */
    publicChatEnabled: false,

    /*
       Blocking is supported.
    */
    blockingEnabled: true,

    /*
       Reporting is supported.
    */
    reportingEnabled: true,

    /*
       Owner moderation is supported.
    */
    moderationEnabled: true
});


/* =========================================================
   SUPPORTED CONVERSATION TYPES
========================================================= */

export function isValidChatConversationType(type) {

    if (!type) {
        return false;
    }

    return Object.values(CHAT_CONVERSATION_TYPE)
        .includes(String(type).toLowerCase());
}


/* =========================================================
   SUPPORTED CONVERSATION STATUS
========================================================= */

export function isValidChatConversationStatus(status) {

    if (!status) {
        return false;
    }

    return Object.values(CHAT_CONVERSATION_STATUS)
        .includes(String(status).toLowerCase());
}


/* =========================================================
   SUPPORTED MESSAGE STATUS
========================================================= */

export function isValidChatMessageStatus(status) {

    if (!status) {
        return false;
    }

    return Object.values(CHAT_MESSAGE_STATUS)
        .includes(String(status).toLowerCase());
}


/* =========================================================
   SUPPORTED REPORT REASON
========================================================= */

export function isValidChatReportReason(reason) {

    if (!reason) {
        return false;
    }

    return Object.values(CHAT_REPORT_REASON)
        .includes(String(reason).toLowerCase());
}


/* =========================================================
   CHAT IDENTIFIERS
========================================================= */

export const CHAT_FIELD_LIMITS = Object.freeze({

    /*
       Maximum message length.
       UI/service validation will enforce this.
    */
    maxMessageLength: 5000,

    /*
       Maximum report explanation length.
    */
    maxReportLength: 2000
});


/* =========================================================
   ARCHITECTURE LOCK
========================================================= */

/*
   TIPECO CHAT follows these permanent principles:

   1. Chat is private.
   2. Chat is one-to-one.
   3. Listing-based conversations are supported.
   4. Job-based conversations are supported.
   5. Group chat is disabled.
   6. Public chat is disabled.
   7. Blocking is supported.
   8. Reporting is supported.
   9. Owner moderation is supported.
   10. Users cannot permanently erase moderation evidence.
   11. Personal contact information should remain protected.
   12. Subscription does NOT equal approval.
*/

export const CHAT_ARCHITECTURE_VERSION = "1.0";
