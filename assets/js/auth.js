/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 9.0

   GENERAL ACCOUNT ARCHITECTURE

   - One General TIPECO GROUP Account
   - Email + Password
   - Mandatory Email Verification
   - Country Required
   - Phone Optional
   - Phone is Contact / Recovery Information Only
   - NO SMS OTP
   - NO Firebase Phone Auth
   - NO Phone reCAPTCHA
   - NO phoneVerified requirement

   ACCOUNT LIFECYCLE

   Register
      ↓
   Firebase Auth Account
      ↓
   Firestore User Profile
      ↓
   Email Verification Required
      ↓
   Email Verified
      ↓
   Account ACTIVE

   SECURITY PRINCIPLE

   - Firebase Auth + Firestore are the source of truth.
   - No localStorage authentication.
   - Subscription != Approval.
   - Owner role is never created from public registration.
   - Phone number is NOT treated as a verified authentication factor.
===================================================== */


/* =====================================================
   FIREBASE IMPORTS
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
   CONSTANTS
===================================================== */

const OWNER_ROLE = "owner";
const GENERAL_USER_ROLE = "user";

const OWNER_DASHBOARD = "owner-dashboard.html";
const DEFAULT_HOME = "../index.html";
const LOGIN_PAGE = "login.html";

const PUBLIC_OWNER_FORBIDDEN = true;


/* =====================================================
   SESSION CONVENIENCE KEYS

   Firebase Auth remains the real source of truth.
   sessionStorage is NOT used as authentication authority.
===================================================== */

const SESSION_AUTHENTICATED =
    "tipecoAuthenticated";

const SESSION_USER_ID =
    "tipecoUserId";

const SESSION_ROLE =
    "tipecoRole";


/* =====================================================
   BASIC UI HELPERS
===================================================== */

function showMessage(
    element,
    message,
    type = "info"
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.dataset.type =
        type;

    element.style.display =
        "block";
}


function hideMessage(element) {

    if (!element) {
        return;
    }

    element.textContent =
        "";

    element.style.display =
        "none";
}


/* =====================================================
   SESSION HELPERS
===================================================== */

function clearTipecoSession() {

    try {

        sessionStorage.removeItem(
            SESSION_AUTHENTICATED
        );

        sessionStorage.removeItem(
            SESSION_USER_ID
        );

        sessionStorage.removeItem(
            SESSION_ROLE
        );

    } catch (error) {

        console.warn(
            "TIPECO session cleanup warning:",
            error
        );
    }
}


function saveTipecoSession(
    user,
    profile
) {

    try {

        sessionStorage.setItem(
            SESSION_AUTHENTICATED,
            "true"
        );

        sessionStorage.setItem(
            SESSION_USER_ID,
            user.uid
        );

        sessionStorage.setItem(
            SESSION_ROLE,
            profile?.role ||
            GENERAL_USER_ROLE
        );

    } catch (error) {

        console.warn(
            "TIPECO session save warning:",
            error
        );
    }
}


/* =====================================================
   FIRESTORE USER PROFILE
===================================================== */

async function getUserProfile(uid) {

    if (!uid) {
        return null;
    }

    const userRef =
        doc(
            db,
            "users",
            uid
        );

    const snapshot =
        await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}


/* =====================================================
   OWNER CHECK
===================================================== */

function isTipecoOwner(
    profile
) {

    return (
        profile &&
        profile.role === OWNER_ROLE
    );
}


/* =====================================================
   ACCOUNT STATUS
===================================================== */

function getAccountStatus(
    profile
) {

    return (
        profile?.accountStatus ||
        "unknown"
    );
}


/* =====================================================
   UPDATE USER PROFILE
===================================================== */

async function updateUserProfile(
    uid,
    data
) {

    if (!uid) {

        throw new Error(
            "User UID is required."
        );
    }

    const userRef =
        doc(
            db,
            "users",
            uid
        );

    await setDoc(
        userRef,
        data,
        {
            merge: true
        }
    );
}


/* =====================================================
   PHONE NORMALIZATION

   IMPORTANT:
   Phone is OPTIONAL.

   This function is only used when a user chooses
   to provide a phone number as contact information.

   It does NOT verify the phone number.
===================================================== */

function normalizePhoneNumber(
    countryCode,
    phone
) {

    if (!phone) {
        return "";
    }

    let cleaned =
        String(phone)
            .trim()
            .replace(/[^\d+]/g, "");

    if (!cleaned) {
        return "";
    }

    if (
        cleaned.startsWith("+")
    ) {

        return cleaned;
    }

    if (
        cleaned.startsWith("00")
    ) {

        return (
            "+" +
            cleaned.substring(2)
        );
    }

    cleaned =
        cleaned.replace(
            /^0+/,
            ""
        );

    if (!countryCode) {
        return cleaned;
    }

    return (
        String(countryCode) +
        cleaned
    );
}


/* =====================================================
   OPTIONAL PHONE VALIDATION

   This validates format only.

   It does NOT mean the phone is verified.
===================================================== */

function validateE164Phone(
    phone
) {

    if (!phone) {
        return true;
    }

    return /^\+[1-9]\d{7,14}$/.test(
        phone
    );
}


/* =====================================================
   FIREBASE ERROR MESSAGE
===================================================== */

function getFirebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";

    switch (code) {

        case "auth/invalid-email":
            return "The email address is invalid.";

        case "auth/email-already-in-use":
            return "This email address is already registered.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/too-many-requests":
            return "Too many requests. Please wait and try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/operation-not-allowed":
            return "This authentication method is not enabled in Firebase.";

        case "auth/requires-recent-login":
            return "Please log in again and retry.";

        default:
            return (
                error?.message ||
                "An unexpected authentication error occurred."
            );
    }
}


/* =====================================================
   CREATE REGISTRATION ACCOUNT
===================================================== */

async function createRegistrationAccount(
    registrationData
) {

    const {
        fullName,
        email,
        country,
        phone,
        password
    } = registrationData;


    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (!fullName) {

        throw new Error(
            "Full name is required."
        );
    }

    if (!email) {

        throw new Error(
            "Email address is required."
        );
    }

    if (!country) {

        throw new Error(
            "Country is required."
        );
    }

    if (!password) {

        throw new Error(
            "Password is required."
        );
    }


    /* =================================================
       OPTIONAL PHONE
    ================================================= */

    let normalizedPhone = "";

    if (phone) {

        normalizedPhone =
            normalizePhoneNumber(
                country,
                phone
            );

        if (
            !validateE164Phone(
                normalizedPhone
            )
        ) {

            throw new Error(
                "Please enter a valid international phone number."
            );
        }
    }


    /* =================================================
       CREATE FIREBASE AUTH USER
    ================================================= */

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    const user =
        credential.user;


    /* =================================================
       CREATE FIRESTORE PROFILE

       IMPORTANT:
       Public registration can ONLY create
       the GENERAL USER role.

       It can NEVER create owner.
    ================================================= */

    const profileData = {

        uid:
            user.uid,

        fullName:
            fullName,

        email:
            email,

        country:
            country,

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
    };


    /* =================================================
       PHONE

       Phone is optional.

       We store it only when supplied.
       There is NO phoneVerified field.
    ================================================= */

    if (normalizedPhone) {

        profileData.phone =
            normalizedPhone;

    } else {

        profileData.phone =
            "";
    }


    await setDoc(
        doc(
            db,
            "users",
            user.uid
        ),
        profileData,
        {
            merge: true
        }
    );


    return user;
}


/* =====================================================
   REGISTRATION
===================================================== */

async function handleRegistration(
    event
) {

    if (event) {
        event.preventDefault();
    }

    const form =
        event?.currentTarget ||
        document.getElementById(
            "registerForm"
        );

    if (!form) {
        return;
    }


    /* =================================================
       INPUTS
    ================================================= */

    const fullName =
        document.getElementById(
            "fullName"
        )?.value
            ?.trim() || "";


    const email =
        document.getElementById(
            "email"
        )?.value
            ?.trim()
            .toLowerCase() || "";


    const country =
        document.getElementById(
            "country"
        )?.value
            ?.trim() || "";


    const phoneRaw =
        document.getElementById(
            "phone"
        )?.value
            ?.trim() || "";


    const password =
        document.getElementById(
            "password"
        )?.value || "";


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value || "";


    const terms =
        document.getElementById(
            "terms"
        )?.checked || false;


    const statusElement =
        document.getElementById(
            "registerStatus"
        );


    /* =================================================
       VALIDATION
    ================================================= */

    if (!fullName) {

        showMessage(
            statusElement,
            "Please enter your full name.",
            "error"
        );

        return;
    }


    if (!email) {

        showMessage(
            statusElement,
            "Please enter your email address.",
            "error"
        );

        return;
    }


    if (!country) {

        showMessage(
            statusElement,
            "Please select your country.",
            "error"
        );

        return;
    }


    if (
        !password ||
        password.length < 6
    ) {

        showMessage(
            statusElement,
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            statusElement,
            "Passwords do not match.",
            "error"
        );

        return;
    }


    if (!terms) {

        showMessage(
            statusElement,
            "Please accept the Terms and Conditions.",
            "error"
        );

        return;
    }


    /* =================================================
       OPTIONAL PHONE VALIDATION
    ================================================= */

    let normalizedPhone = "";

    if (phoneRaw) {

        try {

            normalizedPhone =
                normalizePhoneNumber(
                    country,
                    phoneRaw
                );

        } catch (error) {

            showMessage(
                statusElement,
                error.message,
                "error"
            );

            return;
        }


        if (
            !validateE164Phone(
                normalizedPhone
            )
        ) {

            showMessage(
                statusElement,
                "Please enter a valid international phone number, or leave the phone field empty.",
                "error"
            );

            return;
        }
    }


    /* =================================================
       REGISTRATION
    ================================================= */

    try {

        const registerButton =
            document.getElementById(
                "registerButton"
            ) ||
            document.getElementById(
                "createAccountButton"
            );


        if (registerButton) {

            registerButton.disabled =
                true;
        }


        showMessage(
            statusElement,
            "Creating your TIPECO GROUP account...",
            "info"
        );


        /* =============================================
           CREATE FIREBASE ACCOUNT
        ============================================= */

        const user =
            await createRegistrationAccount(
                {
                    fullName,
                    email,
                    country,
                    phone:
                        normalizedPhone,
                    password
                }
            );


        /* =============================================
           EMAIL VERIFICATION
        ============================================= */

        await sendEmailVerification(
            user
        );


        /* =============================================
           FIRESTORE PROFILE

           Keep emailVerified false until
           Firebase confirms the email.
        ============================================= */

        await updateUserProfile(
            user.uid,
            {

                uid:
                    user.uid,

                fullName,

                email:
                    user.email,

                country,

                role:
                    GENERAL_USER_ROLE,

                emailVerified:
                    false,

                accountStatus:
                    "pending_verification",

                updatedAt:
                    serverTimestamp()
            }
        );


        /* =============================================
           OPTIONAL PHONE
        ============================================= */

        if (normalizedPhone) {

            await updateUserProfile(
                user.uid,
                {
                    phone:
                        normalizedPhone,

                    updatedAt:
                        serverTimestamp()
                }
            );

        } else {

            await updateUserProfile(
                user.uid,
                {
                    phone:
                        "",

                    updatedAt:
                        serverTimestamp()
                }
            );
        }


        /* =============================================
           SUCCESS
        ============================================= */

        showMessage(
            statusElement,
            "Account created successfully. Please check your email and click the verification link before logging in.",
            "success"
        );


        const emailVerificationSection =
            document.getElementById(
                "emailVerificationSection"
            );


        if (
            emailVerificationSection
        ) {

            emailVerificationSection.style.display =
                "block";
        }


        clearTipecoSession();


    } catch (error) {

        console.error(
            "TIPECO registration error:",
            error
        );


        showMessage(
            statusElement,
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );


    } finally {

        const registerButton =
            document.getElementById(
                "registerButton"
            ) ||
            document.getElementById(
                "createAccountButton"
            );


        if (registerButton) {

            registerButton.disabled =
                false;
        }
    }
}


/* =====================================================
   EMAIL VERIFICATION
===================================================== */

async function verifyEmailAddress() {

    const statusElement =
        document.getElementById(
            "emailVerificationStatus"
        );

    try {

        const user =
            auth.currentUser;


        if (!user) {

            showMessage(
                statusElement,
                "Please complete registration first.",
                "error"
            );

            return;
        }


        /* =============================================
           Refresh Firebase Auth state
        ============================================= */

        await reload(
            user
        );


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            showMessage(
                statusElement,
                "Your Firebase session could not be found. Please register or log in again.",
                "error"
            );

            return;
        }


        /* =============================================
           EMAIL CHECK ONLY

           Phone verification is NOT required.
        ============================================= */

        const emailVerified =
            currentUser.emailVerified === true;


        if (!emailVerified) {

            showMessage(
                statusElement,
                "Your email is not verified yet. Open the verification email and click the verification link.",
                "error"
            );

            return;
        }


        /* =============================================
           UPDATE FIRESTORE

           Email verification is now complete.
           Account becomes ACTIVE.
        ============================================= */

        await updateUserProfile(
            currentUser.uid,
            {

                emailVerified:
                    true,

                accountStatus:
                    "active",

                updatedAt:
                    serverTimestamp()
            }
        );


        showMessage(
            statusElement,
            "Your email has been verified successfully. Your TIPECO GROUP account is now active.",
            "success"
        );


        clearTipecoSession();


        await signOut(
            auth
        );


        setTimeout(
            () => {

                window.location.href =
                    LOGIN_PAGE;

            },
            1200
        );


    } catch (error) {

        console.error(
            "TIPECO email verification error:",
            error
        );


        showMessage(
            statusElement,
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );
    }
}


/* =====================================================
   LOGIN
===================================================== */

async function handleLogin(
    event
) {

    if (event) {
        event.preventDefault();
    }


    const email =
        document.getElementById(
            "login"
        )?.value
            ?.trim()
            .toLowerCase() || "";


    const password =
        document.getElementById(
            "password"
        )?.value || "";


    const statusElement =
        document.getElementById(
            "loginStatus"
        );


    if (
        !email ||
        !password
    ) {

        showMessage(
            statusElement,
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    try {

        showMessage(
            statusElement,
            "Signing you in...",
            "info"
        );


        /* =============================================
           FIREBASE LOGIN
        ============================================= */

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        await reload(
            user
        );


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            throw new Error(
                "Unable to access the Firebase account."
            );
        }


        /* =============================================
           EMAIL VERIFICATION REQUIRED
        ============================================= */

        if (
            currentUser.emailVerified !== true
        ) {

            showMessage(
                statusElement,
                "Please verify your email before logging in.",
                "error"
            );


            await signOut(
                auth
            );


            return;
        }


        /* =============================================
           FIRESTORE PROFILE
        ============================================= */

        const profile =
            await getUserProfile(
                currentUser.uid
            );


        if (!profile) {

            await signOut(
                auth
            );


            showMessage(
                statusElement,
                "Your TIPECO GROUP profile could not be found.",
                "error"
            );


            return;
        }


        /* =============================================
           BLOCKED / SUSPENDED
        ============================================= */

        const status =
            getAccountStatus(
                profile
            );


        if (
            status === "blocked" ||
            status === "suspended"
        ) {

            await signOut(
                auth
            );


            showMessage(
                statusElement,
                "Your TIPECO GROUP account is currently blocked or suspended.",
                "error"
            );


            return;
        }


        /* =============================================
           ACCOUNT ACTIVE

           Email verification is the only
           verification requirement.
        ============================================= */

        if (
            currentUser.emailVerified === true
        ) {

            if (
                profile.accountStatus !==
                "active"
            ) {

                await updateUserProfile(
                    currentUser.uid,
                    {

                        emailVerified:
                            true,

                        accountStatus:
                            "active",

                        updatedAt:
                            serverTimestamp()
                    }
                );


                profile.emailVerified =
                    true;

                profile.accountStatus =
                    "active";
            }
        }


        /* =============================================
           SAVE SESSION CONVENIENCE DATA
        ============================================= */

        saveTipecoSession(
            currentUser,
            profile
        );


        /* =============================================
           OWNER DASHBOARD
        ============================================= */

        if (
            isTipecoOwner(
                profile
            )
        ) {

            window.location.href =
                OWNER_DASHBOARD;

            return;
        }


        /* =============================================
           GENERAL USERS
        ============================================= */

        window.location.href =
            DEFAULT_HOME;


    } catch (error) {

        console.error(
            "TIPECO login error:",
            error
        );


        showMessage(
            statusElement,
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );
    }
}


/* =====================================================
   OWNER AUTHORIZATION
===================================================== */

window.tipecoRequireOwner =
async function () {

    return new Promise(
        (resolve) => {

            let completed =
                false;


            const finish =
                (result) => {

                    if (
                        completed
                    ) {
                        return;
                    }


                    completed =
                        true;


                    resolve(
                        result
                    );
                };


            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    async (user) => {

                        /* =================================
                           NO USER
                        ================================= */

                        if (!user) {

                            unsubscribe();


                            window.location.href =
                                LOGIN_PAGE;


                            finish(
                                false
                            );


                            return;
                        }


                        try {

                            /* =============================
                               REFRESH AUTH STATE
                            ============================= */

                            await reload(
                                user
                            );


                            const currentUser =
                                auth.currentUser;


                            if (!currentUser) {

                                unsubscribe();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               EMAIL VERIFICATION
                            ============================= */

                            if (
                                currentUser.emailVerified !==
                                true
                            ) {

                                await signOut(
                                    auth
                                );


                                unsubscribe();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               FIRESTORE PROFILE
                            ============================= */

                            const profile =
                                await getUserProfile(
                                    currentUser.uid
                                );


                            if (!profile) {

                                await signOut(
                                    auth
                                );


                                unsubscribe();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               OWNER ROLE
                            ============================= */

                            if (
                                !isTipecoOwner(
                                    profile
                                )
                            ) {

                                if (
                                    PUBLIC_OWNER_FORBIDDEN
                                ) {

                                    await signOut(
                                        auth
                                    );


                                    unsubscribe();


                                    window.location.href =
                                        DEFAULT_HOME;


                                    finish(
                                        false
                                    );


                                    return;
                                }
                            }


                            /* =============================
                               ACCOUNT STATUS
                            ============================= */

                            const status =
                                getAccountStatus(
                                    profile
                                );


                            if (
                                status ===
                                    "blocked" ||
                                status ===
                                    "suspended"
                            ) {

                                await signOut(
                                    auth
                                );


                                unsubscribe();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               OWNER ACCOUNT ACTIVE

                               IMPORTANT:
                               No phone verification.
                            ============================= */

                            if (
                                currentUser.emailVerified ===
                                true
                            ) {

                                if (
                                    profile.accountStatus !==
                                    "active"
                                ) {

                                    await updateUserProfile(
                                        currentUser.uid,
                                        {

                                            emailVerified:
                                                true,

                                            accountStatus:
                                                "active",

                                            updatedAt:
                                                serverTimestamp()
                                        }
                                    );


                                    profile.emailVerified =
                                        true;

                                    profile.accountStatus =
                                        "active";
                                }
                            }


                            /* =============================
                               SESSION
                            ============================= */

                            saveTipecoSession(
                                currentUser,
                                profile
                            );


                            unsubscribe();


                            finish(
                                {
                                    user:
                                        currentUser,

                                    profile:
                                        profile
                                }
                            );


                        } catch (error) {

                            console.error(
                                "TIPECO owner authorization error:",
                                error
                            );


                            unsubscribe();


                            try {

                                await signOut(
                                    auth
                                );

                            } catch (
                                signOutError
                            ) {

                                console.warn(
                                    "TIPECO owner sign-out warning:",
                                    signOutError
                                );
                            }


                            window.location.href =
                                LOGIN_PAGE;


                            finish(
                                false
                            );
                        }
                    }
                );
        }
    );
};


/* =====================================================
   LOGOUT
===================================================== */

window.tipecoLogout =
async function () {

    try {

        clearTipecoSession();


        await signOut(
            auth
        );


        window.location.href =
            LOGIN_PAGE;


    } catch (error) {

        console.error(
            "TIPECO logout error:",
            error
        );
    }
};


/* =====================================================
   RESET PASSWORD

   EMAIL ONLY
===================================================== */

window.tipecoResetPassword =
async function (
    email
) {

    const normalizedEmail =
        String(
            email || ""
        )
            .trim()
            .toLowerCase();


    if (!normalizedEmail) {

        throw new Error(
            "Email address is required."
        );
    }


    await sendPasswordResetEmail(
        auth,
        normalizedEmail
    );


    return true;
};


/* =====================================================
   CURRENT USER
===================================================== */

window.tipecoGetCurrentUser =
function () {

    return auth.currentUser;
};


/* =====================================================
   CURRENT PROFILE
===================================================== */

window.tipecoGetCurrentProfile =
async function () {

    const user =
        auth.currentUser;


    if (!user) {
        return null;
    }


    return await getUserProfile(
        user.uid
    );
};


/* =====================================================
   OWNER CHECK
===================================================== */

window.tipecoIsOwner =
async function () {

    const user =
        auth.currentUser;


    if (!user) {
        return false;
    }


    const profile =
        await getUserProfile(
            user.uid
        );


    return isTipecoOwner(
        profile
    );
};


/* =====================================================
   EMAIL VERIFICATION BRIDGE
===================================================== */

window.tipecoVerifyEmail =
async function () {

    return await verifyEmailAddress();
};


/* =====================================================
   REGISTRATION BRIDGE
===================================================== */

window.tipecoRegister =
async function (
    event
) {

    return await handleRegistration(
        event
    );
};


/* =====================================================
   LOGIN BRIDGE
===================================================== */

window.tipecoLogin =
async function (
    event
) {

    return await handleLogin(
        event
    );
};


/* =====================================================
   AUTO CONNECT FORMS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* =============================================
           REGISTER FORM
        ============================================= */

        const registerForm =
            document.getElementById(
                "registerForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegistration
            );
        }


        /* =============================================
           LOGIN FORM
        ============================================= */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        /* =============================================
           EMAIL VERIFICATION BUTTON
        ============================================= */

        const verifyEmailButton =
            document.getElementById(
                "verifyEmailButton"
            );


        if (verifyEmailButton) {

            verifyEmailButton.addEventListener(
                "click",
                verifyEmailAddress
            );
        }
    }
);


/* =====================================================
   AUTH STATE INFORMATION
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {
            return;
        }


        try {

            await reload(
                user
            );


            const profile =
                await getUserProfile(
                    user.uid
                );


            if (!profile) {

                console.warn(
                    "TIPECO: Authenticated user has no Firestore profile."
                );


                return;
            }


            console.log(
                "TIPECO Auth State:",
                {

                    uid:
                        user.uid,

                    email:
                        user.email,

                    emailVerified:
                        user.emailVerified,

                    country:
                        profile.country,

                    accountStatus:
                        profile.accountStatus,

                    role:
                        profile.role
                }
            );


        } catch (error) {

            console.error(
                "TIPECO auth state error:",
                error
            );
        }
    }
);


/* =====================================================
   VERSION
===================================================== */

console.log(
    "TIPECO GROUP auth.js v9.0 loaded successfully."
);
