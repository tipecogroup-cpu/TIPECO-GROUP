/* =========================================================
   TIPECO GROUP
   TIPECO CHAT SERVICE
   REAL PROJECT
   VERSION 1.0
========================================================= */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";

import { db, auth } from "../firebase-config.js";

import {
    CHAT_COLLECTION,
    CHAT_MESSAGES_COLLECTION,
    CHAT_REPORTS_COLLECTION,
    CHAT_BLOCKS_COLLECTION,

    CHAT_CONVERSATION_TYPE,
    CHAT_CONVERSATION_STATUS,
    CHAT_MESSAGE_STATUS,
    CHAT_REQUEST_STATUS,
    CHAT_BLOCK_STATUS,
    CHAT_REPORT_STATUS,
    CHAT_REPORT_REASON,
    CHAT_MODERATION_ACTION,

    CHAT_MESSAGE_RULES,
    CHAT_PRIVACY_RULES,
    CHAT_RULES,
    CHAT_FIELD_LIMITS,

    isValidChatConversationType,
    isValidChatConversationStatus,
    isValidChatMessageStatus,
    isValidChatReportReason
} from "./chat-config.js";


/* =========================================================
   INTERNAL HELPERS
========================================================= */

function requireAuthenticatedUser() {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("Authentication required.");
    }

    return user;
}


function requireUserId(userId) {

    if (!userId || typeof userId !== "string") {
        throw new Error("Valid user ID is required.");
    }

    return userId.trim();
}


function requireConversationId(conversationId) {

    if (!conversationId || typeof conversationId !== "string") {
        throw new Error("Valid conversation ID is required.");
    }

    return conversationId.trim();
}


function requireMessageId(messageId) {

    if (!messageId || typeof messageId !== "string") {
        throw new Error("Valid message ID is required.");
    }

    return messageId.trim();
}


function requireText(text) {

    if (typeof text !== "string") {
        throw new Error("Message text is required.");
    }

    const value = text.trim();

    if (!value) {
        throw new Error("Message cannot be empty.");
    }

    if (value.length > CHAT_FIELD_LIMITS.maxMessageLength) {
        throw new Error(
            `Message cannot exceed ${CHAT_FIELD_LIMITS.maxMessageLength} characters.`
        );
    }

    return value;
}


function normalizeId(value) {

    return String(value || "").trim();
}


function ensureDifferentUsers(userId, otherUserId) {

    if (userId === otherUserId) {
        throw new Error("A user cannot start a chat with themselves.");
    }
}


function ensureConversationParticipant(conversation, userId) {

    if (!conversation) {
        throw new Error("Conversation not found.");
    }

    if (
        conversation.participantOneId !== userId &&
        conversation.participantTwoId !== userId
    ) {
        throw new Error("You are not authorized to access this conversation.");
    }
}


function getOtherParticipantId(conversation, userId) {

    ensureConversationParticipant(conversation, userId);

    return conversation.participantOneId === userId
        ? conversation.participantTwoId
        : conversation.participantOneId;
}


/* =========================================================
   BLOCK CHECK
========================================================= */

export async function isUserBlocked(userId, otherUserId) {

    userId = requireUserId(userId);
    otherUserId = requireUserId(otherUserId);

    ensureDifferentUsers(userId, otherUserId);

    const blockId = `${userId}_${otherUserId}`;

    const blockRef = doc(
        db,
        CHAT_BLOCKS_COLLECTION,
        blockId
    );

    const blockSnap = await getDoc(blockRef);

    if (!blockSnap.exists()) {
        return false;
    }

    const block = blockSnap.data();

    return block.status === CHAT_BLOCK_STATUS.ACTIVE;
}


/* =========================================================
   CREATE CONVERSATION
========================================================= */

export async function createConversation({
    otherUserId,
    conversationType,
    contextId,
    contextTitle = null
}) {

    const currentUser = requireAuthenticatedUser();

    const userId = currentUser.uid;

    otherUserId = requireUserId(otherUserId);

    ensureDifferentUsers(userId, otherUserId);

    if (!isValidChatConversationType(conversationType)) {
        throw new Error("Invalid chat conversation type.");
    }

    contextId = normalizeId(contextId);

    if (!contextId) {
        throw new Error("A listing or job context ID is required.");
    }

    if (
        conversationType === CHAT_CONVERSATION_TYPE.LISTING &&
        !CHAT_RULES.listingChatEnabled
    ) {
        throw new Error("Listing chat is currently disabled.");
    }

    if (
        conversationType === CHAT_CONVERSATION_TYPE.JOB &&
        !CHAT_RULES.jobChatEnabled
    ) {
        throw new Error("Job chat is currently disabled.");
    }

    if (
        await isUserBlocked(userId, otherUserId) ||
        await isUserBlocked(otherUserId, userId)
    ) {
        throw new Error("Chat is unavailable between these users.");
    }

    const participantIds = [userId, otherUserId].sort();

    const conversationKey = [
        conversationType,
        contextId,
        participantIds[0],
        participantIds[1]
    ].join("_");

    const conversationRef = doc(
        db,
        CHAT_COLLECTION,
        conversationKey
    );

    const existingConversation = await getDoc(conversationRef);

    if (existingConversation.exists()) {
        return {
            id: existingConversation.id,
            ...existingConversation.data()
        };
    }

    const conversationData = {

        participantOneId: participantIds[0],

        participantTwoId: participantIds[1],

        participantIds,

        conversationType,

        contextId,

        contextTitle,

        status: CHAT_CONVERSATION_STATUS.ACTIVE,

        requestStatus: CHAT_REQUEST_STATUS.PENDING,

        createdBy: userId,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

        lastMessageAt: null,

        lastMessageText: null,

        moderationStatus: null,

        moderatedBy: null,

        moderatedAt: null
    };

    await setDoc(
        conversationRef,
        conversationData
    );

    return {
        id: conversationRef.id,
        ...conversationData
    };
}


/* =========================================================
   GET CONVERSATION
========================================================= */

export async function getConversation(conversationId) {

    const currentUser = requireAuthenticatedUser();

    conversationId = requireConversationId(conversationId);

    const conversationRef = doc(
        db,
        CHAT_COLLECTION,
        conversationId
    );

    const conversationSnap = await getDoc(
        conversationRef
    );

    if (!conversationSnap.exists()) {
        return null;
    }

    const conversation = {
        id: conversationSnap.id,
        ...conversationSnap.data()
    };

    ensureConversationParticipant(
        conversation,
        currentUser.uid
    );

    return conversation;
}


/* =========================================================
   GET USER CONVERSATIONS
========================================================= */

export async function getUserConversations({
    maxResults = 50
} = {}) {

    const currentUser = requireAuthenticatedUser();

    const safeLimit = Math.min(
        Math.max(Number(maxResults) || 50, 1),
        100
    );

    const conversationsRef = collection(
        db,
        CHAT_COLLECTION
    );

    const q = query(
        conversationsRef,
        where(
            "participantIds",
            "array-contains",
            currentUser.uid
        ),
        orderBy(
            "updatedAt",
            "desc"
        ),
        limit(safeLimit)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
    }));
}


/* =========================================================
   SEND MESSAGE
========================================================= */

export async function sendMessage({
    conversationId,
    text
}) {

    const currentUser = requireAuthenticatedUser();

    conversationId = requireConversationId(conversationId);

    text = requireText(text);

    const conversationRef = doc(
        db,
        CHAT_COLLECTION,
        conversationId
    );

    const conversationSnap = await getDoc(
        conversationRef
    );

    if (!conversationSnap.exists()) {
        throw new Error("Conversation not found.");
    }

    const conversation = conversationSnap.data();

    ensureConversationParticipant(
        conversation,
        currentUser.uid
    );

    if (
        conversation.status !==
        CHAT_CONVERSATION_STATUS.ACTIVE
    ) {
        throw new Error("This conversation is not active.");
    }

    const otherUserId = getOtherParticipantId(
        conversation,
        currentUser.uid
    );

    if (
        await isUserBlocked(
            currentUser.uid,
            otherUserId
        ) ||
        await isUserBlocked(
            otherUserId,
            currentUser.uid
        )
    ) {
        throw new Error("Chat is unavailable between these users.");
    }

    const messagesRef = collection(
        db,
        CHAT_COLLECTION,
        conversationId,
        CHAT_MESSAGES_COLLECTION
    );

    const messageData = {

        senderId: currentUser.uid,

        receiverId: otherUserId,

        text,

        status: CHAT_MESSAGE_STATUS.ACTIVE,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

        editedAt: null,

        deletedForSelfBy: [],

        removedByOwner: false,

        removedAt: null,

        moderationAction: null
    };

    const messageRef = await addDoc(
        messagesRef,
        messageData
    );

    await updateDoc(
        conversationRef,
        {
            lastMessageAt: serverTimestamp(),

            lastMessageText: text,

            updatedAt: serverTimestamp()
        }
    );

    return {
        id: messageRef.id,
        ...messageData
    };
}


/* =========================================================
   GET MESSAGES
========================================================= */

export async function getMessages(
    conversationId,
    maxResults = 100
) {

    const currentUser = requireAuthenticatedUser();

    const conversation =
        await getConversation(conversationId);

    if (!conversation) {
        throw new Error("Conversation not found.");
    }

    const safeLimit = Math.min(
        Math.max(Number(maxResults) || 100, 1),
        200
    );

    const messagesRef = collection(
        db,
        CHAT_COLLECTION,
        conversationId,
        CHAT_MESSAGES_COLLECTION
    );

    const q = query(
        messagesRef,
        orderBy(
            "createdAt",
            "asc"
        ),
        limit(safeLimit)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
        .map((item) => ({
            id: item.id,
            ...item.data()
        }))
        .filter((message) => {

            if (
                message.deletedForSelfBy &&
                Array.isArray(message.deletedForSelfBy) &&
                message.deletedForSelfBy.includes(
                    currentUser.uid
                )
            ) {
                return false;
            }

            return true;
        });
}


/* =========================================================
   EDIT MESSAGE
========================================================= */

export async function editMessage({
    conversationId,
    messageId,
    text
}) {

    const currentUser = requireAuthenticatedUser();

    conversationId = requireConversationId(
        conversationId
    );

    messageId = requireMessageId(
        messageId
    );

    text = requireText(text);

    await getConversation(conversationId);

    const messageRef = doc(
        db,
        CHAT_COLLECTION,
        conversationId,
        CHAT_MESSAGES_COLLECTION,
        messageId
    );

    const messageSnap = await getDoc(
        messageRef
    );

    if (!messageSnap.exists()) {
        throw new Error("Message not found.");
    }

    const message = messageSnap.data();

    if (message.senderId !== currentUser.uid) {
        throw new Error(
            "You can only edit your own messages."
        );
    }

    if (
        message.status ===
        CHAT_MESSAGE_STATUS.REMOVED_BY_OWNER
    ) {
        throw new Error(
            "A moderated message cannot be edited."
        );
    }

    if (!message.createdAt) {
        throw new Error(
            "Message timestamp is unavailable."
        );
    }

    const createdTime =
        message.createdAt.toDate
            ? message.createdAt.toDate()
            : new Date(message.createdAt);

    const elapsedMinutes =
        (Date.now() - createdTime.getTime()) /
        (1000 * 60);

    if (
        elapsedMinutes >
        CHAT_MESSAGE_RULES.messageEditWindowMinutes
    ) {
        throw new Error(
            "The message edit window has expired."
        );
    }

    await updateDoc(
        messageRef,
        {
            text,

            status: CHAT_MESSAGE_STATUS.EDITED,

            editedAt: serverTimestamp(),

            updatedAt: serverTimestamp()
        }
    );

    return {
        id: messageId,
        text,
        status: CHAT_MESSAGE_STATUS.EDITED
    };
}


/* =========================================================
   DELETE MESSAGE FOR SELF
========================================================= */

export async function deleteMessageForSelf({
    conversationId,
    messageId
}) {

    const currentUser = requireAuthenticatedUser();

    conversationId = requireConversationId(
        conversationId
    );

    messageId = requireMessageId(
        messageId
    );

    await getConversation(conversationId);

    const messageRef = doc(
        db,
        CHAT_COLLECTION,
        conversationId,
        CHAT_MESSAGES_COLLECTION,
        messageId
    );

    const messageSnap = await getDoc(
        messageRef
    );

    if (!messageSnap.exists()) {
        throw new Error("Message not found.");
    }

    const message = messageSnap.data();

    if (message.senderId !== currentUser.uid) {
        throw new Error(
            "You can only delete your own messages for yourself."
        );
    }

    const existingDeletedBy =
        Array.isArray(message.deletedForSelfBy)
            ? message.deletedForSelfBy
            : [];

    const updatedDeletedBy =
        existingDeletedBy.includes(currentUser.uid)
            ? existingDeletedBy
            : [
                ...existingDeletedBy,
                currentUser.uid
            ];

    await updateDoc(
        messageRef,
        {
            deletedForSelfBy: updatedDeletedBy,

            status:
                CHAT_MESSAGE_STATUS.DELETED_FOR_SELF,

            updatedAt: serverTimestamp()
        }
    );

    return true;
}


/* =========================================================
   BLOCK USER
========================================================= */

export async function blockUser(otherUserId) {

    const currentUser = requireAuthenticatedUser();

    const userId = currentUser.uid;

    otherUserId = requireUserId(otherUserId);

    ensureDifferentUsers(
        userId,
        otherUserId
    );

    if (!CHAT_RULES.blockingEnabled) {
        throw new Error("Blocking is disabled.");
    }

    const blockId = `${userId}_${otherUserId}`;

    const blockRef = doc(
        db,
        CHAT_BLOCKS_COLLECTION,
        blockId
    );

    await setDoc(
        blockRef,
        {
            blockerId: userId,

            blockedUserId: otherUserId,

            status: CHAT_BLOCK_STATUS.ACTIVE,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp()
        },
        {
            merge: true
        }
    );

    return true;
}


/* =========================================================
   UNBLOCK USER
========================================================= */

export async function unblockUser(otherUserId) {

    const currentUser = requireAuthenticatedUser();

    const userId = currentUser.uid;

    otherUserId = requireUserId(otherUserId);

    ensureDifferentUsers(
        userId,
        otherUserId
    );

    const blockId = `${userId}_${otherUserId}`;

    const blockRef = doc(
        db,
        CHAT_BLOCKS_COLLECTION,
        blockId
    );

    const blockSnap = await getDoc(blockRef);

    if (!blockSnap.exists()) {
        return true;
    }

    const block = blockSnap.data();

    if (block.blockerId !== userId) {
        throw new Error(
            "You can only remove your own block."
        );
    }

    await updateDoc(
        blockRef,
        {
            status: CHAT_BLOCK_STATUS.REMOVED,

            updatedAt: serverTimestamp()
        }
    );

    return true;
}


/* =========================================================
   REPORT CONVERSATION
========================================================= */

export async function reportConversation({
    conversationId,
    reason,
    description = ""
}) {

    const currentUser = requireAuthenticatedUser();

    conversationId = requireConversationId(
        conversationId
    );

    if (!isValidChatReportReason(reason)) {
        throw new Error(
            "Invalid report reason."
        );
    }

    if (
        description &&
        description.length >
        CHAT_FIELD_LIMITS.maxReportLength
    ) {
        throw new Error(
            `Report description cannot exceed ${CHAT_FIELD_LIMITS.maxReportLength} characters.`
        );
    }

    const conversation =
        await getConversation(conversationId);

    if (!conversation) {
        throw new Error(
            "Conversation not found."
        );
    }

    const reportsRef = collection(
        db,
        CHAT_REPORTS_COLLECTION
    );

    const reportData = {

        conversationId,

        reporterId: currentUser.uid,

        reportedUserId:
            getOtherParticipantId(
                conversation,
                currentUser.uid
            ),

        reason,

        description: description.trim(),

        status:
            CHAT_REPORT_STATUS.PENDING,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

        reviewedBy: null,

        reviewedAt: null,

        moderationAction: null,

        resolutionNote: null
    };

    const reportRef = await addDoc(
        reportsRef,
        reportData
    );

    return {
        id: reportRef.id,
        ...reportData
    };
}


/* =========================================================
   OWNER MODERATION
========================================================= */

export async function moderateConversation({
    conversationId,
    ownerId,
    action,
    resolutionNote = ""
}) {

    conversationId = requireConversationId(
        conversationId
    );

    ownerId = requireUserId(ownerId);

    if (!action) {
        throw new Error(
            "Moderation action is required."
        );
    }

    const conversationRef = doc(
        db,
        CHAT_COLLECTION,
        conversationId
    );

    const conversationSnap = await getDoc(
        conversationRef
    );

    if (!conversationSnap.exists()) {
        throw new Error(
            "Conversation not found."
        );
    }

    const conversation =
        conversationSnap.data();

    if (
        action ===
        CHAT_MODERATION_ACTION.CLOSE_CONVERSATION
    ) {

        await updateDoc(
            conversationRef,
            {
                status:
                    CHAT_CONVERSATION_STATUS.CLOSED,

                moderationStatus:
                    CHAT_MODERATION_ACTION.CLOSE_CONVERSATION,

                moderatedBy: ownerId,

                moderatedAt: serverTimestamp(),

                moderationNote:
                    resolutionNote.trim(),

                updatedAt: serverTimestamp()
            }
        );

        return true;
    }

    if (
        action ===
        CHAT_MODERATION_ACTION.BLOCK_USER
    ) {

        const participantIds =
            Array.isArray(conversation.participantIds)
                ? conversation.participantIds
                : [];

        if (participantIds.length !== 2) {
            throw new Error(
                "Invalid conversation participants."
            );
        }

        const blockOperations =
            participantIds.map(
                async (blockedUserId) => {

                    const otherUserId =
                        participantIds.find(
                            (id) =>
                                id !== blockedUserId
                        );

                    const blockId =
                        `${blockedUserId}_${otherUserId}`;

                    const blockRef =
                        doc(
                            db,
                            CHAT_BLOCKS_COLLECTION,
                            blockId
                        );

                    return setDoc(
                        blockRef,
                        {
                            blockerId:
                                blockedUserId,

                            blockedUserId:
                                otherUserId,

                            status:
                                CHAT_BLOCK_STATUS.ACTIVE,

                            createdAt:
                                serverTimestamp(),

                            updatedAt:
                                serverTimestamp(),

                            ownerModerated: true,

                            moderatedBy:
                                ownerId
                        },
                        {
                            merge: true
                        }
                    );
                }
            );

        await Promise.all(
            blockOperations
        );

        await updateDoc(
            conversationRef,
            {
                status:
                    CHAT_CONVERSATION_STATUS.BLOCKED,

                moderationStatus:
                    CHAT_MODERATION_ACTION.BLOCK_USER,

                moderatedBy: ownerId,

                moderatedAt:
                    serverTimestamp(),

                moderationNote:
                    resolutionNote.trim(),

                updatedAt:
                    serverTimestamp()
            }
        );

        return true;
    }

    throw new Error(
        "Unsupported moderation action."
    );
}


/* =========================================================
   OWNER REMOVE MESSAGE
========================================================= */

export async function removeMessageByOwner({
    conversationId,
    messageId,
    ownerId,
    reason = ""
}) {

    conversationId = requireConversationId(
        conversationId
    );

    messageId = requireMessageId(
        messageId
    );

    ownerId = requireUserId(ownerId);

    const messageRef = doc(
        db,
        CHAT_COLLECTION,
        conversationId,
        CHAT_MESSAGES_COLLECTION,
        messageId
    );

    const messageSnap = await getDoc(
        messageRef
    );

    if (!messageSnap.exists()) {
        throw new Error(
            "Message not found."
        );
    }

    await updateDoc(
        messageRef,
        {
            status:
                CHAT_MESSAGE_STATUS.REMOVED_BY_OWNER,

            removedByOwner: true,

            removedAt:
                serverTimestamp(),

            moderationAction:
                CHAT_MODERATION_ACTION.REMOVE_MESSAGE,

            moderatedBy: ownerId,

            moderationReason:
                reason.trim(),

            updatedAt:
                serverTimestamp()
        }
    );

    return true;
}


/* =========================================================
   END OF TIPECO CHAT SERVICE
========================================================= */
