/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 7.2

   FEATURES
   -----------------------------------------------------
   - Firebase Email/Password Authentication
   - Email Verification
   - Firestore User Profiles
   - Owner Role Authentication
   - Owner Dashboard Protection
   - Blocked / Suspended Account Protection
   - Safe Auth State Check
   - Forgot Password
   - Secure Logout
   - Public Owner Registration Prevention

   IMPORTANT
   -----------------------------------------------------
   login.html              -> pages/login.html
   register.html           -> pages/register.html
   owner-dashboard.html    -> pages/owner-dashboard.html
   auth.js                 -> assets/js/auth.js
===================================================== */


/* =====================================================
   FIREBASE CONFIG
===================================================== */

import {
    auth,
    db
} from "./firebase-config.js";


/* =====================================================
   FIREBASE AUTH IMPORTS
===================================================== */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    reload
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =====================================================
   FIRESTORE IMPORTS
===================================================== */

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   TIPECO CONSTANTS
===================================================== */

const OWNER_ROLE = "owner";

const OWNER_DASHBOARD =
    "owner-dashboard.html";

const DEFAULT_HOME =
    "../index.html";

const LOGIN_PAGE =
    "login.html";


/* =====================================================
   PUBLIC REGISTRATION RULE
   -----------------------------------------------------
   Owner account MUST NEVER be created through the
   public registration page.

   The Owner account must be created/administered
   separately and its Firestore role must be:

       role: "owner"
===================================================== */

const PUBLIC_OWNER_FORBIDDEN = true;


/* =====================================================
   SESSION KEYS
===================================================== */

const AUTH_SESSION_KEY =
    "tipecoAuthenticated";

const USER_ID_SESSION_KEY =
    "tipecoUserId";

const ROLE_SESSION_KEY =
    "tipecoRole";


/* =====================================================
   MESSAGE HELPER
===================================================== */

function showMessage(message) {

    alert(message);

}


/* =====================================================
   CLEAR TIPECO SESSION
===================================================== */

function clearTipecoSession() {

    try {

        sessionStorage.removeItem(
            AUTH_SESSION_KEY
        );

        sessionStorage.removeItem(
            USER_ID_SESSION_KEY
        );

        sessionStorage.removeItem(
            ROLE_SESSION_KEY
        );

    } catch (error) {

        console.error(
            "TIPECO session cleanup error:",
            error
        );

    }

}


/* =====================================================
   SAVE TIPECO SESSION
===================================================== */

function saveTipecoSession(user, profile) {

    try {

        sessionStorage.setItem(
            AUTH_SESSION_KEY,
            "true"
        );

        sessionStorage.setItem(
            USER_ID_SESSION_KEY,
            user.uid
        );

        sessionStorage.setItem(
            ROLE_SESSION_KEY,
            profile?.role || ""
        );

    } catch (error) {

        console.error(
            "TIPECO session save error:",
            error
        );

    }

}


/* =====================================================
   GET USER PROFILE
   -----------------------------------------------------
   Reads:

       users/{uid}

   from Firestore.
===================================================== */

async function getUserProfile(user) {

    if (!user) {
        return null;
    }

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snapshot =
            await getDoc(userRef);

        if (!snapshot.exists()) {

            return null;

        }

        return {

            id: snapshot.id,

            ...snapshot.data()

        };

    } catch (error) {

        console.error(
            "Error loading user profile:",
            error
        );

        throw error;

    }

}


/* =====================================================
   CHECK TIPECO OWNER
===================================================== */

async function isTipecoOwner(user) {

    if (!user) {

        return false;

    }

    const profile =
        await getUserProfile(user);

    if (!profile) {

        return false;

    }

    return (
        String(profile.role || "")
            .trim()
            .toLowerCase()
        === OWNER_ROLE
    );

}


/* =====================================================
   CHECK ACCOUNT STATUS
===================================================== */

function getAccountStatus(profile) {

    if (!profile) {

        return "unknown";

    }

    return String(

        profile.accountStatus
        ??
        profile.status
        ??
        "active"

    )
        .trim()
        .toLowerCase();

}


/* =====================================================
   REGISTRATION
   -----------------------------------------------------
   Public registration.

   SECURITY:
   Owner cannot be created from this page.
===================================================== */

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =========================================
               GET FORM ELEMENTS
            ========================================= */

            const fullName =
                document.getElementById(
                    "fullName"
                )?.value.trim();

            const email =
                document.getElementById(
                    "email"
                )?.value.trim().toLowerCase();

            const phone =
                document.getElementById(
                    "phone"
                )?.value.trim();

            const password =
                document.getElementById(
                    "password"
                )?.value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                )?.value;

            const accountTypeElement =
                document.getElementById(
                    "accountType"
                );

            const accountType =
                accountTypeElement
                    ?.value
                    ?.trim()
                    ?.toLowerCase();

            const terms =
                document.getElementById(
                    "terms"
                );

            const registerButton =
                document.getElementById(
                    "registerButton"
                );


            /* =========================================
               BASIC VALIDATION
            ========================================= */

            if (
                !fullName ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword ||
                !accountType
            ) {

                showMessage(
                    "Please fill in all required fields."
                );

                return;

            }


            /* =========================================
               PASSWORD CHECK
            ========================================= */

            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match."
                );

                return;

            }


            /* =========================================
               PASSWORD LENGTH
            ========================================= */

            if (password.length < 6) {

                showMessage(
                    "Password must contain at least 6 characters."
                );

                return;

            }


            /* =========================================
               TERMS CHECK
            ========================================= */

            if (
                terms &&
                !terms.checked
            ) {

                showMessage(
                    "Please accept the Terms and Conditions."
                );

                return;

            }


            /* =========================================
               OWNER SECURITY
               -----------------------------------------
               NEVER allow public registration to create
               an Owner account.
            ========================================= */

            if (
                PUBLIC_OWNER_FORBIDDEN &&
                accountType === OWNER_ROLE
            ) {

                showMessage(
                    "Owner accounts cannot be created through public registration."
                );

                return;

            }


            /* =========================================
               DISABLE BUTTON
            ========================================= */

            if (registerButton) {

                registerButton.disabled = true;

                registerButton.dataset.originalText =
                    registerButton.textContent;

                registerButton.textContent =
                    "Creating account...";

            }


            try {

                /* =====================================
                   CREATE FIREBASE AUTH USER
                ===================================== */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    userCredential.user;


                /* =====================================
                   SECURITY:
                   PUBLIC USERS CANNOT BECOME OWNER
                ===================================== */

                let assignedRole =
                    accountType;

                if (
                    assignedRole === OWNER_ROLE
                ) {

                    assignedRole =
                        "seller";

                }


                /* =====================================
                   CREATE FIRESTORE PROFILE
                ===================================== */

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                await setDoc(
                    userRef,
                    {

                        uid:
                            user.uid,

                        fullName:
                            fullName,

                        email:
                            email,

                        phone:
                            phone,

                        role:
                            assignedRole,

                        accountStatus:
                            "pending_verification",

                        emailVerified:
                            false,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );


                /* =====================================
                   SEND EMAIL VERIFICATION
                ===================================== */

                await sendEmailVerification(
                    user
                );


                /* =====================================
                   CLEAN SESSION
                ===================================== */

                clearTipecoSession();


                /* =====================================
                   SIGN OUT AFTER REGISTRATION
                ===================================== */

                await signOut(auth);


                /* =====================================
                   SUCCESS
                ===================================== */

                showMessage(
                    "Account created successfully.\n\n" +
                    "Please check your email and verify your account before logging in."
                );


                /* =====================================
                   REDIRECT TO LOGIN
                ===================================== */

                window.location.href =
                    LOGIN_PAGE;


            } catch (error) {

                console.error(
                    "TIPECO registration error:",
                    error
                );


                let message =
                    "Registration failed. Please try again.";


                switch (error.code) {

                    case "auth/email-already-in-use":

                        message =
                            "This email is already registered.";

                        break;


                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;


                    case "auth/weak-password":

                        message =
                            "Password is too weak.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    default:

                        message =
                            error.message ||
                            message;

                }


                showMessage(message);


            } finally {

                if (registerButton) {

                    registerButton.disabled =
                        false;

                    registerButton.textContent =
                        registerButton.dataset.originalText ||
                        "Create Account";

                }

            }

        }
    );

}


/* =====================================================
   LOGIN
   -----------------------------------------------------
   Compatible with:

       id="loginForm"
       id="login"
       id="password"

   NOTE:
   Current Firebase implementation is EMAIL/PASSWORD.
   Phone-number login is NOT implemented here.
===================================================== */

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =========================================
               GET LOGIN DATA
            ========================================= */

            const loginInput =
                document.getElementById(
                    "login"
                );

            const passwordInput =
                document.getElementById(
                    "password"
                );


            const email =
                loginInput
                    ?.value
                    ?.trim()
                    ?.toLowerCase();

            const password =
                passwordInput
                    ?.value;


            /* =========================================
               VALIDATION
            ========================================= */

            if (!email || !password) {

                showMessage(
                    "Please enter your email and password."
                );

                return;

            }


            /* =========================================
               LOGIN BUTTON
            ========================================= */

            const loginButton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.dataset.originalText =
                    loginButton.textContent;

                loginButton.textContent =
                    "Signing in...";

            }


            try {

                /* =====================================
                   FIREBASE LOGIN
                ===================================== */

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                /* =====================================
                   REFRESH FIREBASE USER
                ===================================== */

                await reload(user);


                /* =====================================
                   EMAIL VERIFICATION
                ===================================== */

                if (!user.emailVerified) {

                    try {

                        await sendEmailVerification(
                            user
                        );

                    } catch (
                        verificationError
                    ) {

                        console.warn(
                            "Verification email could not be resent:",
                            verificationError
                        );

                    }


                    await signOut(auth);

                    clearTipecoSession();


                    showMessage(
                        "Your email address is not verified yet.\n\n" +
                        "A verification email has been sent. " +
                        "Please verify your email and then log in again."
                    );


                    return;

                }


                /* =====================================
                   GET FIRESTORE PROFILE
                ===================================== */

                const profile =
                    await getUserProfile(user);


                if (!profile) {

                    await signOut(auth);

                    clearTipecoSession();


                    showMessage(
                        "Your account profile could not be found. Please contact TIPECO GROUP support."
                    );


                    return;

                }


                /* =====================================
                   ACCOUNT STATUS
                ===================================== */

                const accountStatus =
                    getAccountStatus(profile);


                if (
                    accountStatus ===
                        "blocked"
                    ||
                    accountStatus ===
                        "suspended"
                ) {

                    await signOut(auth);

                    clearTipecoSession();


                    showMessage(
                        "This account is currently " +
                        accountStatus +
                        ". Please contact TIPECO GROUP support."
                    );


                    return;

                }


                /* =====================================
                   UPDATE VERIFIED STATUS
                ===================================== */

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                await setDoc(
                    userRef,
                    {

                        emailVerified:
                            true,

                        accountStatus:
                            "active",

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );


                /* =====================================
                   SAVE SESSION
                ===================================== */

                saveTipecoSession(
                    user,
                    profile
                );


                /* =====================================
                   OWNER CHECK
                   -------------------------------------
                   Owner authorization is based on the
                   Firestore profile role.
                ===================================== */

                const userRole =
                    String(
                        profile.role || ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    userRole ===
                    OWNER_ROLE
                ) {

                    /* =================================
                       OWNER DASHBOARD

                       IMPORTANT:
                       login.html and owner-dashboard.html
                       are both inside /pages/
                    ================================= */

                    window.location.href =
                        OWNER_DASHBOARD;

                    return;

                }


                /* =====================================
                   NORMAL USER / SELLER
                ===================================== */

                window.location.href =
                    DEFAULT_HOME;


            } catch (error) {

                console.error(
                    "TIPECO login error:",
                    error
                );


                clearTipecoSession();


                let message =
                    "Login failed. Please check your email and password.";


                switch (error.code) {

                    case "auth/invalid-credential":

                        message =
                            "Invalid email or password.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "No account was found with this email.";

                        break;


                    case "auth/wrong-password":

                        message =
                            "Incorrect password.";

                        break;


                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "Too many login attempts. Please wait and try again later.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    default:

                        message =
                            error.message ||
                            message;

                }


                showMessage(message);


            } finally {

                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        loginButton.dataset.originalText ||
                        "Login";

                }

            }

        }
    );

}


/* =====================================================
   OWNER DASHBOARD PROTECTION
   -----------------------------------------------------
   This function MUST be called by
   owner-dashboard.html.

   Example:

       <script type="module">
           await window.tipecoRequireOwner();
       </script>
===================================================== */

window.tipecoRequireOwner =
    async function () {

        try {

            /* =========================================
               WAIT FOR FIREBASE AUTH STATE
            ========================================= */

            const user =
                await new Promise(
                    function (resolve) {

                        let finished =
                            false;

                        const unsubscribe =
                            onAuthStateChanged(
                                auth,
                                function (
                                    currentUser
                                ) {

                                    if (
                                        finished
                                    ) {

                                        return;

                                    }

                                    finished =
                                        true;

                                    unsubscribe();

                                    resolve(
                                        currentUser
                                    );

                                }
                            );

                    }
                );


            /* =========================================
               NO AUTH USER
            ========================================= */

            if (!user) {

                clearTipecoSession();

                window.location.href =
                    LOGIN_PAGE;

                return false;

            }


            /* =========================================
               REFRESH AUTH USER
            ========================================= */

            await reload(user);


            /* =========================================
               EMAIL VERIFICATION REQUIRED
            ========================================= */

            if (!user.emailVerified) {

                clearTipecoSession();

                try {

                    await signOut(auth);

                } catch (error) {

                    console.warn(
                        "Owner signout error:",
                        error
                    );

                }

                window.location.href =
                    LOGIN_PAGE;

                return false;

            }


            /* =========================================
               LOAD FIRESTORE PROFILE
            ========================================= */

            const profile =
                await getUserProfile(user);


            if (!profile) {

                clearTipecoSession();

                try {

                    await signOut(auth);

                } catch (error) {

                    console.warn(
                        "Owner signout error:",
                        error
                    );

                }

                showMessage(
                    "Owner profile not found."
                );


                window.location.href =
                    LOGIN_PAGE;

                return false;

            }


            /* =========================================
               VERIFY OWNER ROLE
               -----------------------------------------
               THIS IS THE IMPORTANT SECURITY CHECK.
            ========================================= */

            const role =
                String(
                    profile.role || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                role !== OWNER_ROLE
            ) {

                clearTipecoSession();


                showMessage(
                    "Access denied.\n\nOwner authorization is required."
                );


                try {

                    await signOut(auth);

                } catch (error) {

                    console.warn(
                        "Unauthorized signout error:",
                        error
                    );

                }


                window.location.href =
                    "../index.html";

                return false;

            }


            /* =========================================
               CHECK OWNER ACCOUNT STATUS
            ========================================= */

            const accountStatus =
                getAccountStatus(profile);


            if (
                accountStatus ===
                    "blocked"
                ||
                accountStatus ===
                    "suspended"
            ) {

                clearTipecoSession();


                showMessage(
                    "This Owner account is currently " +
                    accountStatus +
                    "."
                );


                try {

                    await signOut(auth);

                } catch (error) {

                    console.warn(
                        "Owner status signout error:",
                        error
                    );

                }


                window.location.href =
                    LOGIN_PAGE;

                return false;

            }


            /* =========================================
               SAVE VERIFIED OWNER SESSION
            ========================================= */

            saveTipecoSession(
                user,
                profile
            );


            /* =========================================
               SUCCESS
            ========================================= */

            return true;


        } catch (error) {

            console.error(
                "TIPECO Owner authorization error:",
                error
            );


            clearTipecoSession();


            try {

                await signOut(auth);

            } catch (signOutError) {

                console.warn(
                    "Final Owner signout error:",
                    signOutError
                );

            }


            window.location.href =
                LOGIN_PAGE;

            return false;

        }

    };


/* =====================================================
   LOGOUT
===================================================== */

window.tipecoLogout =
    async function () {

        try {

            await signOut(auth);

            clearTipecoSession();

            window.location.href =
                "../index.html";


        } catch (error) {

            console.error(
                "TIPECO logout error:",
                error
            );


            clearTipecoSession();


            window.location.href =
                "../index.html";

        }

    };


/* =====================================================
   FORGOT / RESET PASSWORD
===================================================== */

window.tipecoResetPassword =
    async function (email) {

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();


        if (!cleanEmail) {

            showMessage(
                "Please enter your email address."
            );

            return false;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                cleanEmail
            );


            showMessage(
                "Password reset email sent successfully. Please check your inbox."
            );


            return true;


        } catch (error) {

            console.error(
                "TIPECO password reset error:",
                error
            );


            let message =
                "Unable to send password reset email.";


            switch (error.code) {

                case "auth/user-not-found":

                    message =
                        "No account was found with this email.";

                    break;


                case "auth/invalid-email":

                    message =
                        "Please enter a valid email address.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Network error. Please check your internet connection.";

                    break;


                default:

                    message =
                        error.message ||
                        message;

            }


            showMessage(message);


            return false;

        }

    };


/* =====================================================
   CURRENT USER HELPER
===================================================== */

window.tipecoGetCurrentUser =
    function () {

        return auth.currentUser || null;

    };


/* =====================================================
   CURRENT PROFILE HELPER
===================================================== */

window.tipecoGetCurrentProfile =
    async function () {

        const user =
            auth.currentUser;


        if (!user) {

            return null;

        }


        return await getUserProfile(
            user
        );

    };


/* =====================================================
   OWNER CHECK HELPER
===================================================== */

window.tipecoIsOwner =
    async function () {

        const user =
            auth.currentUser;


        if (!user) {

            return false;

        }


        return await isTipecoOwner(
            user
        );

    };


/* =====================================================
   FIREBASE AUTH STATE MONITOR
   -----------------------------------------------------
   Informational only.

   Actual Owner authorization is performed by
   tipecoRequireOwner().
===================================================== */

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "TIPECO Firebase Auth:",
                user.uid
            );

        } else {

            console.log(
                "TIPECO Firebase Auth: No user signed in."
            );

        }

    }
);


/* =====================================================
   VERSION
===================================================== */

console.log(
    "TIPECO GROUP auth.js Version 7.2 loaded."
);
