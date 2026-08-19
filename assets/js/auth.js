/* =====================================================
   TIPECO GROUP - AUTHENTICATION JAVASCRIPT
   Version: 1.1
   Frontend Authentication Prototype
===================================================== */


/* =====================================================
   PAGE READY
===================================================== */

document.addEventListener("DOMContentLoaded", function () {


    /* =================================================
       LOGIN FORM
    ================================================= */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();


            /* -----------------------------------------
               GET LOGIN INPUTS
            ----------------------------------------- */

            const loginInput =
                loginForm.querySelector('[name="login"]');

            const passwordInput =
                loginForm.querySelector('[name="password"]');

            const rememberInput =
                loginForm.querySelector('[name="remember"]');


            if (!loginInput || !passwordInput) {

                console.error(
                    "Login form fields were not found."
                );

                return;
            }


            const login =
                loginInput.value.trim();

            const password =
                passwordInput.value;


            /* -----------------------------------------
               BASIC VALIDATION
            ----------------------------------------- */

            if (!login || !password) {

                alert(
                    "Please enter your email/phone and password."
                );

                return;
            }


            /* -----------------------------------------
               GET REGISTERED USER
            ----------------------------------------- */

            const registeredUser =
                localStorage.getItem("tipecoUser");


            if (!registeredUser) {

                alert(
                    "No account found. Please create an account first."
                );

                return;
            }


            let user;

            try {

                user = JSON.parse(registeredUser);

            } catch (error) {

                console.error(
                    "Invalid user data:",
                    error
                );

                alert(
                    "There is a problem with your account data. Please register again."
                );

                localStorage.removeItem("tipecoUser");

                return;
            }


            /* -----------------------------------------
               CHECK LOGIN DETAILS
            ----------------------------------------- */

            const identifierMatches =

                login.toLowerCase() ===
                    String(user.email).toLowerCase()

                ||

                login ===
                    String(user.phone);


            const passwordMatches =
                password === user.password;


            if (!identifierMatches || !passwordMatches) {

                alert(
                    "Invalid email/phone or password."
                );

                return;
            }


            /* -----------------------------------------
               SAVE LOGIN STATE
            ----------------------------------------- */

            if (
                rememberInput &&
                rememberInput.checked
            ) {

                localStorage.setItem(
                    "tipecoLoggedIn",
                    "true"
                );

            } else {

                sessionStorage.setItem(
                    "tipecoLoggedIn",
                    "true"
                );

            }


            /* -----------------------------------------
               LOGIN SUCCESS
            ----------------------------------------- */

            alert(
                "Login successful! Welcome to TIPECO GROUP."
            );


            /*
             * Dashboard is inside /pages/
             * Login is also inside /pages/
             */

            window.location.href =
                "dashboard.html";

        });

    }



    /* =================================================
       REGISTER FORM
    ================================================= */

    const registerForm =
        document.getElementById("registerForm");


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                /* -------------------------------------
                   GET FORM INPUTS
                ------------------------------------- */

                const fullNameInput =
                    registerForm.querySelector(
                        '[name="fullName"]'
                    );


                const emailInput =
                    registerForm.querySelector(
                        '[name="email"]'
                    );


                const phoneInput =
                    registerForm.querySelector(
                        '[name="phone"]'
                    );


                const passwordInput =
                    registerForm.querySelector(
                        '[name="password"]'
                    );


                const confirmPasswordInput =
                    registerForm.querySelector(
                        '[name="confirmPassword"]'
                    );


                const accountTypeInput =
                    registerForm.querySelector(
                        '[name="accountType"]'
                    );


                const termsInput =
                    registerForm.querySelector(
                        '[name="terms"]'
                    );


                /* -------------------------------------
                   SAFETY CHECK
                ------------------------------------- */

                if (
                    !fullNameInput ||
                    !emailInput ||
                    !phoneInput ||
                    !passwordInput ||
                    !confirmPasswordInput ||
                    !accountTypeInput ||
                    !termsInput
                ) {

                    console.error(
                        "One or more registration fields are missing."
                    );

                    return;
                }


                /* -------------------------------------
                   GET VALUES
                ------------------------------------- */

                const fullName =
                    fullNameInput.value.trim();


                const email =
                    emailInput.value.trim();


                const phone =
                    phoneInput.value.trim();


                const password =
                    passwordInput.value;


                const confirmPassword =
                    confirmPasswordInput.value;


                const accountType =
                    accountTypeInput.value;


                /* -------------------------------------
                   REQUIRED FIELDS
                ------------------------------------- */

                if (
                    !fullName ||
                    !email ||
                    !phone ||
                    !password ||
                    !confirmPassword ||
                    !accountType
                ) {

                    alert(
                        "Please complete all required fields."
                    );

                    return;
                }


                /* -------------------------------------
                   TERMS & CONDITIONS
                ------------------------------------- */

                if (!termsInput.checked) {

                    alert(
                        "Please agree to the Terms & Conditions."
                    );

                    return;
                }


                /* -------------------------------------
                   PASSWORD LENGTH
                ------------------------------------- */

                if (password.length < 6) {

                    alert(
                        "Password must contain at least 6 characters."
                    );

                    return;
                }


                /* -------------------------------------
                   PASSWORD MATCH
                ------------------------------------- */

                if (password !== confirmPassword) {

                    alert(
                        "Passwords do not match."
                    );

                    return;
                }


                /* -------------------------------------
                   CHECK EXISTING ACCOUNT
                ------------------------------------- */

                const existingUser =
                    localStorage.getItem(
                        "tipecoUser"
                    );


                if (existingUser) {

                    try {

                        const oldUser =
                            JSON.parse(existingUser);


                        if (
                            oldUser.email &&
                            oldUser.email.toLowerCase() ===
                                email.toLowerCase()
                        ) {

                            alert(
                                "An account with this email already exists."
                            );

                            return;
                        }


                        if (
                            oldUser.phone &&
                            oldUser.phone === phone
                        ) {

                            alert(
                                "An account with this phone number already exists."
                            );

                            return;
                        }

                    } catch (error) {

                        console.warn(
                            "Old user data could not be read."
                        );

                    }

                }


                /* -------------------------------------
                   CREATE USER
                ------------------------------------- */

                const user = {

                    fullName: fullName,

                    email: email,

                    phone: phone,

                    password: password,

                    accountType: accountType

                };


                /* -------------------------------------
                   SAVE USER
                ------------------------------------- */

                try {

                    localStorage.setItem(
                        "tipecoUser",
                        JSON.stringify(user)
                    );

                } catch (error) {

                    console.error(
                        "Could not save user:",
                        error
                    );

                    alert(
                        "Unable to create the account. Please try again."
                    );

                    return;
                }


                /* -------------------------------------
                   CLEAR LOGIN STATES
                ------------------------------------- */

                localStorage.removeItem(
                    "tipecoLoggedIn"
                );


                sessionStorage.removeItem(
                    "tipecoLoggedIn"
                );


                /* -------------------------------------
                   REGISTER SUCCESS
                ------------------------------------- */

                alert(
                    "Account created successfully! You can now login."
                );


                window.location.href =
                    "login.html";

            }
        );

    }



    /* =================================================
       LOGOUT
    ================================================= */

    const logoutButtons =
        document.querySelectorAll(
            '[data-action="logout"]'
        );


    logoutButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                /* -------------------------------------
                   REMOVE LOGIN STATES
                ------------------------------------- */

                localStorage.removeItem(
                    "tipecoLoggedIn"
                );


                sessionStorage.removeItem(
                    "tipecoLoggedIn"
                );


                /* -------------------------------------
                   GO TO LOGIN
                ------------------------------------- */

                window.location.href =
                    "login.html";

            }
        );

    });



    /* =================================================
       PROTECTED DASHBOARD
    ================================================= */

    const currentPage =
        window.location.pathname;


    const isDashboard =
        currentPage.includes(
            "dashboard.html"
        );


    if (isDashboard) {

        const loggedIn =

            localStorage.getItem(
                "tipecoLoggedIn"
            )

            ||

            sessionStorage.getItem(
                "tipecoLoggedIn"
            );


        if (loggedIn !== "true") {

            alert(
                "Please login to access your dashboard."
            );


            window.location.href =
                "login.html";

        }

    }



    /* =================================================
       DISPLAY USER NAME
    ================================================= */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    if (userNameElements.length > 0) {

        const storedUser =
            localStorage.getItem(
                "tipecoUser"
            );


        if (storedUser) {

            try {

                const user =
                    JSON.parse(storedUser);


                userNameElements.forEach(
                    function (element) {

                        element.textContent =
                            user.fullName;

                    }
                );

            } catch (error) {

                console.error(
                    "Could not load user information:",
                    error
                );

            }

        }

    }



    /* =================================================
       GOOGLE BUTTON - FRONTEND PLACEHOLDER
    ================================================= */

    const googleButtons =
        document.querySelectorAll(
            ".google-btn"
        );


    googleButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                alert(
                    "Google Sign-In will be connected when the backend authentication system is added."
                );

            }
        );

    });

});
