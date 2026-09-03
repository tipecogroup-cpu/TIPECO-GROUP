/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 7.0
   Owner Role Authentication
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
   CONSTANTS
===================================================== */

const OWNER_ROLE = "owner";

const OWNER_DASHBOARD =
    "../owner-dashboard.html";

const DEFAULT_HOME =
    "../index.html";


/* =====================================================
   HELPER
===================================================== */

function showMessage(message) {

    alert(message);

}


/* =====================================================
   GET FIRESTORE USER PROFILE
===================================================== */

async function getUserProfile(user) {

    if (!user) {

        return null;

    }


    const userRef =
        doc(
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

        id:
            snapshot.id,

        ...snapshot.data()

    };

}


/* =====================================================
   CHECK OWNER ROLE
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


    return profile.role === OWNER_ROLE;

}


/* =====================================================
   REGISTER
===================================================== */

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =============================================
               FORM ELEMENTS
            ============================================= */

            const fullNameElement =
                document.getElementById("fullName");

            const emailElement =
                document.getElementById("email");

            const phoneElement =
                document.getElementById("phone");

            const passwordElement =
                document.getElementById("password");

            const confirmPasswordElement =
                document.getElementById("confirmPassword");

            const accountTypeElement =
                document.getElementById("accountType");

            const termsElement =
                document.getElementById("terms");

            const registerButton =
                document.getElementById("registerButton");


            /* =============================================
               VALUES
            ============================================= */

            const fullName =
                fullNameElement.value.trim();

            const email =
                emailElement.value.trim();

            const phone =
                phoneElement.value.trim();

            const password =
                passwordElement.value;

            const confirmPassword =
                confirmPasswordElement.value;

            const accountType =
                accountTypeElement.value;

            const terms =
                termsElement.checked;


            /* =============================================
               VALIDATION
            ============================================= */

            if (
                !fullName ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword ||
                !accountType
            ) {

                showMessage(
                    "Please complete all required fields."
                );

                return;

            }


            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match."
                );

                return;

            }


            if (password.length < 6) {

                showMessage(
                    "Password must contain at least 6 characters."
                );

                return;

            }


            if (!terms) {

                showMessage(
                    "Please agree to the Terms & Conditions."
                );

                return;

            }


            if (registerButton) {

                registerButton.disabled = true;

                registerButton.textContent =
                    "Creating Account...";

            }


            try {

                /* =========================================
                   CREATE FIREBASE AUTH ACCOUNT
                ========================================== */

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                /* =========================================
                   CREATE TIPECO USER PROFILE
                ========================================== */

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        uid:
                            user.uid,

                        fullName:
                            fullName,

                        email:
                            user.email,

                        phone:
                            phone,

                        role:
                            accountType,

                        accountStatus:
                            "pending_verification",

                        emailVerified:
                            false,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                /* =========================================
                   SEND EMAIL VERIFICATION
                ========================================== */

                await sendEmailVerification(user);


                /* =========================================
                   SIGN OUT
                ========================================== */

                await signOut(auth);


                showMessage(
                    "Your TIPECO GROUP account has been created successfully.\n\nA verification email has been sent to:\n" +
                    email +
                    "\n\nPlease open your email and click the verification link before logging in."
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "TIPECO GROUP Registration Error:",
                    error
                );


                switch (error.code) {

                    case "auth/email-already-in-use":

                        showMessage(
                            "This email address is already registered."
                        );

                        break;


                    case "auth/invalid-email":

                        showMessage(
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/weak-password":

                        showMessage(
                            "Your password is too weak. Please create a stronger password."
                        );

                        break;


                    case "auth/network-request-failed":

                        showMessage(
                            "Network error. Please check your internet connection and try again."
                        );

                        break;


                    default:

                        showMessage(
                            "Registration failed.\n\n" +
                            error.message
                        );

                }


                if (registerButton) {

                    registerButton.disabled = false;

                    registerButton.textContent =
                        "Create Account";

                }

            }

        }
    );

}


/* =====================================================
   LOGIN
===================================================== */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const loginElement =
                document.getElementById("login");

            const passwordElement =
                document.getElementById("password");


            if (!loginElement || !passwordElement) {

                showMessage(
                    "Login form configuration error. Please contact TIPECO GROUP support."
                );

                return;

            }


            const email =
                loginElement.value.trim();

            const password =
                passwordElement.value;


            if (!email || !password) {

                showMessage(
                    "Please enter your email and password."
                );

                return;

            }


            try {

                /* =========================================
                   FIREBASE LOGIN
                ========================================== */

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                /* =========================================
                   REFRESH USER
                ========================================== */

                await reload(user);


                /* =========================================
                   EMAIL VERIFICATION
                ========================================== */

                if (!user.emailVerified) {

                    try {

                        await sendEmailVerification(user);

                    } catch (verificationError) {

                        console.warn(
                            "Verification email:",
                            verificationError
                        );

                    }


                    await signOut(auth);


                    showMessage(
                        "Your email has not been verified yet.\n\nPlease check your email and click the TIPECO GROUP verification link before logging in."
                    );

                    return;

                }


                /* =========================================
                   GET FIRESTORE PROFILE
                ========================================== */

                const profile =
                    await getUserProfile(user);


                if (!profile) {

                    await signOut(auth);


                    showMessage(
                        "Your Firebase account exists, but your TIPECO GROUP profile could not be found."
                    );

                    return;

                }


                /* =========================================
                   UPDATE VERIFICATION STATUS
                ========================================== */

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
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


                /* =========================================
                   SAVE SESSION
                ========================================== */

                sessionStorage.setItem(
                    "tipecoAuthenticated",
                    "true"
                );


                sessionStorage.setItem(
                    "tipecoUserId",
                    user.uid
                );


                sessionStorage.setItem(
                    "tipecoRole",
                    profile.role || ""
                );


                /* =========================================
                   OWNER REDIRECT
                ========================================== */

                if (
                    profile.role === OWNER_ROLE
                ) {

                    window.location.href =
                        OWNER_DASHBOARD;

                    return;

                }


                /* =========================================
                   NORMAL USER REDIRECT
                ========================================== */

                window.location.href =
                    DEFAULT_HOME;


            } catch (error) {

                console.error(
                    "TIPECO GROUP Login Error:",
                    error
                );


                switch (error.code) {

                    case "auth/invalid-credential":

                        showMessage(
                            "Invalid email or password."
                        );

                        break;


                    case "auth/user-not-found":

                        showMessage(
                            "No TIPECO GROUP account was found with this email."
                        );

                        break;


                    case "auth/wrong-password":

                        showMessage(
                            "Incorrect password."
                        );

                        break;


                    case "auth/invalid-email":

                        showMessage(
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/too-many-requests":

                        showMessage(
                            "Too many login attempts. Please wait and try again later."
                        );

                        break;


                    case "auth/user-disabled":

                        showMessage(
                            "This account has been disabled."
                        );

                        break;


                    case "auth/network-request-failed":

                        showMessage(
                            "Network error. Please check your internet connection."
                        );

                        break;


                    default:

                        showMessage(
                            "Login failed.\n\n" +
                            error.message
                        );

                }

            }

        }
    );

}


/* =====================================================
   OWNER DASHBOARD PROTECTION
===================================================== */

window.tipecoRequireOwner =
    async function () {

        try {

            const user =
                auth.currentUser;


            if (!user) {

                window.location.href =
                    "../login.html";

                return false;

            }


            await reload(user);


            if (!user.emailVerified) {

                await signOut(auth);

                window.location.href =
                    "../login.html";

                return false;

            }


            const profile =
                await getUserProfile(user);


            if (!profile) {

                await signOut(auth);

                window.location.href =
                    "../login.html";

                return false;

            }


            if (
                profile.role !== OWNER_ROLE
            ) {

                showMessage(
                    "Access denied. Owner authorization is required."
                );


                await signOut(auth);


                window.location.href =
                    "../index.html";

                return false;

            }


            /* =============================================
               OWNER SESSION
            ============================================== */

            sessionStorage.setItem(
                "tipecoAuthenticated",
                "true"
            );


            sessionStorage.setItem(
                "tipecoUserId",
                user.uid
            );


            sessionStorage.setItem(
                "tipecoRole",
                OWNER_ROLE
            );


            return true;

        } catch (error) {

            console.error(
                "TIPECO GROUP Owner Authorization Error:",
                error
            );


            await signOut(auth);


            window.location.href =
                "../login.html";

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


            sessionStorage.removeItem(
                "tipecoAuthenticated"
            );

            sessionStorage.removeItem(
                "tipecoUserId"
            );

            sessionStorage.removeItem(
                "tipecoRole"
            );


            window.location.href =
                "../index.html";


        } catch (error) {

            console.error(
                "TIPECO GROUP Logout Error:",
                error
            );


            showMessage(
                "Logout failed. Please try again."
            );

        }

    };


/* =====================================================
   CURRENT FIREBASE USER
===================================================== */

window.getTipecoCurrentUser =
    function () {

        return auth.currentUser;

    };


/* =====================================================
   GET TIPECO USER PROFILE
===================================================== */

window.getTipecoUserProfile =
    async function () {

        return await getUserProfile(
            auth.currentUser
        );

    };


/* =====================================================
   CHECK OWNER
===================================================== */

window.isTipecoOwner =
    async function () {

        return await isTipecoOwner(
            auth.currentUser
        );

    };


/* =====================================================
   FORGOT PASSWORD
===================================================== */

window.tipecoResetPassword =
    async function (email) {

        if (!email) {

            throw new Error(
                "Email address is required."
            );

        }


        await sendPasswordResetEmail(
            auth,
            email.trim()
        );

    };


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "TIPECO GROUP Firebase user:",
                user.uid
            );

        } else {

            console.log(
                "TIPECO GROUP: No authenticated user."
            );

        }

    }
);
