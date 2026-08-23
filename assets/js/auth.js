/* =====================================================
   TIPECO GROUP - AUTHENTICATION JAVASCRIPT
   Version: 2.0
   Frontend Authentication Prototype
===================================================== */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function getStoredUser() {

        const storedUser =
            localStorage.getItem("tipecoUser");

        if (!storedUser) {
            return null;
        }

        try {

            return JSON.parse(storedUser);

        } catch (error) {

            console.error(
                "Unable to read TIPECO user data.",
                error
            );

            return null;
        }
    }


    function getUserRoleLabel(accountType) {

        switch (accountType) {

            case "buyer":
                return "Buyer / Customer";

            case "seller":
                return "Seller / Agent / Service Provider";

            case "staff":
                return "TIPECO Staff";

            case "admin":
                return "TIPECO Admin";

            default:
                return "TIPECO User";
        }
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const identifierInput =
                    loginForm.querySelector(
                        '[name="login"], [name="identifier"]'
                    );

                const passwordInput =
                    loginForm.querySelector(
                        '[name="password"]'
                    );

                const rememberInput =
                    loginForm.querySelector(
                        '[name="remember"]'
                    );


                /* FORM CHECK */

                if (
                    !identifierInput ||
                    !passwordInput
                ) {

                    alert(
                        "Login form configuration error."
                    );

                    return;
                }


                /* GET VALUES */

                const identifier =
                    identifierInput.value.trim();

                const password =
                    passwordInput.value;


                /* REQUIRED FIELDS */

                if (
                    !identifier ||
                    !password
                ) {

                    alert(
                        "Please enter your email/phone and password."
                    );

                    return;
                }


                /* GET REGISTERED USER */

                const registeredUser =
                    localStorage.getItem(
                        "tipecoUser"
                    );


                if (!registeredUser) {

                    alert(
                        "No account found. Please create an account first."
                    );

                    return;
                }


                let user;


                try {

                    user =
                        JSON.parse(
                            registeredUser
                        );

                } catch (error) {

                    alert(
                        "Account data is corrupted. Please register again."
                    );

                    return;
                }


                /* IDENTIFIER CHECK */

                const identifierMatches =

                    identifier.toLowerCase() ===
                    String(user.email)
                        .toLowerCase()

                    ||

                    identifier ===
                    String(user.phone);


                /* PASSWORD CHECK */

                const passwordMatches =
                    password === user.password;


                if (
                    !identifierMatches ||
                    !passwordMatches
                ) {

                    alert(
                        "Invalid email/phone or password."
                    );

                    return;
                }


                /* =================================================
                   SAVE LOGIN STATE
                ================================================== */

                localStorage.removeItem(
                    "tipecoLoggedIn"
                );

                sessionStorage.removeItem(
                    "tipecoLoggedIn"
                );


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


                /* SUCCESS */

                alert(
                    "Login successful! Welcome to TIPECO GROUP."
                );


                /* GO TO DASHBOARD */

                window.location.href =
                    "dashboard.html";

            }
        );
    }



    /* =====================================================
       REGISTER / CREATE ACCOUNT
    ===================================================== */

    const registerForm =
        document.getElementById(
            "registerForm"
        );


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                /* =================================================
                   GET FORM INPUTS
                ================================================== */

                const fullNameInput =
                    document.getElementById(
                        "fullName"
                    );

                const emailInput =
                    document.getElementById(
                        "email"
                    );

                const phoneInput =
                    document.getElementById(
                        "phone"
                    );

                const passwordInput =
                    document.getElementById(
                        "password"
                    );

                const confirmPasswordInput =
                    document.getElementById(
                        "confirmPassword"
                    );

                const accountTypeInput =
                    document.getElementById(
                        "accountType"
                    );

                const termsInput =
                    document.getElementById(
                        "terms"
                    );


                /* =================================================
                   CHECK FORM ELEMENTS
                ================================================== */

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


                /* =================================================
                   GET VALUES
                ================================================== */

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


                /* =================================================
                   REQUIRED FIELDS
                ================================================== */

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


                /* =================================================
                   TERMS
                ================================================== */

                if (!termsInput.checked) {

                    alert(
                        "Please agree to the Terms & Conditions."
                    );

                    return;
                }


                /* =================================================
                   PASSWORD LENGTH
                ================================================== */

                if (
                    password.length < 6
                ) {

                    alert(
                        "Password must contain at least 6 characters."
                    );

                    return;
                }


                /* =================================================
                   PASSWORD MATCH
                ================================================== */

                if (
                    password !==
                    confirmPassword
                ) {

                    alert(
                        "Passwords do not match."
                    );

                    return;
                }


                /* =================================================
                   EMAIL CHECK
                ================================================== */

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


                if (
                    !emailPattern.test(email)
                ) {

                    alert(
                        "Please enter a valid email address."
                    );

                    return;
                }


                /* =================================================
                   ROLE SECURITY
                   
                   PUBLIC REGISTRATION ONLY ALLOWS:
                   buyer
                   seller

                   staff/admin MUST NOT be selectable
                   through public registration.
                ================================================== */

                if (

                    accountType !== "buyer" &&
                    accountType !== "seller"

                ) {

                    alert(
                        "Invalid account type."
                    );

                    return;
                }


                /* =================================================
                   CREATE USER
                ================================================== */

                const user = {

                    fullName:
                        fullName,

                    email:
                        email,

                    phone:
                        phone,

                    password:
                        password,

                    accountType:
                        accountType

                };


                /* =================================================
                   SAVE USER
                ================================================== */

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


                /* =================================================
                   REMOVE OLD LOGIN STATE
                ================================================== */

                localStorage.removeItem(
                    "tipecoLoggedIn"
                );

                sessionStorage.removeItem(
                    "tipecoLoggedIn"
                );


                /* =================================================
                   SUCCESS
                ================================================== */

                alert(
                    "Account created successfully! You can now login."
                );


                /* =================================================
                   GO TO LOGIN
                ================================================== */

                window.location.href =
                    "login.html";

            }
        );
    }

/* =====================================================
   FORGOT PASSWORD
===================================================== */

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const identifierInput =
                document.getElementById("resetIdentifier");

            if (!identifierInput) {

                alert(
                    "Forgot password form configuration error."
                );

                return;
            }

            const identifier =
                identifierInput.value.trim();

            if (!identifier) {

                alert(
                    "Please enter your email or phone number."
                );

                return;
            }

            const user = getStoredUser();

            if (!user) {

                alert(
                    "No account found. Please create an account first."
                );

                return;
            }

            const emailMatches =
                identifier.toLowerCase() ===
                String(user.email).toLowerCase();

            const phoneMatches =
                identifier ===
                String(user.phone);

            if (!emailMatches && !phoneMatches) {

                alert(
                    "No account was found with that email or phone number."
                );

                return;
            }

            /*
             * TEMPORARY FRONTEND PROTOTYPE
             *
             * The real version will use
             * email/SMS verification through a backend.
             */

            localStorage.setItem(
                "tipecoResetIdentifier",
                identifier
            );

            alert(
                "Account found. You can now reset your password."
            );

            window.location.href =
                "reset-password.html";

        }
    );
}
/* =====================================================
   RESET PASSWORD
===================================================== */

const resetPasswordForm =
    document.getElementById("resetPasswordForm");

if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* =================================================
               GET FORM INPUTS
            ================================================== */

            const newPasswordInput =
                document.getElementById("newPassword");

            const confirmNewPasswordInput =
                document.getElementById("confirmNewPassword");


            /* =================================================
               FORM CONFIGURATION CHECK
            ================================================== */

            if (
                !newPasswordInput ||
                !confirmNewPasswordInput
            ) {

                alert(
                    "Reset password form configuration error."
                );

                return;
            }


            /* =================================================
               GET VALUES
            ================================================== */

            const newPassword =
                newPasswordInput.value;

            const confirmNewPassword =
                confirmNewPasswordInput.value;


            /* =================================================
               REQUIRED FIELDS
            ================================================== */

            if (
                !newPassword ||
                !confirmNewPassword
            ) {

                alert(
                    "Please enter and confirm your new password."
                );

                return;
            }


            /* =================================================
               PASSWORD LENGTH
            ================================================== */

            if (newPassword.length < 6) {

                alert(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            /* =================================================
               PASSWORD MATCH
            ================================================== */

            if (
                newPassword !==
                confirmNewPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            /* =================================================
               GET RESET IDENTIFIER
            ================================================== */

            const resetIdentifier =
                localStorage.getItem(
                    "tipecoResetIdentifier"
                );


            if (!resetIdentifier) {

                alert(
                    "Password reset session expired. Please start again."
                );

                window.location.href =
                    "forgot-password.html";

                return;
            }


            /* =================================================
               GET STORED USER
            ================================================== */

            const user =
                getStoredUser();


            if (!user) {

                alert(
                    "No account found. Please create an account first."
                );

                window.location.href =
                    "register.html";

                return;
            }


            /* =================================================
               VERIFY RESET IDENTIFIER
            ================================================== */

            const emailMatches =
                resetIdentifier.toLowerCase() ===
                String(user.email).toLowerCase();

            const phoneMatches =
                resetIdentifier ===
                String(user.phone);


            if (
                !emailMatches &&
                !phoneMatches
            ) {

                alert(
                    "The password reset request is no longer valid."
                );

                localStorage.removeItem(
                    "tipecoResetIdentifier"
                );

                window.location.href =
                    "forgot-password.html";

                return;
            }


            /* =================================================
               UPDATE PASSWORD
            ================================================== */

            user.password =
                newPassword;


            /* =================================================
               SAVE UPDATED USER
            ================================================== */

            try {

                localStorage.setItem(
                    "tipecoUser",
                    JSON.stringify(user)
                );

            } catch (error) {

                alert(
                    "Unable to update your password."
                );

                return;
            }


            /* =================================================
               REMOVE RESET SESSION
            ================================================== */

            localStorage.removeItem(
                "tipecoResetIdentifier"
            );


            /* =================================================
               CLEAR OLD LOGIN STATE
            ================================================== */

            localStorage.removeItem(
                "tipecoLoggedIn"
            );

            sessionStorage.removeItem(
                "tipecoLoggedIn"
            );


            /* =================================================
               SUCCESS
            ================================================== */

            alert(
                "Password reset successfully! You can now login with your new password."
            );


            /* =================================================
               GO TO LOGIN
            ================================================== */

            window.location.href =
                "login.html";

        }
    );
}

/* =====================================================
   ADD LISTING
===================================================== */

const addListingForm =
    document.getElementById("addListingForm");

if (addListingForm) {
console.log("ADD LISTING FORM FOUND");
    addListingForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const listingTitle =
                document.getElementById("listingTitle").value.trim();

            const listingCategory =
                document.getElementById("listingCategory").value;

            const listingType =
                document.getElementById("listingType").value;

            const listingPrice =
                document.getElementById("listingPrice").value;

            const listingLocation =
                document.getElementById("listingLocation").value.trim();

            const listingDescription =
                document.getElementById("listingDescription").value.trim();

            const listingPhone =
                document.getElementById("listingPhone").value.trim();

            const listingAgreement =
                document.getElementById("listingAgreement");


            /* =================================================
               REQUIRED FIELDS
            ================================================== */

            if (
                !listingTitle ||
                !listingCategory ||
                !listingType ||
                !listingPrice ||
                !listingLocation ||
                !listingDescription ||
                !listingPhone
            ) {

                alert(
                    "Please complete all required listing information."
                );

                return;
            }


            /* =================================================
               AGREEMENT
            ================================================== */

            if (!listingAgreement.checked) {

                alert(
                    "Please confirm that the information provided is accurate."
                );

                return;
            }


            /* =================================================
               CURRENT USER
            ================================================== */

            const currentUser =
                getStoredUser();

            if (!currentUser) {

                alert(
                    "Please login before creating a listing."
                );

                window.location.href =
                    "login.html";

                return;
            }


            /* =================================================
               CREATE LISTING
            ================================================== */

            const listing = {

                id:
                    "listing-" +
                    Date.now(),

                ownerName:
                    currentUser.fullName,

                ownerEmail:
                    currentUser.email,

                ownerPhone:
                    currentUser.phone,

                title:
                    listingTitle,

                category:
                    listingCategory,

                type:
                    listingType,

                price:
                    listingPrice,

                location:
                    listingLocation,

                description:
                    listingDescription,

                contactPhone:
                    listingPhone,

                status:
                    "pending",

                createdAt:
                    new Date().toISOString()

            };


            /* =================================================
               GET EXISTING LISTINGS
            ================================================== */

            let listings = [];

            const storedListings =
                localStorage.getItem(
                    "tipecoListings"
                );


            if (storedListings) {

                try {

                    listings =
                        JSON.parse(
                            storedListings
                        );

                } catch (error) {

                    listings = [];

                }
            }


            /* =================================================
               ADD NEW LISTING
            ================================================== */

            listings.push(listing);


            /* =================================================
               SAVE LISTINGS
            ================================================== */

            try {

                localStorage.setItem(
                    "tipecoListings",
                    JSON.stringify(listings)
                );

            } catch (error) {

                alert(
                    "Unable to save your listing."
                );

                return;
            }


            /* =================================================
               SUCCESS
            ================================================== */

            alert(
                "Listing submitted successfully! It is now pending TIPECO GROUP verification."
            );


            /* =================================================
               GO TO MY LISTINGS
            ================================================== */

            window.location.href =
                "my-listings.html";

        }
    );
}   /* =====================================================
       LOGOUT
    ===================================================== */

    const logoutButtons =
        document.querySelectorAll(
            '[data-action="logout"]'
        );


    logoutButtons.forEach(
        function (button) {

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

        }
    );



    /* =====================================================
       PROTECTED DASHBOARD
    ===================================================== */

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


        if (
            loggedIn !== "true"
        ) {

            alert(
                "Please login to access your dashboard."
            );

            window.location.href =
                "login.html";

            return;
        }
    }



    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    const currentUser =
        getStoredUser();



    /* =====================================================
       DISPLAY USER NAME
    ===================================================== */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    if (
        userNameElements.length > 0 &&
        currentUser
    ) {

        userNameElements.forEach(
            function (element) {

                element.textContent =
                    currentUser.fullName;

            }
        );
    }



    /* =====================================================
       DISPLAY USER EMAIL
    ===================================================== */

    const userEmailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    if (
        userEmailElements.length > 0 &&
        currentUser
    ) {

        userEmailElements.forEach(
            function (element) {

                element.textContent =
                    currentUser.email;

            }
        );
    }



    /* =====================================================
       DISPLAY USER ROLE
    ===================================================== */

    const userRoleElements =
        document.querySelectorAll(
            "[data-user-role]"
        );


    if (
        userRoleElements.length > 0 &&
        currentUser
    ) {

        const roleLabel =
            getUserRoleLabel(
                currentUser.accountType
            );


        userRoleElements.forEach(
            function (element) {

                element.textContent =
                    roleLabel;

            }
        );
    }



    /* =====================================================
       STORE CURRENT ROLE
       
       This makes the current role easy to use
       in future dashboard features.
    ===================================================== */

    if (currentUser) {

        document.body.dataset.userRole =
            currentUser.accountType || "";

    }

});
