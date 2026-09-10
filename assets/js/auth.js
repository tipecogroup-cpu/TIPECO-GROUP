/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 8.0

   GENERAL ACCOUNT ARCHITECTURE
   - One General TIPECO GROUP Account
   - Email + Password
   - Mandatory Email Verification
   - Mandatory Phone Verification (SMS OTP)
   - Firebase Phone Auth + reCAPTCHA
   - Phone linked to the SAME Firebase account
   - Account active ONLY when:
       emailVerified === true
       AND
       phoneVerified === true

   SECURITY PRINCIPLE
   - Firebase Auth + Firestore are the source of truth.
   - No localStorage authentication.
   - Subscription != Approval.
   - Owner role is never created from public registration.
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
    reload,
    RecaptchaVerifier,
    linkWithPhoneNumber
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
===================================================== */

const SESSION_AUTHENTICATED = "tipecoAuthenticated";
const SESSION_USER_ID = "tipecoUserId";
const SESSION_ROLE = "tipecoRole";


/* =====================================================
   PHONE VERIFICATION STATE
===================================================== */

let recaptchaVerifier = null;
let confirmationResult = null;

let phoneVerificationInProgress = false;
let phoneVerified = false;

let pendingRegistrationUser = null;


/* =====================================================
   BASIC UI HELPERS
===================================================== */

function showMessage(element, message, type = "info") {

    if (!element) return;

    element.textContent = message;

    element.dataset.type = type;

    element.style.display = "block";
}


function hideMessage(element) {

    if (!element) return;

    element.textContent = "";
    element.style.display = "none";
}


/* =====================================================
   SESSION HELPERS
===================================================== */

function clearTipecoSession() {

    try {
        sessionStorage.removeItem(SESSION_AUTHENTICATED);
        sessionStorage.removeItem(SESSION_USER_ID);
        sessionStorage.removeItem(SESSION_ROLE);
    } catch (error) {
        console.warn(
            "TIPECO session cleanup warning:",
            error
        );
    }
}


function saveTipecoSession(user, profile) {

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
            profile?.role || GENERAL_USER_ROLE
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

    if (!uid) return null;

    const userRef = doc(
        db,
        "users",
        uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}


/* =====================================================
   OWNER CHECK
===================================================== */

function isTipecoOwner(profile) {

    return (
        profile &&
        profile.role === OWNER_ROLE
    );
}


/* =====================================================
   ACCOUNT STATUS
===================================================== */

function getAccountStatus(profile) {

    return profile?.accountStatus || "unknown";
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

    const userRef = doc(
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
===================================================== */

function normalizePhoneNumber(
    countryCode,
    phone
) {

    if (!countryCode || !phone) {
        throw new Error(
            "Country code and phone number are required."
        );
    }

    let cleaned = String(phone)
        .trim()
        .replace(/[^\d+]/g, "");

    /*
       If user enters:
       078xxxxxxx
       and country code is +250

       convert to:
       +25078xxxxxxx
    */

    if (cleaned.startsWith("+")) {

        return cleaned;

    }

    if (cleaned.startsWith("00")) {

        return "+" + cleaned.substring(2);

    }

    cleaned = cleaned.replace(/^0+/, "");

    return (
        String(countryCode) +
        cleaned
    );
}


/* =====================================================
   PHONE VALIDATION
===================================================== */

function validateE164Phone(
    phone
) {

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

        case "auth/invalid-phone-number":
            return "The phone number is invalid. Use a valid international number.";

        case "auth/missing-phone-number":
            return "Phone number is required.";

        case "auth/too-many-requests":
            return "Too many requests. Please wait and try again later.";

        case "auth/quota-exceeded":
            return "SMS verification quota has been exceeded. Please try again later.";

        case "auth/captcha-check-failed":
            return "reCAPTCHA verification failed. Please try again.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/operation-not-allowed":
            return "This authentication method is not enabled in Firebase.";

        case "auth/provider-already-linked":
            return "A phone number is already linked to this account.";

        case "auth/credential-already-in-use":
            return "This phone number is already linked to another account.";

        case "auth/code-expired":
            return "The verification code has expired. Please request a new code.";

        case "auth/invalid-verification-code":
            return "The verification code is incorrect.";

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
   reCAPTCHA INITIALIZATION
===================================================== */

function initializeRecaptcha() {

    const container =
        document.getElementById(
            "recaptcha-container"
        );

    if (!container) {

        console.error(
            "TIPECO: recaptcha-container not found."
        );

        return null;
    }

    if (recaptchaVerifier) {
        return recaptchaVerifier;
    }

    try {

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "normal",

                    callback: () => {

                        console.log(
                            "TIPECO reCAPTCHA completed."
                        );

                    },

                    "expired-callback": () => {

                        console.warn(
                            "TIPECO reCAPTCHA expired."
                        );

                    }
                }
            );

        return recaptchaVerifier;

    } catch (error) {

        console.error(
            "TIPECO reCAPTCHA initialization error:",
            error
        );

        return null;
    }
}


/* =====================================================
   CLEAR reCAPTCHA
===================================================== */

function clearRecaptcha() {

    if (!recaptchaVerifier) {
        return;
    }

    try {

        recaptchaVerifier.clear();

    } catch (error) {

        console.warn(
            "TIPECO reCAPTCHA cleanup warning:",
            error
        );

    } finally {

        recaptchaVerifier = null;
    }
}


/* =====================================================
   CREATE PENDING REGISTRATION ACCOUNT
===================================================== */

async function createPendingRegistrationAccount(
    registrationData
) {

    const {
        fullName,
        email,
        phone,
        password
    } = registrationData;

    /*
       If account was already created during
       phone verification preparation, reuse it.
    */

    if (
        auth.currentUser &&
        auth.currentUser.email === email
    ) {

        pendingRegistrationUser =
            auth.currentUser;

        return auth.currentUser;
    }


    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    const user =
        credential.user;

    pendingRegistrationUser = user;

    await setDoc(
        doc(
            db,
            "users",
            user.uid
        ),
        {
            uid: user.uid,

            fullName: fullName,

            email: email,

            phone: phone,

            role: GENERAL_USER_ROLE,

            accountStatus:
                "pending_verification",

            emailVerified:
                false,

            phoneVerified:
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

    return user;
}


/* =====================================================
   SEND PHONE VERIFICATION CODE
===================================================== */

async function sendPhoneVerificationCode() {

    if (phoneVerificationInProgress) {
        return;
    }

    const fullNameInput =
        document.getElementById("fullName");

    const emailInput =
        document.getElementById("email");

    const countryInput =
        document.getElementById("country");

    const phoneInput =
        document.getElementById("phone");

    const passwordInput =
        document.getElementById("password");

    const statusElement =
        document.getElementById(
            "phoneVerificationStatus"
        );

    const country =
        countryInput?.value || "+250";

    const phoneRaw =
        phoneInput?.value?.trim() || "";

    const email =
        emailInput?.value?.trim().toLowerCase() || "";

    const fullName =
        fullNameInput?.value?.trim() || "";

    const password =
        passwordInput?.value || "";

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

    if (!phoneRaw) {

        showMessage(
            statusElement,
            "Please enter your phone number.",
            "error"
        );

        return;
    }

    if (!password || password.length < 6) {

        showMessage(
            statusElement,
            "Please enter a password of at least 6 characters.",
            "error"
        );

        return;
    }

    let phoneNumber;

    try {

        phoneNumber =
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

    if (!validateE164Phone(phoneNumber)) {

        showMessage(
            statusElement,
            "Please enter a valid international phone number.",
            "error"
        );

        return;
    }

    phoneVerificationInProgress =
        true;

    try {

        /*
           Firebase email/password account is created first
           so the phone number can be linked to the SAME account.
        */

        const user =
            await createPendingRegistrationAccount(
                {
                    fullName,
                    email,
                    phone: phoneNumber,
                    password
                }
            );

        const verifier =
            initializeRecaptcha();

        if (!verifier) {

            throw new Error(
                "reCAPTCHA could not be initialized."
            );
        }

        showMessage(
            statusElement,
            "Sending verification code...",
            "info"
        );

        confirmationResult =
            await linkWithPhoneNumber(
                user,
                phoneNumber,
                verifier
            );

        await updateUserProfile(
            user.uid,
            {
                phone: phoneNumber,

                phoneVerified:
                    false,

                accountStatus:
                    "pending_verification",

                updatedAt:
                    serverTimestamp()
            }
        );

        showMessage(
            statusElement,
            "Verification code sent by SMS. Enter the 6-digit code.",
            "success"
        );

        const otpSection =
            document.getElementById(
                "otpSection"
            );

        if (otpSection) {
            otpSection.style.display =
                "block";
        }

        const otpInput =
            document.getElementById(
                "otp"
            );

        if (otpInput) {
            otpInput.focus();
        }

    } catch (error) {

        console.error(
            "TIPECO phone verification error:",
            error
        );

        showMessage(
            statusElement,
            getFirebaseErrorMessage(error),
            "error"
        );

    } finally {

        phoneVerificationInProgress =
            false;
    }
}


/* =====================================================
   VERIFY PHONE OTP
===================================================== */

async function verifyPhoneVerificationCode() {

    const otpInput =
        document.getElementById("otp");

    const statusElement =
        document.getElementById(
            "phoneVerificationStatus"
        );

    const code =
        otpInput?.value?.trim() || "";

    if (!confirmationResult) {

        showMessage(
            statusElement,
            "Please request a verification code first.",
            "error"
        );

        return;
    }

    if (!/^\d{6}$/.test(code)) {

        showMessage(
            statusElement,
            "Please enter the 6-digit verification code.",
            "error"
        );

        return;
    }

    try {

        showMessage(
            statusElement,
            "Verifying phone number...",
            "info"
        );

        const credential =
            await confirmationResult.confirm(
                code
            );

        const user =
            credential.user;

        pendingRegistrationUser =
            user;

        phoneVerified = true;

        await updateUserProfile(
            user.uid,
            {
                phone:
                    user.phoneNumber || "",

                phoneVerified:
                    true,

                accountStatus:
                    "pending_verification",

                updatedAt:
                    serverTimestamp()
            }
        );

        showMessage(
            statusElement,
            "Phone number verified successfully.",
            "success"
        );

        const phoneStatus =
            document.getElementById(
                "phoneStatus"
            );

        if (phoneStatus) {

            phoneStatus.textContent =
                "✓ Phone number verified";

            phoneStatus.dataset.status =
                "verified";
        }

        const createButton =
            document.getElementById(
                "registerButton"
            ) ||
            document.getElementById(
                "createAccountButton"
            );

        if (createButton) {

            createButton.disabled =
                false;
        }

        confirmationResult =
            null;

        clearRecaptcha();

    } catch (error) {

        console.error(
            "TIPECO OTP verification error:",
            error
        );

        showMessage(
            statusElement,
            getFirebaseErrorMessage(error),
            "error"
        );
    }
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

    if (!form) return;

    const fullName =
        document.getElementById(
            "fullName"
        )?.value?.trim() || "";

    const email =
        document.getElementById(
            "email"
        )?.value?.trim().toLowerCase() || "";

    const country =
        document.getElementById(
            "country"
        )?.value || "+250";

    const phoneRaw =
        document.getElementById(
            "phone"
        )?.value?.trim() || "";

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

    if (!phoneRaw) {

        showMessage(
            statusElement,
            "Please enter your phone number.",
            "error"
        );

        return;
    }

    if (!password || password.length < 6) {

        showMessage(
            statusElement,
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }

    if (password !== confirmPassword) {

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

    if (!phoneVerified) {

        /*
           Also check Firebase profile so the UI state
           cannot be trusted by itself.
        */

        const currentUser =
            auth.currentUser;

        if (currentUser) {

            const profile =
                await getUserProfile(
                    currentUser.uid
                );

            phoneVerified =
                profile?.phoneVerified === true;
        }
    }

    if (!phoneVerified) {

        showMessage(
            statusElement,
            "Phone verification is required before creating the account.",
            "error"
        );

        return;
    }

    try {

        let user =
            auth.currentUser;

        /*
           If the user already exists because phone
           verification created the pending account,
           reuse that Firebase user.
        */

        if (!user) {

            user =
                await createPendingRegistrationAccount(
                    {
                        fullName,
                        email,
                        phone:
                            normalizePhoneNumber(
                                country,
                                phoneRaw
                            ),
                        password
                    }
                );
        }

        await reload(user);

        user =
            auth.currentUser;

        if (!user) {

            throw new Error(
                "Unable to access the Firebase account."
            );
        }

        await updateUserProfile(
            user.uid,
            {
                uid: user.uid,

                fullName,

                email: user.email,

                phone:
                    user.phoneNumber ||
                    normalizePhoneNumber(
                        country,
                        phoneRaw
                    ),

                role:
                    GENERAL_USER_ROLE,

                emailVerified:
                    user.emailVerified === true,

                phoneVerified:
                    true,

                accountStatus:
                    "pending_verification",

                updatedAt:
                    serverTimestamp()
            }
        );

        /*
           Email verification is sent only after
           phone verification has succeeded.
        */

        if (!user.emailVerified) {

            await sendEmailVerification(
                user
            );
        }

        showMessage(
            statusElement,
            "Account created. Please verify your email before logging in.",
            "success"
        );

        const emailVerificationSection =
            document.getElementById(
                "emailVerificationSection"
            );

        if (emailVerificationSection) {

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
            getFirebaseErrorMessage(error),
            "error"
        );
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

        await reload(user);

        const currentUser =
            auth.currentUser;

        const profile =
            await getUserProfile(
                currentUser.uid
            );

        const emailVerified =
            currentUser.emailVerified === true;

        const phoneIsVerified =
            profile?.phoneVerified === true;

        if (!emailVerified) {

            showMessage(
                statusElement,
                "Your email is not verified yet. Open the verification email and click the verification link.",
                "error"
            );

            return;
        }

        if (!phoneIsVerified) {

            showMessage(
                statusElement,
                "Your phone number must also be verified.",
                "error"
            );

            return;
        }

        await updateUserProfile(
            currentUser.uid,
            {
                emailVerified: true,

                phoneVerified: true,

                accountStatus:
                    "active",

                updatedAt:
                    serverTimestamp()
            }
        );

        showMessage(
            statusElement,
            "Email and phone are both verified. Your TIPECO GROUP account is now active.",
            "success"
        );

        clearTipecoSession();

        await signOut(auth);

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
            getFirebaseErrorMessage(error),
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
        )?.value?.trim().toLowerCase() || "";

    const password =
        document.getElementById(
            "password"
        )?.value || "";

    const statusElement =
        document.getElementById(
            "loginStatus"
        );

    if (!email || !password) {

        showMessage(
            statusElement,
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            credential.user;

        await reload(user);

        const currentUser =
            auth.currentUser;

        /*
           Email verification is mandatory.
        */

        if (!currentUser.emailVerified) {

            showMessage(
                statusElement,
                "Please verify your email before logging in.",
                "error"
            );

            await signOut(auth);

            return;
        }

        const profile =
            await getUserProfile(
                currentUser.uid
            );

        if (!profile) {

            await signOut(auth);

            showMessage(
                statusElement,
                "Your TIPECO GROUP profile could not be found.",
                "error"
            );

            return;
        }

        /*
           Account blocking/suspension.
        */

        const status =
            getAccountStatus(profile);

        if (
            status === "blocked" ||
            status === "suspended"
        ) {

            await signOut(auth);

            showMessage(
                statusElement,
                "Your TIPECO GROUP account is currently blocked or suspended.",
                "error"
            );

            return;
        }

        /*
           Mandatory phone verification.
        */

        if (profile.phoneVerified !== true) {

            await signOut(auth);

            showMessage(
                statusElement,
                "Please verify your phone number before logging in.",
                "error"
            );

            return;
        }

        /*
           Account becomes active ONLY when
           BOTH verification requirements are true.
        */

        if (
            currentUser.emailVerified === true &&
            profile.phoneVerified === true
        ) {

            if (
                profile.accountStatus !== "active"
            ) {

                await updateUserProfile(
                    currentUser.uid,
                    {
                        emailVerified: true,

                        phoneVerified: true,

                        accountStatus:
                            "active",

                        updatedAt:
                            serverTimestamp()
                    }
                );

                profile.accountStatus =
                    "active";
            }
        }

        saveTipecoSession(
            currentUser,
            profile
        );

        /*
           Owner dashboard.
        */

        if (
            isTipecoOwner(profile)
        ) {

            window.location.href =
                OWNER_DASHBOARD;

            return;
        }

        /*
           General users.
        */

        window.location.href =
            DEFAULT_HOME;

    } catch (error) {

        console.error(
            "TIPECO login error:",
            error
        );

        showMessage(
            statusElement,
            getFirebaseErrorMessage(error),
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

            let completed = false;

            const finish = (
                result
            ) => {

                if (completed) {
                    return;
                }

                completed = true;

                resolve(result);
            };

            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    async (user) => {

                        if (!user) {

                            unsubscribe();

                            window.location.href =
                                LOGIN_PAGE;

                            finish(false);

                            return;
                        }

                        try {

                            await reload(user);

                            const currentUser =
                                auth.currentUser;

                            if (
                                !currentUser.emailVerified
                            ) {

                                await signOut(auth);

                                unsubscribe();

                                window.location.href =
                                    LOGIN_PAGE;

                                finish(false);

                                return;
                            }

                            const profile =
                                await getUserProfile(
                                    currentUser.uid
                                );

                            if (!profile) {

                                await signOut(auth);

                                unsubscribe();

                                window.location.href =
                                    LOGIN_PAGE;

                                finish(false);

                                return;
                            }

                            if (
                                profile.phoneVerified !== true
                            ) {

                                await signOut(auth);

                                unsubscribe();

                                window.location.href =
                                    LOGIN_PAGE;

                                finish(false);

                                return;
                            }

                            if (
                                !isTipecoOwner(
                                    profile
                                )
                            {

                                if (
                                    PUBLIC_OWNER_FORBIDDEN
                                ) {

                                    await signOut(
                                        auth
                                    );

                                    unsubscribe();

                                    window.location.href =
                                        DEFAULT_HOME;

                                    finish(false);

                                    return;
                                }
                            }

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

                                unsubscribe();

                                window.location.href =
                                    LOGIN_PAGE;

                                finish(false);

                                return;
                            }

                            if (
                                currentUser.emailVerified &&
                                profile.phoneVerified === true
                            ) {

                                if (
                                    profile.accountStatus !==
                                    "active"
                                ) {

                                    await updateUserProfile(
                                        currentUser.uid,
                                        {
                                            emailVerified: true,

                                            phoneVerified: true,

                                            accountStatus:
                                                "active",

                                            updatedAt:
                                                serverTimestamp()
                                        }
                                    );

                                    profile.accountStatus =
                                        "active";
                                }
                            }

                            saveTipecoSession(
                                currentUser,
                                profile
                            );

                            unsubscribe();

                            finish({
                                user:
                                    currentUser,

                                profile
                            });

                        } catch (error) {

                            console.error(
                                "TIPECO owner authorization error:",
                                error
                            );

                            unsubscribe();

                            await signOut(
                                auth
                            );

                            window.location.href =
                                LOGIN_PAGE;

                            finish(false);
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

        await signOut(auth);

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
===================================================== */

window.tipecoResetPassword =
async function (
    email
) {

    const normalizedEmail =
        String(email || "")
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
   PHONE VERIFICATION BRIDGES
   Used by register.html v5.0
===================================================== */

window.tipecoSendPhoneCode =
async function () {

    return await sendPhoneVerificationCode();
};


window.tipecoVerifyPhoneCode =
async function () {

    return await verifyPhoneVerificationCode();
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
   AUTO CONNECT REGISTER FORM
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

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

        const sendPhoneButton =
            document.getElementById(
                "sendPhoneCode"
            );

        if (sendPhoneButton) {

            sendPhoneButton.addEventListener(
                "click",
                sendPhoneVerificationCode
            );
        }

        const verifyPhoneButton =
            document.getElementById(
                "verifyPhoneButton"
            );

        if (verifyPhoneButton) {

            verifyPhoneButton.addEventListener(
                "click",
                verifyPhoneVerificationCode
            );
        }

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

            await reload(user);

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
                    uid: user.uid,

                    email:
                        user.email,

                    emailVerified:
                        user.emailVerified,

                    phoneVerified:
                        profile.phoneVerified === true,

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
   CLEANUP
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        clearRecaptcha();

    }
);


/* =====================================================
   VERSION
===================================================== */

console.log(
    "TIPECO GROUP auth.js v8.0 loaded successfully."
);
