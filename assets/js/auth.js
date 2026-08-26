/* =====================================================
   TIPECO GROUP - AUTHENTICATION JAVASCRIPT
   Version: 3.0
   Multi-User Authentication
   Roles:
   - buyer
   - seller
   - owner

   NOTE:
   This is a frontend prototype.
   Real production authentication should use
   a secure backend and hashed passwords.
===================================================== */


document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       STORAGE KEYS
    ====================================================== */

    const USERS_KEY = "tipecoUsers";
    const CURRENT_USER_KEY = "tipecoCurrentUser";

    const LOGIN_LOCAL_KEY = "tipecoLoggedIn";
    const LOGIN_SESSION_KEY = "tipecoLoggedIn";

    const OLD_USER_KEY = "tipecoUser";

/* =====================================================
   TIPECO OWNER ACCOUNT
   First Owner account
===================================================== */

function ensureOwnerAccount() {

    const users = getUsers();

    const ownerEmail =
        "itangishakatimothy@gmail.com";

    const ownerPhone =
        "+250783884346";

    const ownerExists =
        users.some(function (user) {

            return (
                user.accountType === "owner" ||
                String(user.email).toLowerCase() ===
                ownerEmail.toLowerCase() ||
                String(user.phone) === ownerPhone
            );

        });


    if (ownerExists) {
        return;
    }


    /*
     * Owner account will be activated
     * after a secure password is provided.
     */

}
   /* =====================================================
       HELPER - READ USERS
    ====================================================== */

    function getUsers() {

        const storedUsers =
            localStorage.getItem(USERS_KEY);


        if (!storedUsers) {

            return [];

        }


        try {

            const users =
                JSON.parse(storedUsers);


            if (!Array.isArray(users)) {

                return [];

            }


            return users;

        } catch (error) {

            console.error(
                "Unable to read TIPECO users.",
                error
            );

            return [];

        }

    }


    /* =====================================================
       HELPER - SAVE USERS
    ====================================================== */

    function saveUsers(users) {

        localStorage.setItem(
            USERS_KEY,
            JSON.stringify(users)
        );

    }


    /* =====================================================
       HELPER - CURRENT USER
    ====================================================== */

    function getCurrentUser() {

        const storedUser =
            localStorage.getItem(
                CURRENT_USER_KEY
            );


        if (!storedUser) {

            return null;

        }


        try {

            return JSON.parse(storedUser);

        } catch (error) {

            console.error(
                "Unable to read current TIPECO user.",
                error
            );

            return null;

        }

    }


    /* =====================================================
       HELPER - ROLE LABEL
    ====================================================== */

    function getUserRoleLabel(accountType) {

        switch (accountType) {

            case "buyer":
                return "Buyer / Customer";

            case "seller":
                return "Seller / Service Provider";

            case "owner":
                return "TIPECO Owner";

            case "staff":
                return "TIPECO Staff";

            case "admin":
                return "TIPECO Admin";

            default:
                return "TIPECO User";

        }

    }


    /* =====================================================
       MIGRATE OLD USER
       
       v2.1 stored one user as:
       tipecoUser

       v3.0 stores multiple users as:
       tipecoUsers
    ====================================================== */

    function migrateOldUser() {

        const oldUser =
            localStorage.getItem(
                OLD_USER_KEY
            );


        if (!oldUser) {

            return;

        }


        let parsedOldUser;


        try {

            parsedOldUser =
                JSON.parse(oldUser);

        } catch (error) {

            console.error(
                "Unable to migrate old TIPECO user.",
                error
            );

            return;

        }


        if (
            !parsedOldUser ||
            !parsedOldUser.email
        ) {

            return;

        }


        const users =
            getUsers();


        const exists =
            users.some(function (user) {

                return String(user.email)
                    .toLowerCase() ===
                    String(parsedOldUser.email)
                        .toLowerCase();

            });


        if (!exists) {

            users.push({

                id:
                    "USR-" +
                    Date.now(),

                fullName:
                    parsedOldUser.fullName || "",

                email:
                    parsedOldUser.email || "",

                phone:
                    parsedOldUser.phone || "",

                password:
                    parsedOldUser.password || "",

                accountType:
                    parsedOldUser.accountType === "seller"
                        ? "seller"
                        : "buyer",

                status:
                    "active",

                createdAt:
                    new Date().toISOString()

            });


            saveUsers(users);

        }

    }


    /* =====================================================
       RUN MIGRATION
    ====================================================== */

    migrateOldUser();


    /* =====================================================
       LOGIN FORM
    ====================================================== */

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                /* =================================================
                   GET INPUTS
                ================================================== */

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


                if (
                    !identifierInput ||
                    !passwordInput
                ) {

                    alert(
                        "Login form configuration error."
                    );

                    return;

                }


                /* =================================================
                   VALUES
                ================================================== */

                const identifier =
                    identifierInput.value.trim();


                const password =
                    passwordInput.value;


                if (
                    !identifier ||
                    !password
                ) {

                    alert(
                        "Please enter your email/phone and password."
                    );

                    return;

                }


                /* =================================================
                   GET USERS
                ================================================== */

                const users =
                    getUsers();


                if (users.length === 0) {

                    alert(
                        "No account found. Please create an account first."
                    );

                    return;

                }


                /* =================================================
                   FIND USER
                ================================================== */

                const user =
                    users.find(function (item) {

                        const emailMatches =
                            identifier.toLowerCase() ===
                            String(item.email)
                                .toLowerCase();


                        const phoneMatches =
                            identifier ===
                            String(item.phone);


                        return (
                            emailMatches ||
                            phoneMatches
                        );

                    });


                if (!user) {

                    alert(
                        "Invalid email/phone or password."
                    );

                    return;

                }


                /* =================================================
                   PASSWORD CHECK
                ================================================== */

                if (
                    password !==
                    user.password
                ) {

                    alert(
                        "Invalid email/phone or password."
                    );

                    return;

                }


                /* =================================================
                   ACCOUNT STATUS
                ================================================== */

                if (
                    user.status &&
                    user.status !== "active"
                ) {

                    alert(
                        "This account is not currently active."
                    );

                    return;

                }


                /* =================================================
                   SAVE CURRENT USER
                ================================================== */

                localStorage.setItem(
                    CURRENT_USER_KEY,
                    JSON.stringify(user)
                );


                /* =================================================
                   LOGIN STATE
                ================================================== */

                localStorage.removeItem(
                    LOGIN_LOCAL_KEY
                );

                sessionStorage.removeItem(
                    LOGIN_SESSION_KEY
                );


                if (
                    rememberInput &&
                    rememberInput.checked
                ) {

                    localStorage.setItem(
                        LOGIN_LOCAL_KEY,
                        "true"
                    );

                } else {

                    sessionStorage.setItem(
                        LOGIN_SESSION_KEY,
                        "true"
                    );

                }


                /* =================================================
                   SUCCESS MESSAGE
                ================================================== */

                alert(
                    "Login successful! Welcome to TIPECO GROUP."
                );


                /* =================================================
                   ROLE-BASED REDIRECT
                ================================================== */

                switch (user.accountType) {

                    case "owner":

                        window.location.href =
                            "owner-dashboard.html";

                        break;


                    case "seller":

                        window.location.href =
                            "dashboard.html";

                        break;


                    case "buyer":

                        window.location.href =
                            "dashboard.html";

                        break;


                    default:

                        window.location.href =
                            "dashboard.html";

                }

            }
        );

    }


    /* =====================================================
       REGISTER FORM
       
       PUBLIC REGISTRATION:
       buyer
       seller

       Owner CANNOT be created here.
    ====================================================== */

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
                   GET INPUTS
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
                   VALUES
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
                   REQUIRED
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
                   EMAIL
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
                   PUBLIC ROLE SECURITY
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
                   GET USERS
                ================================================== */

                const users =
                    getUsers();


                /* =================================================
                   DUPLICATE EMAIL
                ================================================== */

                const emailExists =
                    users.some(function (user) {

                        return String(user.email)
                            .toLowerCase() ===
                            email.toLowerCase();

                    });


                if (emailExists) {

                    alert(
                        "An account with this email already exists."
                    );

                    return;

                }


                /* =================================================
                   DUPLICATE PHONE
                ================================================== */

                const phoneExists =
                    users.some(function (user) {

                        return String(user.phone) ===
                            phone;

                    });


                if (phoneExists) {

                    alert(
                        "An account with this phone number already exists."
                    );

                    return;

                }


                /* =================================================
                   CREATE USER
                ================================================== */

                const user = {

                    id:
                        "USR-" +
                        Date.now(),

                    fullName:
                        fullName,

                    email:
                        email,

                    phone:
                        phone,

                    password:
                        password,

                    accountType:
                        accountType,

                    status:
                        "active",

                    createdAt:
                        new Date().toISOString()

                };


                /* =================================================
                   SAVE
                ================================================== */

                users.push(user);


                try {

                    saveUsers(users);

                } catch (error) {

                    alert(
                        "Unable to save account information."
                    );

                    return;

                }


                /* =================================================
                   CLEAR OLD USER STORAGE
                ================================================== */

                localStorage.removeItem(
                    OLD_USER_KEY
                );


                localStorage.removeItem(
                    CURRENT_USER_KEY
                );


                localStorage.removeItem(
                    LOGIN_LOCAL_KEY
                );


                sessionStorage.removeItem(
                    LOGIN_SESSION_KEY
                );


                /* =================================================
                   SUCCESS
                ================================================== */

                alert(
                    "Account created successfully! You can now login."
                );


                window.location.href =
                    "login.html";

            }
        );

    }


    /* =====================================================
       LOGOUT
    ====================================================== */

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
                        CURRENT_USER_KEY
                    );


                    localStorage.removeItem(
                        LOGIN_LOCAL_KEY
                    );


                    sessionStorage.removeItem(
                        LOGIN_SESSION_KEY
                    );


                    window.location.href =
                        "login.html";

                }
            );

        }
    );


    /* =====================================================
       PROTECTED DASHBOARDS
    ====================================================== */

    const currentPage =
        window.location.pathname;


    const isSellerDashboard =
        currentPage.includes(
            "dashboard.html"
        );


    const isOwnerDashboard =
        currentPage.includes(
            "owner-dashboard.html"
        );


    const loggedIn =

        localStorage.getItem(
            LOGIN_LOCAL_KEY
        )

        ||

        sessionStorage.getItem(
            LOGIN_SESSION_KEY
        );


    const currentUser =
        getCurrentUser();


    /* =====================================================
       SELLER / GENERAL DASHBOARD PROTECTION
    ====================================================== */

    if (isSellerDashboard) {

        if (
            loggedIn !== "true" ||
            !currentUser
        ) {

            alert(
                "Please login to access your dashboard."
            );

            window.location.href =
                "login.html";

            return;

        }


        if (
            currentUser.accountType ===
            "owner"
        ) {

            window.location.href =
                "owner-dashboard.html";

            return;

        }

    }


    /* =====================================================
       OWNER DASHBOARD PROTECTION
    ====================================================== */

    if (isOwnerDashboard) {

        if (
            loggedIn !== "true" ||
            !currentUser
        ) {

            alert(
                "Please login to access the Owner Dashboard."
            );

            window.location.href =
                "login.html";

            return;

        }


        if (
            currentUser.accountType !==
            "owner"
        ) {

            alert(
                "Access denied. Owner permissions required."
            );


            window.location.href =
                "dashboard.html";


            return;

        }

    }


    /* =====================================================
       DISPLAY CURRENT USER
    ====================================================== */

    if (currentUser) {


        /* =================================================
           NAME
        ================================================== */

        const userNameElements =
            document.querySelectorAll(
                "[data-user-name]"
            );


        userNameElements.forEach(
            function (element) {

                element.textContent =
                    currentUser.fullName;

            }
        );


        /* =================================================
           EMAIL
        ================================================== */

        const userEmailElements =
            document.querySelectorAll(
                "[data-user-email]"
            );


        userEmailElements.forEach(
            function (element) {

                element.textContent =
                    currentUser.email;

            }
        );


        /* =================================================
           ROLE
        ================================================== */

        const userRoleElements =
            document.querySelectorAll(
                "[data-user-role]"
            );


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


        /* =================================================
           OWNER DASHBOARD NAME
        ================================================== */

        const ownerName =
            document.getElementById(
                "ownerName"
            );


        if (
            ownerName &&
            currentUser.accountType ===
            "owner"
        ) {

            ownerName.textContent =
                currentUser.fullName;

        }


        /* =================================================
           BODY ROLE
        ================================================== */

        document.body.dataset.userRole =
            currentUser.accountType || "";

    }


    /* =====================================================
       FORGOT PASSWORD
    ====================================================== */

    const forgotPasswordForm =
        document.getElementById(
            "forgotPasswordForm"
        );


    if (forgotPasswordForm) {

        forgotPasswordForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const identifierInput =
                    document.getElementById(
                        "resetIdentifier"
                    );


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


                const users =
                    getUsers();


                const user =
                    users.find(function (item) {

                        return (

                            identifier.toLowerCase() ===
                            String(item.email)
                                .toLowerCase()

                            ||

                            identifier ===
                            String(item.phone)

                        );

                    });


                if (!user) {

                    alert(
                        "No account was found with that email or phone number."
                    );

                    return;

                }


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
    ====================================================== */

    const resetPasswordForm =
        document.getElementById(
            "resetPasswordForm"
        );


    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const newPasswordInput =
                    document.getElementById(
                        "newPassword"
                    );


                const confirmNewPasswordInput =
                    document.getElementById(
                        "confirmNewPassword"
                    );


                if (
                    !newPasswordInput ||
                    !confirmNewPasswordInput
                ) {

                    alert(
                        "Reset password form configuration error."
                    );

                    return;

                }


                const newPassword =
                    newPasswordInput.value;


                const confirmNewPassword =
                    confirmNewPasswordInput.value;


                if (
                    !newPassword ||
                    !confirmNewPassword
                ) {

                    alert(
                        "Please enter and confirm your new password."
                    );

                    return;

                }


                if (
                    newPassword.length < 6
                ) {

                    alert(
                        "Password must contain at least 6 characters."
                    );

                    return;

                }


                if (
                    newPassword !==
                    confirmNewPassword
                ) {

                    alert(
                        "Passwords do not match."
                    );

                    return;

                }


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


                const users =
                    getUsers();


                const userIndex =
                    users.findIndex(
                        function (item) {

                            return (

                                resetIdentifier.toLowerCase() ===
                                String(item.email)
                                    .toLowerCase()

                                ||

                                resetIdentifier ===
                                String(item.phone)

                            );

                        }
                    );


                if (userIndex === -1) {

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


                users[userIndex].password =
                    newPassword;


                saveUsers(users);


                localStorage.removeItem(
                    "tipecoResetIdentifier"
                );


                localStorage.removeItem(
                    CURRENT_USER_KEY
                );


                localStorage.removeItem(
                    LOGIN_LOCAL_KEY
                );


                sessionStorage.removeItem(
                    LOGIN_SESSION_KEY
                );


                alert(
                    "Password reset successfully! You can now login with your new password."
                );


                window.location.href =
                    "login.html";

            }
        );

    }

});
