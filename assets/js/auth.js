/* =========================================================
   TIPECO GROUP - AUTHENTICATION JAVASCRIPT
   Handles:
   - Login
   - Register
   - Forgot Password
   - Logout
   - Basic session handling
========================================================= */

"use strict";

/* =========================================================
   STORAGE KEYS
========================================================= */

const TIPECO_USERS_KEY = "tipeco_users";
const TIPECO_CURRENT_USER_KEY = "tipeco_current_user";


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/* Get registered users */

function getUsers() {

    try {

        return JSON.parse(
            localStorage.getItem(TIPECO_USERS_KEY)
        ) || [];

    } catch (error) {

        console.error("Unable to read users:", error);

        return [];

    }

}


/* Save users */

function saveUsers(users) {

    localStorage.setItem(
        TIPECO_USERS_KEY,
        JSON.stringify(users)
    );

}


/* Get current logged-in user */

function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem(TIPECO_CURRENT_USER_KEY)
        );

    } catch (error) {

        return null;

    }

}


/* Save current user */

function setCurrentUser(user) {

    localStorage.setItem(
        TIPECO_CURRENT_USER_KEY,
        JSON.stringify(user)
    );

}


/* Logout */

function logout() {

    localStorage.removeItem(
        TIPECO_CURRENT_USER_KEY
    );

    window.location.href = "login.html";

}


/* =========================================================
   REGISTER
========================================================= */

function registerUser(event) {

    event.preventDefault();

    const form = event.target;

    const fullName = form.querySelector(
        '[name="fullName"]'
    )?.value.trim();

    const email = form.querySelector(
        '[name="email"]'
    )?.value.trim().toLowerCase();

    const phone = form.querySelector(
        '[name="phone"]'
    )?.value.trim();

    const password = form.querySelector(
        '[name="password"]'
    )?.value;

    const confirmPassword = form.querySelector(
        '[name="confirmPassword"]'
    )?.value;


    /* Validation */

    if (!fullName || !email || !phone || !password) {

        alert(
            "Please complete all required fields."
        );

        return;

    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;

    }


    if (password !== confirmPassword) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    const users = getUsers();


    /* Check existing email */

    const emailExists = users.some(
        user => user.email === email
    );

    if (emailExists) {

        alert(
            "An account with this email already exists."
        );

        return;

    }


    /* Check existing phone */

    const phoneExists = users.some(
        user => user.phone === phone
    );

    if (phoneExists) {

        alert(
            "An account with this phone number already exists."
        );

        return;

    }


    /* Create user */

    const newUser = {

        id:
            "user_" +
            Date.now(),

        fullName: fullName,

        email: email,

        phone: phone,

        password: password,

        role: "service_seeker",

        createdAt:
            new Date().toISOString()

    };


    users.push(newUser);

    saveUsers(users);


    alert(
        "Account created successfully! Please login."
    );


    window.location.href =
        "login.html";

}


/* =========================================================
   LOGIN
========================================================= */

function loginUser(event) {

    event.preventDefault();

    const form = event.target;


    const identifier = form.querySelector(
        '[name="identifier"]'
    )?.value.trim().toLowerCase();

    const password = form.querySelector(
        '[name="password"]'
    )?.value;


    if (!identifier || !password) {

        alert(
            "Please enter your email/phone and password."
        );

        return;

    }


    const users = getUsers();


    const user = users.find(
        item =>

            item.email === identifier ||

            item.phone === identifier
    );


    if (!user) {

        alert(
            "Account not found. Please check your email or phone number."
        );

        return;

    }


    if (user.password !== password) {

        alert(
            "Incorrect password."
        );

        return;

    }


    /* Save logged-in user */

    setCurrentUser({

        id: user.id,

        fullName: user.fullName,

        email: user.email,

        phone: user.phone,

        role: user.role

    });


    alert(
        "Login successful. Welcome back!"
    );


    window.location.href =
        "dashboard.html";

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

function forgotPassword(event) {

    event.preventDefault();

    const form = event.target;


    const identifier = form.querySelector(
        '[name="identifier"]'
    )?.value.trim().toLowerCase();


    if (!identifier) {

        alert(
            "Please enter your email or phone number."
        );

        return;

    }


    const users = getUsers();


    const user = users.find(
        item =>

            item.email === identifier ||

            item.phone === identifier
    );


    if (!user) {

        alert(
            "No account was found with that information."
        );

        return;

    }


    /*
       Temporary frontend recovery flow.

       Real password reset will later use
       backend + email/SMS verification.
    */

    alert(
        "Password reset request received. " +
        "A secure reset system will be connected later."
    );

}


/* =========================================================
   PROTECT DASHBOARD
========================================================= */

function requireLogin() {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


/* =========================================================
   DISPLAY CURRENT USER
========================================================= */

function displayCurrentUser() {

    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    const nameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    nameElements.forEach(
        element => {

            element.textContent =
                user.fullName;

        }
    );


    const emailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    emailElements.forEach(
        element => {

            element.textContent =
                user.email;

        }
    );


    const phoneElements =
        document.querySelectorAll(
            "[data-user-phone]"
        );


    phoneElements.forEach(
        element => {

            element.textContent =
                user.phone;

        }
    );

}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

    const logoutButtons =
        document.querySelectorAll(
            "[data-logout]"
        );


    logoutButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    logout();

                }
            );

        }
    );

}


/* =========================================================
   AUTO AUTH SETUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {


        /* Register form */

        const registerForm =
            document.querySelector(
                "#registerForm"
            );

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                registerUser
            );

        }


        /* Login form */

        const loginForm =
            document.querySelector(
                "#loginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                loginUser
            );

        }


        /* Forgot password form */

        const forgotForm =
            document.querySelector(
                "#forgotPasswordForm"
            );

        if (forgotForm) {

            forgotForm.addEventListener(
                "submit",
                forgotPassword
            );

        }


        /* Display current user */

        displayCurrentUser();


        /* Setup logout */

        setupLogoutButtons();

    }
);
