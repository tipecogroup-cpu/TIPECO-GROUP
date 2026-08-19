/* =====================================================
   TIPECO GROUP - AUTHENTICATION JAVASCRIPT
   Version: 1.1
   Frontend Authentication Prototype
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       LOGIN
    ===================================================== */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const identifierInput =
                loginForm.querySelector('[name="login"], [name="identifier"]');

            const passwordInput =
                loginForm.querySelector('[name="password"]');

            const rememberInput =
                loginForm.querySelector('[name="remember"]');

            if (!identifierInput || !passwordInput) {
                alert("Login form configuration error.");
                return;
            }

            const identifier =
                identifierInput.value.trim();

            const password =
                passwordInput.value;

            if (!identifier || !password) {
                alert("Please enter your email/phone and password.");
                return;
            }

            const registeredUser =
                localStorage.getItem("tipecoUser");

            if (!registeredUser) {
                alert("No account found. Please create an account first.");
                return;
            }

            let user;

            try {
                user = JSON.parse(registeredUser);
            } catch (error) {
                alert("Account data is corrupted. Please register again.");
                return;
            }

            const identifierMatches =
                identifier.toLowerCase() ===
                    String(user.email).toLowerCase()
                ||
                identifier === String(user.phone);

            const passwordMatches =
                password === user.password;

            if (!identifierMatches || !passwordMatches) {
                alert("Invalid email/phone or password.");
                return;
            }

            /* SAVE LOGIN STATE */

            localStorage.removeItem("tipecoLoggedIn");
            sessionStorage.removeItem("tipecoLoggedIn");

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

            alert(
                "Login successful! Welcome to TIPECO GROUP."
            );

            window.location.href = "dashboard.html";

        });
    }


    /* =====================================================
       REGISTER / CREATE ACCOUNT
    ===================================================== */

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", function (event) {

            event.preventDefault();

            /* GET FORM INPUTS */

            const fullNameInput =
                document.getElementById("fullName");

            const emailInput =
                document.getElementById("email");

            const phoneInput =
                document.getElementById("phone");

            const passwordInput =
                document.getElementById("password");

            const confirmPasswordInput =
                document.getElementById("confirmPassword");

            const accountTypeInput =
                document.getElementById("accountType");

            const termsInput =
                document.getElementById("terms");


            /* CHECK FORM ELEMENTS */

            if (
                !fullNameInput ||
                !emailInput ||
                !phoneInput ||
                !passwordInput ||
                !confirmPasswordInput ||
                !accountTypeInput ||
                !termsInput
            ) {

                alert(
                    "Registration form configuration error."
                );

                return;
            }


            /* GET VALUES */

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


            /* REQUIRED FIELDS */

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


            /* TERMS */

            if (!termsInput.checked) {

                alert(
                    "Please agree to the Terms & Conditions."
                );

                return;
            }


            /* PASSWORD LENGTH */

            if (password.length < 6) {

                alert(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            /* PASSWORD MATCH */

            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            /* EMAIL CHECK */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                alert(
                    "Please enter a valid email address."
                );

                return;
            }


            /* =================================================
               CREATE USER
            ================================================= */

            const user = {

                fullName: fullName,

                email: email,

                phone: phone,

                password: password,

                accountType: accountType

            };


            /* SAVE USER */

            try {

                localStorage.setItem(
                    "tipecoUser",
                    JSON.stringify(user)
                );

            } catch (error) {

                alert(
                    "Unable to save account information."
                );

                return;
            }


            /* REMOVE OLD LOGIN STATE */

            localStorage.removeItem(
                "tipecoLoggedIn"
            );

            sessionStorage.removeItem(
                "tipecoLoggedIn"
            );


            /* SUCCESS */

            alert(
                "Account created successfully! You can now login."
            );


            /* GO TO LOGIN */

            window.location.href =
                "login.html";

        });
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logoutButtons =
        document.querySelectorAll(
            '[data-action="logout"]'
        );

    logoutButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            localStorage.removeItem(
                "tipecoLoggedIn"
            );

            sessionStorage.removeItem(
                "tipecoLoggedIn"
            );

            window.location.href =
                "login.html";

        });

    });


    /* =====================================================
       PROTECTED DASHBOARD
    ===================================================== */

    const currentPage =
        window.location.pathname;

    const isDashboard =
        currentPage.includes("dashboard.html");

    if (isDashboard) {

        const loggedIn =
            localStorage.getItem("tipecoLoggedIn")
            ||
            sessionStorage.getItem("tipecoLoggedIn");

        if (loggedIn !== "true") {

            alert(
                "Please login to access your dashboard."
            );

            window.location.href =
                "login.html";

            return;
        }
    }


    /* =====================================================
       DISPLAY USER NAME
    ===================================================== */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );

    if (userNameElements.length > 0) {

        const storedUser =
            localStorage.getItem("tipecoUser");

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
                    "Unable to read user data.",
                    error
                );

            }
        }
    }

});
