/* =====================================================
   TIPECO GROUP - AUTHENTICATION SYSTEM
   Version: 3.0

   Works with:
   - storage.js v1.0
   - IndexedDB Media Storage
   - Login
   - Signup
   - Logout
   - Session
   - User isolation
   - Add Listing protection
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const TIPECO_AUTH_VERSION = "3.0";

const TIPECO_USERS_KEY =
    "TIPECO_GROUP_USERS";

const TIPECO_SESSION_KEY =
    "TIPECO_GROUP_SESSION";

const TIPECO_USER_PREFIX =
    "TIPECO_USER_";


/* =====================================================
   UTILITY - GENERATE USER ID
===================================================== */

function generateTipecoUserId() {

    return (
        "user_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


/* =====================================================
   UTILITY - GET USERS
===================================================== */

function getTipecoUsers() {

    try {

        const users =
            localStorage.getItem(
                TIPECO_USERS_KEY
            );

        if (!users) {

            return [];

        }

        const parsed =
            JSON.parse(users);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "TIPECO: Unable to read users.",
            error
        );

        return [];

    }

}


/* =====================================================
   UTILITY - SAVE USERS
===================================================== */

function saveTipecoUsers(users) {

    localStorage.setItem(
        TIPECO_USERS_KEY,
        JSON.stringify(users)
    );

}


/* =====================================================
   UTILITY - NORMALIZE EMAIL
===================================================== */

function normalizeTipecoEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();

}


/* =====================================================
   UTILITY - NORMALIZE PHONE
===================================================== */

function normalizeTipecoPhone(phone) {

    return String(phone || "")
        .trim()
        .replace(/\s+/g, "");

}


/* =====================================================
   CREATE SESSION
===================================================== */

function createTipecoSession(user) {

    const session = {

        userId: user.id,

        email: user.email || null,

        phone: user.phone || null,

        name: user.name || "",

        role: user.role || "user",

        loginAt:
            new Date().toISOString(),

        authVersion:
            TIPECO_AUTH_VERSION

    };


    localStorage.setItem(
        TIPECO_SESSION_KEY,
        JSON.stringify(session)
    );


    return session;

}


/* =====================================================
   GET CURRENT SESSION
===================================================== */

function getTipecoSession() {

    try {

        const session =
            localStorage.getItem(
                TIPECO_SESSION_KEY
            );

        if (!session) {

            return null;

        }

        return JSON.parse(session);

    } catch (error) {

        console.error(
            "TIPECO: Invalid session.",
            error
        );

        return null;

    }

}


/* =====================================================
   GET CURRENT USER
===================================================== */

function getCurrentTipecoUser() {

    const session =
        getTipecoSession();


    if (!session || !session.userId) {

        return null;

    }


    const users =
        getTipecoUsers();


    const user =
        users.find(function (item) {

            return item.id === session.userId;

        });


    if (!user) {

        return null;

    }


    return user;

}


/* =====================================================
   CHECK LOGIN
===================================================== */

function isTipecoLoggedIn() {

    return (
        getCurrentTipecoUser() !== null
    );

}


/* =====================================================
   SIGN UP
===================================================== */

function tipecoSignup(userData) {

    try {

        userData =
            userData || {};


        const name =
            String(
                userData.name || ""
            ).trim();


        const email =
            normalizeTipecoEmail(
                userData.email
            );


        const phone =
            normalizeTipecoPhone(
                userData.phone
            );


        const password =
            String(
                userData.password || ""
            );


        /* =============================================
           VALIDATION
        ============================================== */

        if (!name) {

            return {

                success: false,

                message:
                    "Please enter your name."

            };

        }


        if (!email && !phone) {

            return {

                success: false,

                message:
                    "Email or phone number is required."

            };

        }


        if (password.length < 6) {

            return {

                success: false,

                message:
                    "Password must contain at least 6 characters."

            };

        }


        const users =
            getTipecoUsers();


        /* =============================================
           CHECK DUPLICATE EMAIL
        ============================================== */

        if (email) {

            const emailExists =
                users.some(function (user) {

                    return (
                        user.email &&
                        normalizeTipecoEmail(
                            user.email
                        ) === email
                    );

                });


            if (emailExists) {

                return {

                    success: false,

                    message:
                        "An account with this email already exists."

                };

            }

        }


        /* =============================================
           CHECK DUPLICATE PHONE
        ============================================== */

        if (phone) {

            const phoneExists =
                users.some(function (user) {

                    return (
                        user.phone &&
                        normalizeTipecoPhone(
                            user.phone
                        ) === phone
                    );

                });


            if (phoneExists) {

                return {

                    success: false,

                    message:
                        "An account with this phone number already exists."

                };

            }

        }


        /* =============================================
           CREATE USER
        ============================================== */

        const user = {

            id:
                generateTipecoUserId(),

            name:
                name,

            email:
                email || null,

            phone:
                phone || null,

            password:
                password,

            role:
                "user",

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString(),

            status:
                "active"

        };


        users.push(user);


        saveTipecoUsers(users);


        /* =============================================
           CREATE USER STORAGE NAMESPACE
        ============================================== */

        localStorage.setItem(

            TIPECO_USER_PREFIX +
            user.id,

            JSON.stringify({

                userId: user.id,

                listings: [],

                favorites: [],

                settings: {},

                createdAt:
                    new Date().toISOString()

            })

        );


        /* =============================================
           AUTO LOGIN
        ============================================== */

        const session =
            createTipecoSession(user);


        return {

            success: true,

            message:
                "Account created successfully.",

            user: user,

            session: session

        };

    } catch (error) {

        console.error(
            "TIPECO Signup Error:",
            error
        );


        return {

            success: false,

            message:
                "Something went wrong while creating your account."

        };

    }

}


/* =====================================================
   LOGIN
===================================================== */

function tipecoLogin(loginData) {

    try {

        loginData =
            loginData || {};


        const identifier =
            String(
                loginData.identifier ||
                loginData.email ||
                loginData.phone ||
                ""
            )
            .trim();


        const password =
            String(
                loginData.password || ""
            );


        if (!identifier) {

            return {

                success: false,

                message:
                    "Enter your email or phone number."

            };

        }


        if (!password) {

            return {

                success: false,

                message:
                    "Enter your password."

            };

        }


        const users =
            getTipecoUsers();


        const normalizedEmail =
            normalizeTipecoEmail(
                identifier
            );


        const normalizedPhone =
            normalizeTipecoPhone(
                identifier
            );


        const user =
            users.find(function (item) {

                const emailMatch =
                    item.email &&
                    normalizeTipecoEmail(
                        item.email
                    ) === normalizedEmail;


                const phoneMatch =
                    item.phone &&
                    normalizeTipecoPhone(
                        item.phone
                    ) === normalizedPhone;


                return (
                    emailMatch ||
                    phoneMatch
                );

            });


        if (!user) {

            return {

                success: false,

                message:
                    "Account not found."

            };

        }


        if (
            user.status &&
            user.status !== "active"
        ) {

            return {

                success: false,

                message:
                    "This account is not active."

            };

        }


        if (user.password !== password) {

            return {

                success: false,

                message:
                    "Incorrect password."

            };

        }


        /* =============================================
           CREATE SESSION
        ============================================== */

        const session =
            createTipecoSession(user);


        return {

            success: true,

            message:
                "Login successful.",

            user: user,

            session: session

        };

    } catch (error) {

        console.error(
            "TIPECO Login Error:",
            error
        );


        return {

            success: false,

            message:
                "Something went wrong while logging in."

        };

    }

}


/* =====================================================
   LOGOUT
===================================================== */

function tipecoLogout() {

    localStorage.removeItem(
        TIPECO_SESSION_KEY
    );


    return {

        success: true,

        message:
            "You have been logged out."

    };

}


/* =====================================================
   REQUIRE AUTHENTICATION
===================================================== */

function requireTipecoAuth() {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        return {

            authenticated: false,

            user: null,

            message:
                "Please login to continue."

        };

    }


    return {

        authenticated: true,

        user: user,

        message:
            "Authenticated."

    };

}


/* =====================================================
   GET USER-SPECIFIC STORAGE
===================================================== */

function getTipecoUserStorage() {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        return null;

    }


    const key =
        TIPECO_USER_PREFIX +
        user.id;


    try {

        const data =
            localStorage.getItem(key);


        if (!data) {

            return {

                userId: user.id,

                listings: [],

                favorites: [],

                settings: {}

            };

        }


        return JSON.parse(data);

    } catch (error) {

        console.error(
            "TIPECO User Storage Error:",
            error
        );

        return null;

    }

}


/* =====================================================
   SAVE USER-SPECIFIC STORAGE
===================================================== */

function saveTipecoUserStorage(data) {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        return false;

    }


    const key =
        TIPECO_USER_PREFIX +
        user.id;


    data.userId =
        user.id;


    localStorage.setItem(

        key,

        JSON.stringify(data)

    );


    return true;

}


/* =====================================================
   SAVE USER LISTING REFERENCE
===================================================== */

function saveTipecoListingReference(listing) {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        return {

            success: false,

            message:
                "Please login before creating a listing."

        };

    }


    const storage =
        getTipecoUserStorage();


    if (!storage) {

        return {

            success: false,

            message:
                "User storage is unavailable."

        };

    }


    if (!Array.isArray(storage.listings)) {

        storage.listings = [];

    }


    storage.listings.push({

        listingId:
            listing.listingId ||
            listing.id,

        title:
            listing.title || "",

        createdAt:
            listing.createdAt ||
            new Date().toISOString(),

        mediaIds:
            Array.isArray(
                listing.mediaIds
            )
                ? listing.mediaIds
                : []

    });


    saveTipecoUserStorage(
        storage
    );


    return {

        success: true,

        userId: user.id,

        message:
            "Listing reference saved."

    };

}


/* =====================================================
   GET USER LISTINGS
===================================================== */

function getTipecoUserListings() {

    const storage =
        getTipecoUserStorage();


    if (!storage) {

        return [];

    }


    return Array.isArray(
        storage.listings
    )
        ? storage.listings
        : [];

}


/* =====================================================
   SAVE MEDIA FOR CURRENT USER
   Works with storage.js v1.0
===================================================== */

async function saveTipecoUserMedia(
    mediaObject
) {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        throw new Error(
            "User must be logged in."
        );

    }


    if (!mediaObject) {

        throw new Error(
            "Media object is required."
        );

    }


    mediaObject.ownerId =
        user.id;


    mediaObject.createdAt =
        mediaObject.createdAt ||
        new Date().toISOString();


    return await saveTipecoMedia(
        mediaObject
    );

}


/* =====================================================
   GET MEDIA FOR CURRENT USER
===================================================== */

async function getTipecoUserMedia(
    mediaId
) {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        return null;

    }


    const media =
        await getTipecoMedia(
            mediaId
        );


    if (!media) {

        return null;

    }


    /* =============================================
       USER ISOLATION
    ============================================== */

    if (
        media.ownerId &&
        media.ownerId !== user.id
    ) {

        console.warn(
            "TIPECO: Unauthorized media access."
        );

        return null;

    }


    return media;

}


/* =====================================================
   DELETE MEDIA FOR CURRENT USER
===================================================== */

async function deleteTipecoUserMedia(
    mediaId
) {

    const user =
        getCurrentTipecoUser();


    if (!user) {

        return false;

    }


    const media =
        await getTipecoMedia(
            mediaId
        );


    if (!media) {

        return false;

    }


    if (
        media.ownerId &&
        media.ownerId !== user.id
    ) {

        console.warn(
            "TIPECO: Unauthorized media deletion."
        );

        return false;

    }


    await deleteTipecoMedia(
        mediaId
    );


    return true;

}


/* =====================================================
   FORGOT PASSWORD
   NOTE:
   This version prepares the flow locally.
   Real email/SMS reset will come later.
===================================================== */

function tipecoForgotPassword(identifier) {

    const value =
        String(
            identifier || ""
        ).trim();


    if (!value) {

        return {

            success: false,

            message:
                "Enter your email or phone number."

        };

    }


    const users =
        getTipecoUsers();


    const email =
        normalizeTipecoEmail(
            value
        );


    const phone =
        normalizeTipecoPhone(
            value
        );


    const user =
        users.find(function (item) {

            return (

                (
                    item.email &&
                    normalizeTipecoEmail(
                        item.email
                    ) === email
                )

                ||

                (
                    item.phone &&
                    normalizeTipecoPhone(
                        item.phone
                    ) === phone
                )

            );

        });


    if (!user) {

        return {

            success: false,

            message:
                "No account was found."

        };

    }


    return {

        success: true,

        userId:
            user.id,

        message:
            "Account found. Password reset verification can now continue."

    };

}


/* =====================================================
   UPDATE USER
===================================================== */

function updateTipecoUser(updates) {

    const currentUser =
        getCurrentTipecoUser();


    if (!currentUser) {

        return {

            success: false,

            message:
                "Please login first."

        };

    }


    const users =
        getTipecoUsers();


    const index =
        users.findIndex(function (user) {

            return (
                user.id ===
                currentUser.id
            );

        });


    if (index === -1) {

        return {

            success: false,

            message:
                "User account not found."

        };

    }


    const allowedFields = [

        "name",

        "email",

        "phone"

    ];


    allowedFields.forEach(
        function (field) {

            if (
                updates &&
                Object.prototype.hasOwnProperty.call(
                    updates,
                    field
                )
            ) {

                if (field === "email") {

                    users[index][field] =
                        normalizeTipecoEmail(
                            updates[field]
                        );

                }

                else if (
                    field === "phone"
                ) {

                    users[index][field] =
                        normalizeTipecoPhone(
                            updates[field]
                        );

                }

                else {

                    users[index][field] =
                        String(
                            updates[field]
                        ).trim();

                }

            }

        }
    );


    users[index].updatedAt =
        new Date().toISOString();


    saveTipecoUsers(
        users
    );


    createTipecoSession(
        users[index]
    );


    return {

        success: true,

        user:
            users[index],

        message:
            "Profile updated successfully."

    };

}


/* =====================================================
   AUTH SYSTEM STATUS
===================================================== */

function getTipecoAuthStatus() {

    const user =
        getCurrentTipecoUser();


    return {

        version:
            TIPECO_AUTH_VERSION,

        loggedIn:
            !!user,

        userId:
            user
                ? user.id
                : null,

        user:
            user || null

    };

}


/* =====================================================
   AUTH TEST
===================================================== */

function testTipecoAuth() {

    try {

        const status =
            getTipecoAuthStatus();


        console.log(
            "===================================="
        );

        console.log(
            "TIPECO AUTH SYSTEM"
        );

        console.log(
            "Version:",
            TIPECO_AUTH_VERSION
        );

        console.log(
            "Logged in:",
            status.loggedIn
        );

        console.log(
            "User:",
            status.user
        );

        console.log(
            "===================================="
        );


        return true;

    } catch (error) {

        console.error(
            "TIPECO Auth Test Error:",
            error
        );

        return false;

    }

}


/* =====================================================
   AUTO AUTH CHECK
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const status =
            getTipecoAuthStatus();


        console.log(
            "TIPECO Auth v3.0 loaded.",
            status
        );

    }
);
