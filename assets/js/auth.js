/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   Version: 4.1
   REAL PROJECT
===================================================== */

import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   REGISTER
===================================================== */

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const accountType =
            document.getElementById("accountType").value;

        const terms =
            document.getElementById("terms").checked;


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

            alert("Please complete all required fields.");

            return;
        }


        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;
        }


        if (!terms) {

            alert("Please agree to the Terms & Conditions.");

            return;
        }


        if (password.length < 6) {

            alert(
                "Password must contain at least 6 characters."
            );

            return;
        }


        try {

            /* =============================================
               CREATE FIREBASE AUTH ACCOUNT
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
               CREATE FIRESTORE PROFILE
            ============================================= */

            await setDoc(
                doc(db, "users", user.uid),
                {

                    uid: user.uid,

                    fullName: fullName,

                    email: user.email,

                    phone: phone,

                    role: accountType,

                    accountStatus: "active",

                    createdAt: serverTimestamp(),

                    updatedAt: serverTimestamp()

                }
            );


            /* =============================================
               SUCCESS
            ============================================= */

            alert(
                "Welcome to TIPECO GROUP! Your account has been created successfully."
            );


            window.location.href = "../index.html";


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
                        "Password is too weak."
                    );

                    break;


                case "permission-denied":

                    alert(
                        "Account created, but the user profile could not be saved. Please contact TIPECO GROUP support."
                    );

                    break;


                default:

                    alert(
                        "Registration failed. Please try again."
                    );

            }

        }

    });

}


/* =====================================================
   LOGIN
===================================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const emailElement =
            document.getElementById("loginEmail");

        const passwordElement =
            document.getElementById("password");


        if (!emailElement || !passwordElement) {

            console.error(
                "TIPECO GROUP: Login fields not found."
            );

            alert(
                "Login form configuration error."
            );

            return;
        }


        const email =
            emailElement.value.trim();

        const password =
            passwordElement.value;


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


            console.log(
                "TIPECO GROUP Login Successful:",
                user.uid
            );


            /* =============================================
               GET USER PROFILE
            ============================================= */

            const userRef =
                doc(db, "users", user.uid);

            const userSnapshot =
                await getDoc(userRef);


            if (!userSnapshot.exists()) {

                console.warn(
                    "Firebase account exists but Firestore profile is missing."
                );

                alert(
                    "Your account exists, but your TIPECO GROUP profile is incomplete. Please contact support."
                );

                return;
            }


            const profile =
                userSnapshot.data();


            console.log(
                "TIPECO GROUP User Profile:",
                profile
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


                default:

                    alert(
                        "Login failed. Please try again."
                    );

            }

        }

    });

}


/* =====================================================
   LOGOUT
===================================================== */

window.tipecoLogout = async function () {

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

window.getTipecoCurrentUser = function () {

    return auth.currentUser;

};


/* =====================================================
   GET USER PROFILE
===================================================== */

window.getTipecoUserProfile = async function () {

    const user =
        auth.currentUser;


    if (!user) {

        return null;

    }


    const userRef =
        doc(db, "users", user.uid);


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
                "TIPECO GROUP: Authenticated",
                user.uid
            );

        } else {

            console.log(
                "TIPECO GROUP: No authenticated user"
            );

        }

    }
);


/* =====================================================
   FORGOT PASSWORD
===================================================== */

window.tipecoResetPassword = async function (email) {

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
