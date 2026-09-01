/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 5.0
===================================================== */


/* =====================================================
   FIREBASE CONFIG
===================================================== */

import { auth, db } from "./firebase-config.js";


/* =====================================================
   FIREBASE AUTH IMPORTS
===================================================== */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail
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
               GET FORM VALUES
            ============================================= */

            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            const accountType =
                document
                    .getElementById("accountType")
                    .value;


            const terms =
                document
                    .getElementById("terms")
                    .checked;


            const registerButton =
                document
                    .getElementById("registerButton");


            /* =============================================
               VALIDATION
            ============================================= */

            if (
                !fullName ||
                !email ||
                !phone ||
                !password ||
                !accountType
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;
            }


            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            if (password.length < 6) {

                alert(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            if (!terms) {

                alert(
                    "Please agree to the Terms & Conditions."
                );

                return;
            }


            /* =============================================
               DISABLE BUTTON
            ============================================= */

            if (registerButton) {

                registerButton.disabled = true;

                registerButton.textContent =
                    "Creating Account...";

            }


            try {

                /* =============================================
                   CREATE FIREBASE ACCOUNT
                ============================================= */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                /* =============================================
                   CREATE FIRESTORE USER PROFILE
                ============================================= */

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        uid: user.uid,

                        fullName: fullName,

                        email: user.email,

                        phone: phone,

                        role: accountType,

                        accountStatus:
                            "pending_verification",

                        emailVerified: false,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                /* =============================================
                   SEND EMAIL VERIFICATION
                ============================================= */

                await sendEmailVerification(user);


                /* =============================================
                   SHOW VERIFICATION MESSAGE
                ============================================= */

                const verificationMessage =
                    document.getElementById(
                        "verificationMessage"
                    );


                if (verificationMessage) {

                    verificationMessage.style.display =
                        "block";

                }


                /* =============================================
                   SUCCESS MESSAGE
                ============================================= */

                alert(
                    "Account created successfully! A verification email has been sent to your email address. Please verify your email before logging in."
                );


                /* =============================================
                   SIGN OUT UNTIL EMAIL IS VERIFIED
                ============================================= */

                await signOut(auth);


                /* =============================================
                   GO TO LOGIN
                ============================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "TIPECO GROUP Registration Error:",
                    error
                );


                switch (error.code) {

                    case "auth/email-already-in-use":

                        alert(
                            "This email is already registered."
                        );

                        break;


                    case "auth/invalid-email":

                        alert(
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/weak-password":

                        alert(
                            "Password is too weak. Please use a stronger password."
                        );

                        break;


                    case "auth/network-request-failed":

                        alert(
                            "Network error. Please check your internet connection and try again."
                        );

                        break;


                    case "permission-denied":

                        alert(
                            "Your account could not be completed because access to the TIPECO profile database was denied."
                        );

                        break;


                    default:

                        alert(
                            "Registration failed. Please try again."
                        );

                }


                /* =============================================
                   ENABLE BUTTON AGAIN
                ============================================= */

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


            /* =============================================
               GET LOGIN FIELDS
            ============================================= */

            const email =
                document
                    .getElementById("loginEmail")
                    ?.value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    ?.value;


            if (!email || !password) {

                alert(
                    "Please enter your email and password."
                );

                return;
            }


            try {

                /* =============================================
                   FIREBASE LOGIN
                ============================================= */

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                /* =============================================
                   EMAIL VERIFICATION CHECK
                ============================================= */

                if (!user.emailVerified) {

                    alert(
                        "Please verify your email address before logging in. Check your inbox for the TIPECO GROUP verification email."
                    );


                    /* =========================================
                       RESEND VERIFICATION EMAIL
                    ========================================= */

                    try {

                        await sendEmailVerification(user);

                    } catch (verificationError) {

                        console.warn(
                            "Verification email could not be resent:",
                            verificationError
                        );

                    }


                    await signOut(auth);

                    return;
                }


                /* =============================================
                   GET FIRESTORE PROFILE
                ============================================= */

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const userSnapshot =
                    await getDoc(userRef);


                if (!userSnapshot.exists()) {

                    alert(
                        "Your Firebase account exists, but your TIPECO GROUP profile could not be found."
                    );


                    await signOut(auth);

                    return;
                }


                const profile =
                    userSnapshot.data();


                console.log(
                    "TIPECO GROUP authenticated user:",
                    profile
                );


                /* =============================================
                   UPDATE VERIFIED STATUS
                ============================================= */

                await setDoc(
                    userRef,
                    {

                        emailVerified: true,

                        accountStatus: "active",

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );


                /* =============================================
                   LOGIN SUCCESS
                ============================================= */

                window.location.href =
                    "../index.html";


            } catch (error) {

                console.error(
                    "TIPECO GROUP Login Error:",
                    error
                );


                switch (error.code) {

                    case "auth/invalid-credential":

                        alert(
                            "Invalid email or password."
                        );

                        break;


                    case "auth/user-not-found":

                        alert(
                            "No TIPECO GROUP account was found with this email."
                        );

                        break;


                    case "auth/wrong-password":

                        alert(
                            "Incorrect password."
                        );

                        break;


                    case "auth/invalid-email":

                        alert(
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/too-many-requests":

                        alert(
                            "Too many login attempts. Please try again later."
                        );

                        break;


                    case "auth/user-disabled":

                        alert(
                            "This account has been disabled."
                        );

                        break;


                    case "auth/network-request-failed":

                        alert(
                            "Network error. Please check your internet connection."
                        );

                        break;


                    default:

                        alert(
                            "Login failed. Please try again."
                        );

                }

            }

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

window.tipecoLogout =
    async function () {

        try {

            await signOut(auth);

            window.location.href =
                "../index.html";

        } catch (error) {

            console.error(
                "TIPECO GROUP Logout Error:",
                error
            );

            alert(
                "Logout failed. Please try again."
            );

        }

    };


/* =====================================================
   GET CURRENT USER
===================================================== */

window.getTipecoCurrentUser =
    function () {

        return auth.currentUser;

    };


/* =====================================================
   GET USER PROFILE
===================================================== */

window.getTipecoUserProfile =
    async function () {

        const user =
            auth.currentUser;


        if (!user) {

            return null;

        }


        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            return null;

        }


        return {

            id: userSnapshot.id,

            ...userSnapshot.data()

        };

    };


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "TIPECO GROUP Firebase Authenticated:",
                user.uid
            );

        } else {

            console.log(
                "TIPECO GROUP Firebase: No authenticated user."
            );

        }

    }
);


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
            email
        );

    };
