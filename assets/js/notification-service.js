/* =========================================================
   TIPECO GROUP — NOTIFICATION SERVICE v1.0
   Firebase Firestore Notification Backend
   Private User Notifications
   Owner-Controlled System
   ========================================================= */

import {
    db
} from "./firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    NOTIFICATIONS_COLLECTION,
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITIES,
    NOTIFICATION_STATUS,
    NOTIFICATION_DEFAULTS,
    NOTIFICATION_LIMITS
} from "./notification-config.js";


/* =========================================================
   CONSTANTS
   ========================================================= */

const COLLECTION =
    NOTIFICATIONS_COLLECTION;


/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

function normalizeString(value) {
    return String(value || "").trim();
}


function normalizeType(type) {
    const value = normalizeString(type).toLowerCase();

    const supportedTypes =
        Object.values(NOTIFICATION_TYPES);

    return supportedTypes.includes(value)
        ? value
        : NOTIFICATION_TYPES.SYSTEM;
}


function normalizePriority(priority) {
    const value =
        normalizeString(priority).toLowerCase();

    const supportedPriorities =
        Object.values(NOTIFICATION_PRIORITIES);

    return supportedPriorities.includes(value)
        ? value
        : NOTIFICATION_DEFAULTS.PRIORITY;
}


function normalizeLimit(limit) {
    const requested =
        Number(limit);

    if (
        !Number.isFinite(requested) ||
        requested <= 0
    ) {
        return NOTIFICATION_LIMITS.DEFAULT_PAGE_SIZE;
    }

    return Math.min(
        Math.floor(requested),
        NOTIFICATION_LIMITS.MAX_PAGE_SIZE
    );
}


function normalizeNotification(snapshot) {
    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data();

    return {
        id: snapshot.id,
        ...data
    };
}


function sortByCreatedAtDescending(notifications) {
    return notifications.sort((a, b) => {

        const aTime =
            a.createdAt?.toMillis?.() ||
            0;

        const bTime =
            b.createdAt?.toMillis?.() ||
            0;

        return bTime - aTime;
    });
}


/* =========================================================
   CREATE NOTIFICATION
   =========================================================

   Creates a private notification for one specific user.

   userId is required.

   The notification document ID and notification.id
   are always identical.
   ========================================================= */

export async function createNotification({
    userId,
    type,
    title,
    message,
    link = "",
    relatedId = null,
    priority = NOTIFICATION_DEFAULTS.PRIORITY
}) {

    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        throw new Error(
            "Notification user ID is required."
        );
    }

    const normalizedTitle =
        normalizeString(title);

    if (!normalizedTitle) {
        throw new Error(
            "Notification title is required."
        );
    }

    const normalizedMessage =
        normalizeString(message);

    if (!normalizedMessage) {
        throw new Error(
            "Notification message is required."
        );
    }

    const notificationRef =
        doc(collection(db, COLLECTION));

    const notificationId =
        notificationRef.id;

    const notificationData = {

        id: notificationId,

        userId: normalizedUserId,

        type: normalizeType(type),

        title: normalizedTitle,

        message: normalizedMessage,

        link:
            normalizeString(link),

        relatedId:
            relatedId
                ? normalizeString(relatedId)
                : null,

        status:
            NOTIFICATION_DEFAULTS.STATUS,

        isRead:
            NOTIFICATION_DEFAULTS.IS_READ,

        priority:
            normalizePriority(priority),

        createdAt:
            serverTimestamp(),

        readAt: null
    };

    await setDoc(
        notificationRef,
        notificationData
    );

    return {
        id: notificationId,
        ...notificationData
    };
}


/* =========================================================
   GET NOTIFICATION
   ========================================================= */

export async function getNotification(
    notificationId
) {

    const id =
        normalizeString(notificationId);

    if (!id) {
        return null;
    }

    const notificationRef =
        doc(db, COLLECTION, id);

    const snapshot =
        await getDoc(notificationRef);

    return normalizeNotification(snapshot);
}


/* =========================================================
   GET USER NOTIFICATIONS
   =========================================================

   Notifications are fetched only for the requested
   userId.

   Sorting is performed client-side so this service
   does not require a Firestore composite index.
   ========================================================= */

export async function getUserNotifications(
    userId,
    options = {}
) {

    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        throw new Error(
            "User ID is required to load notifications."
        );
    }

    const limit =
        normalizeLimit(options.limit);

    const notificationsRef =
        collection(db, COLLECTION);

    const notificationsQuery =
        query(
            notificationsRef,
            where(
                "userId",
                "==",
                normalizedUserId
            )
        );

    const snapshot =
        await getDocs(
            notificationsQuery
        );

    const notifications = [];

    snapshot.forEach((notificationDoc) => {

        const notification =
            normalizeNotification(
                notificationDoc
            );

        if (notification) {
            notifications.push(notification);
        }
    });

    sortByCreatedAtDescending(
        notifications
    );

    return notifications.slice(
        0,
        limit
    );
}


/* =========================================================
   GET UNREAD NOTIFICATIONS
   ========================================================= */

export async function getUnreadNotifications(
    userId,
    options = {}
) {

    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        throw new Error(
            "User ID is required to load unread notifications."
        );
    }

    const limit =
        normalizeLimit(options.limit);

    const notificationsRef =
        collection(db, COLLECTION);

    const notificationsQuery =
        query(
            notificationsRef,
            where(
                "userId",
                "==",
                normalizedUserId
            ),
            where(
                "isRead",
                "==",
                false
            )
        );

    const snapshot =
        await getDocs(
            notificationsQuery
        );

    const notifications = [];

    snapshot.forEach((notificationDoc) => {

        const notification =
            normalizeNotification(
                notificationDoc
            );

        if (notification) {
            notifications.push(notification);
        }
    });

    sortByCreatedAtDescending(
        notifications
    );

    return notifications.slice(
        0,
        limit
    );
}


/* =========================================================
   GET UNREAD COUNT
   ========================================================= */

export async function getUnreadNotificationCount(
    userId
) {

    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        throw new Error(
            "User ID is required to count unread notifications."
        );
    }

    const notificationsRef =
        collection(db, COLLECTION);

    const notificationsQuery =
        query(
            notificationsRef,
            where(
                "userId",
                "==",
                normalizedUserId
            ),
            where(
                "isRead",
                "==",
                false
            )
        );

    const snapshot =
        await getDocs(
            notificationsQuery
        );

    return Math.min(
        snapshot.size,
        NOTIFICATION_LIMITS.UNREAD_COUNT_LIMIT
    );
}


/* =========================================================
   MARK ONE NOTIFICATION AS READ
   ========================================================= */

export async function markNotificationAsRead(
    userId,
    notificationId
) {

    const normalizedUserId =
        normalizeString(userId);

    const normalizedNotificationId =
        normalizeString(notificationId);

    if (!normalizedUserId) {
        throw new Error(
            "User ID is required."
        );
    }

    if (!normalizedNotificationId) {
        throw new Error(
            "Notification ID is required."
        );
    }

    const notificationRef =
        doc(
            db,
            COLLECTION,
            normalizedNotificationId
        );

    const snapshot =
        await getDoc(notificationRef);

    if (!snapshot.exists()) {
        throw new Error(
            "Notification not found."
        );
    }

    const data =
        snapshot.data();

    if (
        String(data.userId || "") !==
        normalizedUserId
    ) {
        throw new Error(
            "You are not authorized to update this notification."
        );
    }

    if (data.isRead === true) {
        return {
            success: true,
            alreadyRead: true
        };
    }

    await updateDoc(
        notificationRef,
        {
            isRead: true,
            status: NOTIFICATION_STATUS.READ,
            readAt: serverTimestamp()
        }
    );

    return {
        success: true,
        alreadyRead: false
    };
}


/* =========================================================
   MARK ALL USER NOTIFICATIONS AS READ
   ========================================================= */

export async function markAllNotificationsAsRead(
    userId
) {

    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        throw new Error(
            "User ID is required."
        );
    }

    const notificationsRef =
        collection(db, COLLECTION);

    const notificationsQuery =
        query(
            notificationsRef,
            where(
                "userId",
                "==",
                normalizedUserId
            ),
            where(
                "isRead",
                "==",
                false
            )
        );

    const snapshot =
        await getDocs(
            notificationsQuery
        );

    if (snapshot.empty) {
        return {
            success: true,
            updatedCount: 0
        };
    }

    let updatedCount = 0;

    for (const notificationDoc of snapshot.docs) {

        await updateDoc(
            notificationDoc.ref,
            {
                isRead: true,
                status: NOTIFICATION_STATUS.READ,
                readAt: serverTimestamp()
            }
        );

        updatedCount++;
    }

    return {
        success: true,
        updatedCount
    };
}


/* =========================================================
   DELETE NOTIFICATION
   =========================================================

   Notifications are intentionally NOT deleted by the
   normal user notification service.

   This preserves the notification history and follows
   the Owner-controlled retention architecture.
   ========================================================= */

export async function deleteNotification() {

    throw new Error(
        "Notifications cannot be deleted through the user notification service."
    );
}


/* =========================================================
   SERVICE API
   ========================================================= */

export const notificationService = Object.freeze({

    createNotification,

    getNotification,

    getUserNotifications,

    getUnreadNotifications,

    getUnreadNotificationCount,

    markNotificationAsRead,

    markAllNotificationsAsRead,

    deleteNotification

});
