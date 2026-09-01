/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   Version: 4.0
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

        if (!fullName || !email || !phone || !password || !accountType) {

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

            alert("Password must contain at least 6 characters.");

            return;
        }


        try {

            /* =============================================
               CREATE FIREBASE AUTH USER
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


            /* =============================================
               FIREBASE ERROR HANDLING
            ============================================= */

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
                        "Account created, but the profile could not be saved. Please contact TIPECO GROUP support."
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

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        if (!email || !password) {

            alert("Please enter your email and password.");

            return;
        }


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            window.location.href = "../index.html";


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
                        "No account was found with this email."
                    );

                    break;


                case "auth/wrong-password":

                    alert(
                        "Incorrect password."
                    );

                    break;


                case "auth/too-many-requests":

                    alert(
                        "Too many attempts. Please try again later."
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

        window.location.href = "../index.html";

    } catch (error) {

        console.error(
            "TIPECO GROUP Logout Error:",
            error
        );

    }

};


/* =====================================================
   CURRENT USER
===================================================== */

window.getTipecoCurrentUser = function () {

    return auth.currentUser;

};


/* =====================================================
   USER PROFILE
===================================================== */

window.getTipecoUserProfile = async function () {

    const user = auth.currentUser;

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

onAuthStateChanged(auth, async function (user) {

    if (user) {

        console.log(
            "TIPECO GROUP authenticated:",
            user.uid
        );

    } else {

        console.log(
            "TIPECO GROUP: No authenticated user."
        );

    }

});


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
