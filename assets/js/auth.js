/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 7.3

   ARCHITECTURE
   -----------------------------------------------------
   - One General TIPECO GROUP Account
   - No public Buyer/Seller/Employer/Job Seeker roles
   - Email/Password Authentication
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

/*
   Internal role for normal registered accounts.

   IMPORTANT:
   This is NOT a role selected by the user.

   The public registration page does not allow users
   to choose Buyer, Seller, Employer, Job Seeker, etc.

   "user" simply identifies a normal TIPECO account
   internally.
*/
const GENERAL_USER_ROLE = "user";

const OWNER_DASHBOARD =
    "owner-dashboard.html";

const DEFAULT_HOME =
    "../index.html";

const LOGIN_PAGE =
    "login.html";


/* =====================================================
   PUBLIC OWNER REGISTRATION RULE
   -----------------------------------------------------
   Owner account MUST NEVER be created through the
   public registration page.

   Owner authorization is controlled separately by
   TIPECO GROUP / Owner administration.

   Firestore Owner profile:

       role: "owner"
===================================================== */

const PUBLIC_OWNER_FORBIDDEN = true;


/* =====================================================
   SESSION KEYS
   -----------------------------------------------------
   IMPORTANT:
   sessionStorage is ONLY a convenience layer.

   Firebase Authentication + Firestore Security Rules
   remain the real security source of truth.
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

function saveTipecoSession(
    user,
    profile
) {

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

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(
                userRef
            );

        if (!snapshot.exists()) {

            return null;

        }

        return {

            id:
                snapshot.id,

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
        String(
            profile.role || ""
        )
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
   UPDATE USER PROFILE
   -----------------------------------------------------
   Small helper used by registration / verification.
===================================================== */

async function updateUserProfile(
    user,
    data
) {

    if (!user) {

        return;

    }

    const userRef =
        doc(
            db,
            "users",
            user.uid
        );

    await setDoc(
        userRef,
        {

            ...data,

            updatedAt:
                serverTimestamp()

        },
        {
            merge: true
        }
    );

}


/* =====================================================
   REGISTRATION
   -----------------------------------------------------
   GENERAL TIPECO GROUP ACCOUNT

   IMPORTANT:
   -----------------------------------------------------
   There is NO account type selection.

   Registration creates a normal General Account.

   Subscription, posting permission, job application,
   Agent approval, Owner authorization, etc. are separate
   systems and are NOT registration roles.
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
                )?.value
                ?.trim();

            const email =
                document.getElementById(
                    "email"
                )?.value
                ?.trim()
                ?.toLowerCase();

            const phone =
                document.getElementById(
                    "phone"
                )?.value
                ?.trim();

            const password =
                document.getElementById(
                    "password"
                )?.value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                )?.value;

            const terms =
                document.getElementById(
                    "terms"
                );

            const registerButton =
                document.getElementById(
                    "registerButton"
                );

            const registerStatus =
                document.getElementById(
                    "registerStatus"
                );


            /* =========================================
               BASIC VALIDATION
            ========================================= */

            if (
                !fullName ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword
            ) {

                showMessage(
                    "Please fill in all required fields."
                );

                return;

            }


            /* =========================================
               EMAIL VALIDATION
            ========================================= */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(email)
            ) {

                showMessage(
                    "Please enter a valid email address."
                );

                return;

            }


            /* =========================================
               PASSWORD CHECK
            ========================================= */

            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    "Passwords do not match."
                );

                return;

            }


            /* =========================================
               PASSWORD LENGTH
            ========================================= */

            if (
                password.length < 6
            ) {

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
               Public registration can NEVER create
               an Owner account.
            ========================================= */

            if (
                PUBLIC_OWNER_FORBIDDEN
            ) {

                /*
                   No role/accountType is accepted from
                   the registration form.

                   The created public account is always
                   a General TIPECO GROUP account.
                */

            }


            /* =========================================
               DISABLE BUTTON
            ========================================= */

            if (registerButton) {

                registerButton.disabled =
                    true;

                registerButton.dataset.originalText =
                    registerButton.textContent;

                registerButton.textContent =
                    "Creating account...";

            }


            if (registerStatus) {

                registerStatus.textContent =
                    "Creating your TIPECO GROUP account...";

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
                   CREATE FIRESTORE PROFILE
                   -------------------------------------
                   General Account only.

                   "role: user" is INTERNAL and is NOT
                   a role selected by the registrant.

                   Owner is assigned separately.
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
                            GENERAL_USER_ROLE,

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
                   SAVE TEMPORARY VERIFICATION STATE
                   -------------------------------------
                   Firebase Auth remains signed in here.

                   This allows the Verify Email button
                   on register.html to reload the current
                   Firebase user and check verification.
                ===================================== */

                clearTipecoSession();


                /* =====================================
                   SHOW VERIFICATION MESSAGE
                ===================================== */

                const verificationMessage =
                    document.getElementById(
                        "verificationMessage"
                    );

                if (verificationMessage) {

                    verificationMessage.style.display =
                        "block";

                }


                const verifyEmailButton =
                    document.getElementById(
                        "verifyEmailButton"
                    );

                if (verifyEmailButton) {

                    verifyEmailButton.style.display =
                        "inline-block";

                }


                if (registerStatus) {

                    registerStatus.textContent =
                        "Account created. Please verify your email address.";

                }


                showMessage(
                    "Account created successfully.\n\n" +
                    "Please open the verification email sent to your inbox, " +
                    "click the verification link, then return here and press " +
                    "\"Verify Email\"."
                );


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


                    case "auth/operation-not-allowed":

                        message =
                            "Email/password registration is currently disabled in Firebase Authentication.";

                        break;


                    default:

                        message =
                            error.message ||
                            message;

                }


                showMessage(
                    message
                );


                if (registerStatus) {

                    registerStatus.textContent =
                        message;

                }


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
   VERIFY EMAIL BUTTON
   -----------------------------------------------------
   Used by:

       register.html

   Flow:

       Create Account
            ↓
       Firebase sends email
            ↓
       User clicks verification link
            ↓
       Returns to TIPECO
            ↓
       Clicks "Verify Email"
            ↓
       Firebase user reload
            ↓
       Check emailVerified
===================================================== */

const verifyEmailButton =
    document.getElementById(
        "verifyEmailButton"
    );


if (verifyEmailButton) {

    verifyEmailButton.addEventListener(
        "click",
        async function () {

            const originalText =
                verifyEmailButton.textContent;

            verifyEmailButton.disabled =
                true;

            verifyEmailButton.textContent =
                "Checking verification...";


            try {

                const user =
                    auth.currentUser;


                /* =====================================
                   NO CURRENT FIREBASE USER
                ===================================== */

                if (!user) {

                    showMessage(
                        "Your registration session has expired. Please go to Login and sign in after verifying your email."
                    );

                    return;

                }


                /* =====================================
                   RELOAD FIREBASE USER
                ===================================== */

                await reload(user);


                /* =====================================
                   CHECK VERIFICATION
                ===================================== */

                if (!user.emailVerified) {

                    showMessage(
                        "Your email is not verified yet.\n\n" +
                        "Please open the verification email, click the verification link, " +
                        "then return here and press \"Verify Email\" again."
                    );

                    return;

                }


                /* =====================================
                   LOAD PROFILE
                ===================================== */

                const profile =
                    await getUserProfile(
                        user
                    );


                if (!profile) {

                    showMessage(
                        "Your account profile could not be found. Please contact TIPECO GROUP support."
                    );

                    return;

                }


                /* =====================================
                   CHECK ACCOUNT STATUS
                ===================================== */

                const accountStatus =
                    getAccountStatus(
                        profile
                    );


                if (
                    accountStatus ===
                        "blocked"
                    ||
                    accountStatus ===
                        "suspended"
                ) {

                    await signOut(
                        auth
                    );

                    clearTipecoSession();


                    showMessage(
                        "This account is currently " +
                        accountStatus +
                        ". Please contact TIPECO GROUP support."
                    );

                    return;

                }


                /* =====================================
                   UPDATE VERIFIED PROFILE
                ===================================== */

                await updateUserProfile(
                    user,
                    {

                        emailVerified:
                            true,

                        accountStatus:
                            "active"

                    }
                );


                /* =====================================
                   CLEAR SESSION
                ===================================== */

                clearTipecoSession();


                /* =====================================
                   SIGN OUT
                   -------------------------------------
                   User will use the normal Login flow
                   after successful verification.
                ===================================== */

                await signOut(
                    auth
                );


                showMessage(
                    "Email verified successfully.\n\n" +
                    "Your TIPECO GROUP account is now active. " +
                    "Please log in to continue."
                );


                /* =====================================
                   REDIRECT TO LOGIN
                ===================================== */

                window.location.href =
                    LOGIN_PAGE;


            } catch (error) {

                console.error(
                    "TIPECO email verification check error:",
                    error
                );


                let message =
                    "Unable to check email verification. Please try again.";


                switch (error.code) {

                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    case "auth/user-token-expired":

                        message =
                            "Your registration session has expired. Please log in again.";

                        break;


                    default:

                        message =
                            error.message ||
                            message;

                }


                showMessage(
                    message
                );


            } finally {

                verifyEmailButton.disabled =
                    false;

                verifyEmailButton.textContent =
                    originalText ||
                    "Verify Email";

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
   -----------------------------------------------------
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

            if (
                !email ||
                !password
            ) {

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

                await reload(
                    user
                );


                /* =====================================
                   EMAIL VERIFICATION
                ===================================== */

                if (
                    !user.emailVerified
                ) {

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


                    await signOut(
                        auth
                    );

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
                    await getUserProfile(
                        user
                    );


                if (!profile) {

                    await signOut(
                        auth
                    );

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
                    getAccountStatus(
                        profile
                    );


                if (
                    accountStatus ===
                        "blocked"
                    ||
                    accountStatus ===
                        "suspended"
                ) {

                    await signOut(
                        auth
                    );

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

                await updateUserProfile(
                    user,
                    {

                        emailVerified:
                            true,

                        accountStatus:
                            "active"

                    }
                );


                /* =====================================
                   SAVE SESSION
                ===================================== */

                /*
                   Refresh profile after update so the
                   session contains the current data.
                */

                const updatedProfile =
                    await getUserProfile(
                        user
                    );


                saveTipecoSession(
                    user,
                    updatedProfile ||
                    profile
                );


                /* =====================================
                   OWNER CHECK
                   -------------------------------------
                   Owner authorization is based on the
                   Firestore profile role.

                   Public users cannot assign themselves
                   this role through registration.
                ===================================== */

                const userRole =
                    String(
                        (
                            updatedProfile ||
                            profile
                        ).role || ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    userRole ===
                    OWNER_ROLE
                ) {

                    /* =================================
                       OWNER DASHBOARD

                       login.html and owner-dashboard.html
                       are both inside /pages/
                    ================================= */

                    window.location.href =
                        OWNER_DASHBOARD;

                    return;

                }


                /* =====================================
                   GENERAL TIPECO GROUP ACCOUNT
                   -------------------------------------
                   There is no Seller/Buyer redirect.

                   All normal accounts return to the
                   public TIPECO GROUP home page.
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


                showMessage(
                    message
                );


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

   SECURITY:
   -----------------------------------------------------
   Firestore Security Rules MUST ALSO enforce Owner
   access. Frontend JavaScript alone is NOT security.
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

            await reload(
                user
            );


            /* =========================================
               EMAIL VERIFICATION REQUIRED
            ========================================= */

            if (
                !user.emailVerified
            ) {

                clearTipecoSession();

                try {

                    await signOut(
                        auth
                    );

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
                await getUserProfile(
                    user
                );


            if (!profile) {

                clearTipecoSession();

                try {

                    await signOut(
                        auth
                    );

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
               THIS IS THE IMPORTANT AUTHORIZATION CHECK.
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

                    await signOut(
                        auth
                    );

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
                getAccountStatus(
                    profile
                );


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

                    await signOut(
                        auth
                    );

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

                await signOut(
                    auth
                );

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

            await signOut(
                auth
            );

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
            String(
                email || ""
            )
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


            showMessage(
                message
            );


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

   Actual authorization is handled separately.
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
    "TIPECO GROUP auth.js Version 7.3 loaded."
);
