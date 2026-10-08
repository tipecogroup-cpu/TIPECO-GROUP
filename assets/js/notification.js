/* =========================================================
   TIPECO GROUP
   NOTIFICATION UI ENGINE v1.0
   Firebase Firestore Backend
   ---------------------------------------------------------
   Responsibilities:
   - Notification bell UI
   - Unread badge
   - Notification dropdown/panel
   - Load user notifications
   - Mark notification as read
   - Mark all as read
   - Open notification links
   - Auto refresh
   - Firebase Auth integration
   ========================================================= */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    notificationService
} from "./notification-service.js";

import {
    NOTIFICATION_BELL_CONFIG,
    NOTIFICATION_LIMITS
} from "./notification-config.js";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let notifications = [];
let notificationRefreshTimer = null;
let initialized = false;


/* =========================================================
   DOM HELPERS
   ---------------------------------------------------------
   The engine supports several common notification element
   IDs/classes so existing pages do not need to be rewritten.
   ========================================================= */

function findFirst(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);

        if (element) {
            return element;
        }
    }

    return null;
}


function getBell() {
    return findFirst([
        "#notificationBell",
        "#notificationsBell",
        "[data-notification-bell]",
        ".notification-bell"
    ]);
}


function getBadge() {
    return findFirst([
        "#notificationBadge",
        "#notificationsBadge",
        "[data-notification-badge]",
        ".notification-badge"
    ]);
}


function getPanel() {
    return findFirst([
        "#notificationPanel",
        "#notificationsPanel",
        "[data-notification-panel]",
        ".notification-panel"
    ]);
}


function getList() {
    return findFirst([
        "#notificationList",
        "#notificationsList",
        "[data-notification-list]",
        ".notification-list"
    ]);
}


function getEmptyState() {
    return findFirst([
        "#notificationEmpty",
        "#notificationsEmpty",
        "[data-notification-empty]",
        ".notification-empty"
    ]);
}


function getMarkAllButton() {
    return findFirst([
        "#markAllNotificationsRead",
        "#markAllRead",
        "[data-mark-all-notifications-read]"
    ]);
}


/* =========================================================
   SECURITY / AUTH
   ========================================================= */

function getCurrentUser() {
    return currentUser || auth.currentUser || null;
}


function requireUser() {
    const user = getCurrentUser();

    if (!user || !user.uid) {
        return null;
    }

    return user;
}


/* =========================================================
   SAFE TEXT
   ========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatNotificationDate(value) {
    if (!value) {
        return "";
    }

    let date = null;

    if (typeof value?.toDate === "function") {
        date = value.toDate();
    } else if (value instanceof Date) {
        date = value;
    } else if (typeof value === "number") {
        date = new Date(value);
    } else {
        date = new Date(value);
    }

    if (!date || Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}


/* =========================================================
   NOTIFICATION TYPE ICON
   ========================================================= */

function getNotificationIcon(type) {
    const icons = {
        subscription: "💳",
        payment: "💰",
        listing_submitted: "📤",
        listing_review: "🔎",
        listing_approved: "✅",
        listing_rejected: "❌",
        listing_needs_changes: "✏️",
        chat_message: "💬",
        job_application: "💼",
        account: "👤",
        security: "🔐",
        system: "ℹ️",
        owner: "🛡️"
    };

    return icons[type] || "🔔";
}


/* =========================================================
   BADGE
   ========================================================= */

function updateUnreadBadge(count) {
    const badge = getBadge();

    if (!badge) {
        return;
    }

    const safeCount = Math.max(
        0,
        Number.isFinite(Number(count)) ? Number(count) : 0
    );

    if (
        NOTIFICATION_BELL_CONFIG.SHOW_UNREAD_COUNT &&
        safeCount > 0
    ) {
        const displayCount =
            safeCount > NOTIFICATION_BELL_CONFIG.MAX_UNREAD_BADGE
                ? `${NOTIFICATION_BELL_CONFIG.MAX_UNREAD_BADGE}+`
                : String(safeCount);

        badge.textContent = displayCount;
        badge.hidden = false;
        badge.setAttribute("aria-label", `${safeCount} unread notifications`);
    } else {
        badge.textContent = "";
        badge.hidden = true;
        badge.removeAttribute("aria-label");
    }
}


/* =========================================================
   PANEL STATE
   ========================================================= */

function openNotificationPanel() {
    const panel = getPanel();

    if (!panel) {
        return;
    }

    panel.hidden = false;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
}


function closeNotificationPanel() {
    const panel = getPanel();

    if (!panel) {
        return;
    }

    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    panel.hidden = true;
}


function toggleNotificationPanel() {
    const panel = getPanel();

    if (!panel) {
        return;
    }

    const isOpen =
        panel.classList.contains("open") ||
        panel.hidden === false;

    if (isOpen) {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
        loadNotifications();
    }
}


/* =========================================================
   EMPTY / LOADING / ERROR STATES
   ========================================================= */

function showEmptyState(show) {
    const emptyState = getEmptyState();

    if (!emptyState) {
        return;
    }

    emptyState.hidden = !show;
}


function showLoadingState() {
    const list = getList();

    if (!list) {
        return;
    }

    list.innerHTML = `
        <div class="notification-loading"
             role="status"
             aria-live="polite">
            Loading notifications...
        </div>
    `;

    showEmptyState(false);
}


function showErrorState() {
    const list = getList();

    if (!list) {
        return;
    }

    list.innerHTML = `
        <div class="notification-error"
             role="alert">
            Unable to load notifications.
        </div>
    `;

    showEmptyState(false);
}


/* =========================================================
   RENDER NOTIFICATIONS
   ========================================================= */

function renderNotifications(items) {
    const list = getList();

    if (!list) {
        return;
    }

    if (!Array.isArray(items) || items.length === 0) {
        list.innerHTML = "";
        showEmptyState(
            NOTIFICATION_BELL_CONFIG.SHOW_EMPTY_STATE
        );
        return;
    }

    showEmptyState(false);

    list.innerHTML = items.map(notification => {
        const id = escapeHtml(notification.id);
        const type = escapeHtml(notification.type);
        const title = escapeHtml(notification.title);
        const message = escapeHtml(notification.message);
        const priority = escapeHtml(notification.priority);
        const date = escapeHtml(
            formatNotificationDate(notification.createdAt)
        );

        const isUnread =
            notification.isRead !== true &&
            notification.status !== "read";

        return `
            <article
                class="notification-item ${isUnread ? "unread" : "read"}"
                data-notification-id="${id}"
                data-notification-type="${type}"
                data-notification-priority="${priority}"
                role="button"
                tabindex="0"
                aria-label="${title}"
            >
                <div class="notification-icon"
                     aria-hidden="true">
                    ${getNotificationIcon(notification.type)}
                </div>

                <div class="notification-content">
                    <div class="notification-title-row">
                        <strong class="notification-title">
                            ${title}
                        </strong>

                        ${
                            isUnread
                                ? `
                                    <span
                                        class="notification-unread-dot"
                                        aria-label="Unread">
                                    </span>
                                  `
                                : ""
                        }
                    </div>

                    <div class="notification-message">
                        ${message}
                    </div>

                    ${
                        date
                            ? `
                                <time
                                    class="notification-date"
                                    datetime="${date}">
                                    ${date}
                                </time>
                              `
                            : ""
                    }
                </div>
            </article>
        `;
    }).join("");
}


/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */

async function loadNotifications() {
    const user = requireUser();

    if (!user) {
        notifications = [];
        updateUnreadBadge(0);
        renderNotifications([]);
        return;
    }

    showLoadingState();

    try {
        notifications =
            await notificationService.getUserNotifications(
                user.uid,
                {
                    limit: NOTIFICATION_LIMITS.DEFAULT_PAGE_SIZE
                }
            );

        renderNotifications(notifications);

        await refreshUnreadCount();
    } catch (error) {
        console.error(
            "TIPECO Notification Load Error:",
            error
        );

        notifications = [];
        updateUnreadBadge(0);
        showErrorState();
    }
}


/* =========================================================
   UNREAD COUNT
   ========================================================= */

async function refreshUnreadCount() {
    const user = requireUser();

    if (!user) {
        updateUnreadBadge(0);
        return;
    }

    try {
        const count =
            await notificationService.getUnreadNotificationCount(
                user.uid
            );

        updateUnreadBadge(count);
    } catch (error) {
        console.error(
            "TIPECO Notification Count Error:",
            error
        );

        updateUnreadBadge(0);
    }
}


/* =========================================================
   OPEN NOTIFICATION
   ========================================================= */

async function openNotification(notificationId) {
    const user = requireUser();

    if (!user || !notificationId) {
        return;
    }

    const notification =
        notifications.find(
            item => item.id === notificationId
        );

    if (!notification) {
        return;
    }

    try {
        if (
            notification.isRead !== true &&
            notification.status !== "read"
        ) {
            await notificationService.markNotificationAsRead(
                user.uid,
                notificationId
            );

            notification.isRead = true;
            notification.status = "read";

            renderNotifications(notifications);
            await refreshUnreadCount();
        }

        const link =
            typeof notification.link === "string"
                ? notification.link.trim()
                : "";

        if (link) {
            window.location.href = link;
        }
    } catch (error) {
        console.error(
            "TIPECO Notification Open Error:",
            error
        );
    }
}


/* =========================================================
   MARK ALL AS READ
   ========================================================= */

async function markAllNotificationsAsRead() {
    const user = requireUser();

    if (!user) {
        return;
    }

    const button = getMarkAllButton();

    if (button) {
        button.disabled = true;
    }

    try {
        await notificationService.markAllNotificationsAsRead(
            user.uid
        );

        notifications = notifications.map(notification => ({
            ...notification,
            isRead: true,
            status: "read"
        }));

        renderNotifications(notifications);
        updateUnreadBadge(0);
    } catch (error) {
        console.error(
            "TIPECO Mark All Notifications Error:",
            error
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================================
   EVENT HANDLERS
   ========================================================= */

function handleNotificationListClick(event) {
    const item =
        event.target.closest(
            "[data-notification-id]"
        );

    if (!item) {
        return;
    }

    const notificationId =
        item.getAttribute("data-notification-id");

    openNotification(notificationId);
}


function handleNotificationListKeydown(event) {
    if (
        event.key !== "Enter" &&
        event.key !== " "
    ) {
        return;
    }

    const item =
        event.target.closest(
            "[data-notification-id]"
        );

    if (!item) {
        return;
    }

    event.preventDefault();

    const notificationId =
        item.getAttribute("data-notification-id");

    openNotification(notificationId);
}


function handleDocumentClick(event) {
    const bell = getBell();
    const panel = getPanel();

    if (!bell || !panel) {
        return;
    }

    if (
        panel.classList.contains("open") &&
        !panel.contains(event.target) &&
        !bell.contains(event.target)
    ) {
        closeNotificationPanel();
    }
}


/* =========================================================
   EVENT BINDING
   ========================================================= */

function bindEvents() {
    const bell = getBell();
    const list = getList();
    const markAllButton = getMarkAllButton();

    if (bell && !bell.dataset.notificationBound) {
        bell.addEventListener(
            "click",
            toggleNotificationPanel
        );

        bell.setAttribute(
            "aria-haspopup",
            "true"
        );

        bell.dataset.notificationBound = "true";
    }

    if (list && !list.dataset.notificationBound) {
        list.addEventListener(
            "click",
            handleNotificationListClick
        );

        list.addEventListener(
            "keydown",
            handleNotificationListKeydown
        );

        list.dataset.notificationBound = "true";
    }

    if (
        markAllButton &&
        !markAllButton.dataset.notificationBound
    ) {
        markAllButton.addEventListener(
            "click",
            markAllNotificationsAsRead
        );

        markAllButton.dataset.notificationBound =
            "true";
    }

    if (!document.body.dataset.notificationOutsideClickBound) {
        document.addEventListener(
            "click",
            handleDocumentClick
        );

        document.body.dataset.notificationOutsideClickBound =
            "true";
    }
}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

function startAutoRefresh() {
    if (
        !NOTIFICATION_BELL_CONFIG.AUTO_REFRESH ||
        notificationRefreshTimer
    ) {
        return;
    }

    /*
     * Notification config does not define a custom interval.
     * Five minutes keeps the bell reasonably fresh without
     * creating continuous Firestore reads.
     */
    notificationRefreshTimer =
        window.setInterval(
            refreshUnreadCount,
            5 * 60 * 1000
        );
}


function stopAutoRefresh() {
    if (!notificationRefreshTimer) {
        return;
    }

    window.clearInterval(
        notificationRefreshTimer
    );

    notificationRefreshTimer = null;
}


/* =========================================================
   AUTH STATE
   ========================================================= */

function initializeAuthListener() {
    onAuthStateChanged(
        auth,
        async user => {
            currentUser = user || null;

            if (!user) {
                notifications = [];
                updateUnreadBadge(0);
                renderNotifications([]);
                closeNotificationPanel();
                stopAutoRefresh();
                return;
            }

            await refreshUnreadCount();
            startAutoRefresh();
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeNotificationUI() {
    if (initialized) {
        return;
    }

    initialized = true;

    bindEvents();
    initializeAuthListener();
}


/* =========================================================
   PUBLIC API
   ========================================================= */

export const notificationUI = Object.freeze({
    initialize: initializeNotificationUI,
    load: loadNotifications,
    refreshUnreadCount,
    open: openNotification,
    markAllAsRead: markAllNotificationsAsRead,
    openPanel: openNotificationPanel,
    closePanel: closeNotificationPanel,
    togglePanel: toggleNotificationPanel
});


/* =========================================================
   AUTO INITIALIZE
   ========================================================= */

if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNotificationUI,
        { once: true }
    );
} else {
    initializeNotificationUI();
}
