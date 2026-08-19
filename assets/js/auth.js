/* =====================================================
   TIPECO GROUP - AUTHENTICATION JAVASCRIPT
   Version: 1.0
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


            const identifierInput =
                loginForm.querySelector('[name="identifier"]');

            const passwordInput =
                loginForm.querySelector('[name="password"]');

            const rememberInput =
                loginForm.querySelector('[name="remember"]');


            const identifier =
                identifierInput.value.trim();

            const password =
                passwordInput.value;


            /* =========================================
               BASIC VALIDATION
            ========================================= */

            if (!identifier || !password) {

                alert(
                    "Please enter your email/phone and password."
                );

                return;
            }


            /* =========================================
               GET REGISTERED USER
            ========================================= */

            const registeredUser =
                localStorage.getItem("tipecoUser");


            if (!registeredUser) {

                alert(
                    "No account found. Please create an account first."
                );

                return;
            }


            const user =
                JSON.parse(registeredUser);


            /* =========================================
               CHECK LOGIN DETAILS
            ========================================= */

            const identifierMatches =
                identifier.toLowerCase() ===
                    user.email.toLowerCase()
                ||
                identifier === user.phone;


            const passwordMatches =
                password === user.password;


            if (!identifierMatches || !passwordMatches) {

                alert(
                    "Invalid email/phone or password."
                );

                return;
            }


            /* =========================================
               SAVE LOGIN STATE
            ========================================= */

            if (rememberInput && rememberInput.checked) {

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


            /* =========================================
               SUCCESS
            ========================================= */

            alert(
                "Login successful! Welcome to TIPECO GROUP."
            );


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


                /* =====================================
                   REQUIRED FIELDS
                ===================================== */

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


                /* =====================================
                   TERMS
                ===================================== */

                if (!termsInput.checked) {

                    alert(
                        "Please agree to the Terms & Conditions."
                    );

                    return;
                }


                /* =====================================
                   PASSWORD LENGTH
                ===================================== */

                if (password.length < 6) {

                    alert(
                        "Password must contain at least 6 characters."
                    );

                    return;
                }


                /* =====================================
                   PASSWORD MATCH
                ===================================== */

                if (password !== confirmPassword) {

                    alert(
                        "Passwords do not match."
                    );

                    return;
                }


                /* =====================================
                   CREATE USER OBJECT
                ===================================== */

                const user = {

                    fullName: fullName,

                    email: email,

                    phone: phone,

                    password: password,

                    accountType: accountType

                };


                /* =====================================
                   SAVE USER
                ===================================== */

                localStorage.setItem(
                    "tipecoUser",
                    JSON.stringify(user)
                );


                /* =====================================
                   SUCCESS
                ===================================== */

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


                localStorage.removeItem(
                    "tipecoLoggedIn"
                );


                sessionStorage.removeItem(
                    "tipecoLoggedIn"
                );


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

            const user =
                JSON.parse(storedUser);


            userNameElements.forEach(
                function (element) {

                    element.textContent =
                        user.fullName;

                }
            );

        }

    }

});
