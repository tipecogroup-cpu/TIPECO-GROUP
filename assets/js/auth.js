/* =====================================================
   TIPECO GROUP - FIREBASE AUTHENTICATION
   REAL PROJECT
   Version: 9.1

   GENERAL ACCOUNT ARCHITECTURE

   - One General TIPECO GROUP Account
   - Email + Password
   - Mandatory Email Verification
   - Country Required
   - Phone Optional
   - Phone is Contact / Recovery Information Only
   - NO SMS OTP
   - NO Firebase Phone Auth
   - NO Phone reCAPTCHA
   - NO phoneVerified requirement

   ACCOUNT LIFECYCLE

   Register
      ↓
   Firebase Auth Account
      ↓
   Firestore User Profile
      ↓
   Email Verification Required
      ↓
   Email Verified
      ↓
   Account ACTIVE

   SECURITY PRINCIPLE

   - Firebase Auth + Firestore are the source of truth.
   - No localStorage authentication.
   - Subscription != Approval.
   - Owner role is never created from public registration.
   - Phone number is NOT treated as a verified authentication factor.
===================================================== */


/* =====================================================
   FIREBASE IMPORTS
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
    reload,
    deleteUser
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
const GENERAL_USER_ROLE = "user";

const OWNER_DASHBOARD = "owner-dashboard.html";
const DEFAULT_HOME = "../index.html";
const LOGIN_PAGE = "login.html";

const PUBLIC_OWNER_FORBIDDEN = true;


/* =====================================================
   SESSION CONVENIENCE KEYS

   Firebase Auth remains the real source of truth.
   sessionStorage is NOT used as authentication authority.
===================================================== */

const SESSION_AUTHENTICATED =
    "tipecoAuthenticated";

const SESSION_USER_ID =
    "tipecoUserId";

const SESSION_ROLE =
    "tipecoRole";


/* =====================================================
   BASIC UI HELPERS
===================================================== */

function showMessage(
    element,
    message,
    type = "info"
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.dataset.type =
        type;

    element.style.display =
        "block";
}


function hideMessage(
    element
) {

    if (!element) {
        return;
    }

    element.textContent =
        "";

    element.style.display =
        "none";
}


/* =====================================================
   GET STATUS ELEMENT

   Different pages may use different IDs.
   This helper prevents verification messages
   from disappearing because of an ID mismatch.
===================================================== */

function getRegistrationMessageElement() {

    return (
        document.getElementById(
            "registerMessage"
        ) ||
        document.getElementById(
            "emailVerificationStatus"
        )
    );
}


function getVerificationMessageElement() {

    return (
        document.getElementById(
            "emailVerificationStatus"
        ) ||
        document.getElementById(
            "registerMessage"
        )
    );
}


/* =====================================================
   SESSION HELPERS
===================================================== */

function clearTipecoSession() {

    try {

        sessionStorage.removeItem(
            SESSION_AUTHENTICATED
        );

        sessionStorage.removeItem(
            SESSION_USER_ID
        );

        sessionStorage.removeItem(
            SESSION_ROLE
        );

    } catch (error) {

        console.warn(
            "TIPECO session cleanup warning:",
            error
        );
    }
}


function saveTipecoSession(
    user,
    profile
) {

    try {

        sessionStorage.setItem(
            SESSION_AUTHENTICATED,
            "true"
        );

        sessionStorage.setItem(
            SESSION_USER_ID,
            user.uid
        );

        sessionStorage.setItem(
            SESSION_ROLE,
            profile?.role ||
            GENERAL_USER_ROLE
        );

    } catch (error) {

        console.warn(
            "TIPECO session save warning:",
            error
        );
    }
}


/* =====================================================
   FIRESTORE USER PROFILE
===================================================== */

async function getUserProfile(
    uid
) {

    if (!uid) {
        return null;
    }

    const userRef =
        doc(
            db,
            "users",
            uid
        );

    const snapshot =
        await getDoc(
            userRef
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}


/* =====================================================
   OWNER CHECK
===================================================== */

function isTipecoOwner(
    profile
) {

    return (
        profile &&
        profile.role === OWNER_ROLE
    );
}


/* =====================================================
   ACCOUNT STATUS
===================================================== */

function getAccountStatus(
    profile
) {

    return (
        profile?.accountStatus ||
        "unknown"
    );
}


/* =====================================================
   UPDATE USER PROFILE
===================================================== */

async function updateUserProfile(
    uid,
    data
) {

    if (!uid) {

        throw new Error(
            "User UID is required."
        );
    }

    const userRef =
        doc(
            db,
            "users",
            uid
        );

    await setDoc(
        userRef,
        data,
        {
            merge: true
        }
    );
}


/* =====================================================
   COUNTRY CALLING CODES

   Used only when the user enters a local phone
   number without +country-code.

   This does NOT verify the phone number.
===================================================== */

const COUNTRY_CALLING_CODES = {

    Afghanistan: "+93",
    Albania: "+355",
    Algeria: "+213",
    Andorra: "+376",
    Angola: "+244",
    Argentina: "+54",
    Armenia: "+374",
    Australia: "+61",
    Austria: "+43",
    Azerbaijan: "+994",

    Bahamas: "+1",
    Bahrain: "+973",
    Bangladesh: "+880",
    Barbados: "+1",
    Belarus: "+375",
    Belgium: "+32",
    Belize: "+501",
    Benin: "+229",
    Bhutan: "+975",
    Bolivia: "+591",
    Bosnia: "+387",
    Botswana: "+267",
    Brazil: "+55",
    Brunei: "+673",
    Bulgaria: "+359",
    BurkinaFaso: "+226",
    Burundi: "+257",

    Cambodia: "+855",
    Cameroon: "+237",
    Canada: "+1",
    CapeVerde: "+238",
    Chad: "+235",
    Chile: "+56",
    China: "+86",
    Colombia: "+57",
    Comoros: "+269",
    Congo: "+242",
    "Congo, Democratic Republic": "+243",
    CostaRica: "+506",
    Croatia: "+385",
    Cuba: "+53",
    Cyprus: "+357",
    CzechRepublic: "+420",

    Denmark: "+45",
    Djibouti: "+253",
    Dominica: "+1",
    DominicanRepublic: "+1",

    Ecuador: "+593",
    Egypt: "+20",
    ElSalvador: "+503",
    EquatorialGuinea: "+240",
    Eritrea: "+291",
    Estonia: "+372",
    Eswatini: "+268",
    Ethiopia: "+251",

    Fiji: "+679",
    Finland: "+358",
    France: "+33",

    Gabon: "+241",
    Gambia: "+220",
    Georgia: "+995",
    Germany: "+49",
    Ghana: "+233",
    Greece: "+30",
    Grenada: "+1",
    Guatemala: "+502",
    Guinea: "+224",
    GuineaBissau: "+245",
    Guyana: "+592",

    Haiti: "+509",
    Honduras: "+504",
    Hungary: "+36",

    Iceland: "+354",
    India: "+91",
    Indonesia: "+62",
    Iran: "+98",
    Iraq: "+964",
    Ireland: "+353",
    Israel: "+972",
    Italy: "+39",
    IvoryCoast: "+225",

    Jamaica: "+1",
    Japan: "+81",
    Jordan: "+962",

    Kazakhstan: "+7",
    Kenya: "+254",
    Kiribati: "+686",
    Kuwait: "+965",
    Kyrgyzstan: "+996",

    Laos: "+856",
    Latvia: "+371",
    Lebanon: "+961",
    Lesotho: "+266",
    Liberia: "+231",
    Libya: "+218",
    Liechtenstein: "+423",
    Lithuania: "+370",
    Luxembourg: "+352",

    Madagascar: "+261",
    Malawi: "+265",
    Malaysia: "+60",
    Maldives: "+960",
    Mali: "+223",
    Malta: "+356",
    MarshallIslands: "+692",
    Mauritania: "+222",
    Mauritius: "+230",
    Mexico: "+52",
    Micronesia: "+691",
    Moldova: "+373",
    Monaco: "+377",
    Mongolia: "+976",
    Montenegro: "+382",
    Morocco: "+212",
    Mozambique: "+258",
    Myanmar: "+95",

    Namibia: "+264",
    Nauru: "+674",
    Nepal: "+977",
    Netherlands: "+31",
    NewZealand: "+64",
    Nicaragua: "+505",
    Niger: "+227",
    Nigeria: "+234",
    NorthKorea: "+850",
    NorthMacedonia: "+389",
    Norway: "+47",

    Oman: "+968",

    Pakistan: "+92",
    Palau: "+680",
    Palestine: "+970",
    Panama: "+507",
    PapuaNewGuinea: "+675",
    Paraguay: "+595",
    Peru: "+51",
    Philippines: "+63",
    Poland: "+48",
    Portugal: "+351",

    Qatar: "+974",

    Romania: "+40",
    Russia: "+7",
    Rwanda: "+250",

    SaintKittsAndNevis: "+1",
    SaintLucia: "+1",
    SaintVincentAndTheGrenadines: "+1",
    Samoa: "+685",
    SanMarino: "+378",
    SaoTomeAndPrincipe: "+239",
    SaudiArabia: "+966",
    Senegal: "+221",
    Serbia: "+381",
    Seychelles: "+248",
    SierraLeone: "+232",
    Singapore: "+65",
    Slovakia: "+421",
    Slovenia: "+386",
    SolomonIslands: "+677",
    Somalia: "+252",
    SouthAfrica: "+27",
    SouthKorea: "+82",
    SouthSudan: "+211",
    Spain: "+34",
    SriLanka: "+94",
    Sudan: "+249",
    Suriname: "+597",
    Sweden: "+46",
    Switzerland: "+41",
    Syria: "+963",

    Taiwan: "+886",
    Tajikistan: "+992",
    Tanzania: "+255",
    Thailand: "+66",
    TimorLeste: "+670",
    Togo: "+228",
    Tonga: "+676",
    TrinidadAndTobago: "+1",
    Tunisia: "+216",
    Turkey: "+90",
    Turkmenistan: "+993",
    Tuvalu: "+688",

    Uganda: "+256",
    Ukraine: "+380",
    UnitedArabEmirates: "+971",
    UnitedKingdom: "+44",
    UnitedStates: "+1",
    Uruguay: "+598",
    Uzbekistan: "+998",

    Vanuatu: "+678",
    VaticanCity: "+39",
    Venezuela: "+58",
    Vietnam: "+84",

    Yemen: "+967",

    Zambia: "+260",
    Zimbabwe: "+263"
};


/* =====================================================
   FIND COUNTRY CALLING CODE

   Supports:
   - Exact country names
   - Country values using spaces
   - Country values using hyphens
   - Country values using underscores
   - Country values already containing +code
===================================================== */

function getCountryCallingCode(
    country
) {

    if (!country) {
        return "";
    }

    const value =
        String(country)
            .trim();

    if (
        /^\+\d{1,4}$/.test(
            value
        )
    ) {

        return value;
    }

    const normalizedKey =
        value
            .replace(
                /[\s\-&,'.()]/g,
                ""
            )
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            );

    if (
        COUNTRY_CALLING_CODES[
            normalizedKey
        ]
    ) {

        return COUNTRY_CALLING_CODES[
            normalizedKey
        ];
    }

    /* ---------------------------------------------
       Common country-name variations
    --------------------------------------------- */

    const aliases = {

        "UnitedStatesofAmerica":
            "+1",

        "USA":
            "+1",

        "UK":
            "+44",

        "UnitedKingdomofGreatBritainandNorthernIreland":
            "+44",

        "DemocraticRepublicoftheCongo":
            "+243",

        "DRC":
            "+243",

        "RepublicoftheCongo":
            "+242",

        "IvoryCoast":
            "+225",

        "CotedIvoire":
            "+225",

        "Czechia":
            "+420",

        "Eswatini":
            "+268",

        "Swaziland":
            "+268"
    };

    return (
        aliases[
            normalizedKey
        ] ||
        ""
    );
}


/* =====================================================
   PHONE NORMALIZATION

   Phone is OPTIONAL.

   This function only converts a phone number into
   international format.

   It does NOT verify ownership of the number.
===================================================== */

function normalizePhoneNumber(
    country,
    phone
) {

    if (!phone) {
        return "";
    }

    let cleaned =
        String(phone)
            .trim()
            .replace(
                /[\s().-]/g,
                ""
            );

    if (!cleaned) {
        return "";
    }


    /* ---------------------------------------------
       Already international
    --------------------------------------------- */

    if (
        cleaned.startsWith("+")
    ) {

        return cleaned;
    }


    /* ---------------------------------------------
       International format using 00
    --------------------------------------------- */

    if (
        cleaned.startsWith("00")
    ) {

        return (
            "+" +
            cleaned.substring(2)
        );
    }


    /* ---------------------------------------------
       Remove local trunk zero(s)
    --------------------------------------------- */

    cleaned =
        cleaned.replace(
            /^0+/,
            ""
        );


    if (!cleaned) {
        return "";
    }


    /* ---------------------------------------------
       Get country calling code
    --------------------------------------------- */

    const countryCode =
        getCountryCallingCode(
            country
        );


    /*
       If country code is unknown, do not invent one.

       The user can instead enter an international
       number beginning with +.
    */

    if (!countryCode) {

        return cleaned;
    }


    return (
        countryCode +
        cleaned
    );
}


/* =====================================================
   OPTIONAL PHONE VALIDATION

   This validates format only.

   It does NOT mean the phone is verified.
===================================================== */

function validateE164Phone(
    phone
) {

    if (!phone) {
        return true;
    }

    return /^\+[1-9]\d{7,14}$/.test(
        phone
    );
}


/* =====================================================
   FIREBASE ERROR MESSAGE
===================================================== */

function getFirebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";

    switch (code) {

        case "auth/invalid-email":
            return "The email address is invalid.";

        case "auth/email-already-in-use":
            return "This email address is already registered.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/too-many-requests":
            return "Too many requests. Please wait and try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/operation-not-allowed":
            return "This authentication method is not enabled in Firebase.";

        case "auth/requires-recent-login":
            return "Please log in again and retry.";

        case "auth/expired-action-code":
            return "This verification or reset link has expired.";

        case "auth/invalid-action-code":
            return "This verification or reset link is invalid or has already been used.";

        case "auth/user-token-expired":
            return "Your session has expired. Please log in again.";

        case "auth/invalid-verification-code":
            return "The verification code is invalid.";

        case "auth/invalid-verification-id":
            return "The verification request is invalid.";

        default:
            return (
                error?.message ||
                "An unexpected authentication error occurred."
            );
    }
}


/* =====================================================
   CREATE REGISTRATION ACCOUNT
===================================================== */

async function createRegistrationAccount(
    registrationData
) {

    const {
        fullName,
        email,
        country,
        phone,
        password
    } = registrationData;


    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (!fullName) {

        throw new Error(
            "Full name is required."
        );
    }

    if (!email) {

        throw new Error(
            "Email address is required."
        );
    }

    if (!country) {

        throw new Error(
            "Country is required."
        );
    }

    if (!password) {

        throw new Error(
            "Password is required."
        );
    }


    /* =================================================
       OPTIONAL PHONE

       IMPORTANT:
       Normalize exactly ONCE here.
    ================================================= */

    let normalizedPhone = "";

    if (phone) {

        normalizedPhone =
            normalizePhoneNumber(
                country,
                phone
            );

        if (
            !validateE164Phone(
                normalizedPhone
            )
        ) {

            throw new Error(
                "Please enter a valid international phone number."
            );
        }
    }


    /* =================================================
       CREATE FIREBASE AUTH USER
    ================================================= */

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    const user =
        credential.user;


    /* =================================================
       CREATE FIRESTORE PROFILE

       IMPORTANT:
       Public registration can ONLY create
       the GENERAL USER role.

       It can NEVER create owner.
    ================================================= */

    const profileData = {

        uid:
            user.uid,

        fullName:
            fullName,

        email:
            user.email ||
            email,

        country:
            country,

        role:
            GENERAL_USER_ROLE,

        accountStatus:
            "pending_verification",

        emailVerified:
            false,

        phone:
            normalizedPhone,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()
    };


    /* =================================================
       CREATE FIRESTORE PROFILE

       If Firestore fails immediately after account
       creation, attempt to remove the newly-created
       Auth account so we do not intentionally leave
       an orphan account behind.
    ================================================= */

    try {

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            profileData,
            {
                merge: false
            }
        );

    } catch (firestoreError) {

        console.error(
            "TIPECO Firestore profile creation error:",
            firestoreError
        );

        try {

            await deleteUser(
                user
            );

        } catch (deleteError) {

            console.error(
                "TIPECO orphan Auth account cleanup error:",
                deleteError
            );
        }

        throw firestoreError;
    }


    return user;
}


/* =====================================================
   REGISTRATION
===================================================== */

async function handleRegistration(
    event
) {

    if (event) {
        event.preventDefault();
    }

    const form =
        event?.currentTarget ||
        document.getElementById(
            "registerForm"
        );

    if (!form) {
        return;
    }


    /* =================================================
       INPUTS
    ================================================= */

    const fullName =
        document.getElementById(
            "fullName"
        )?.value
            ?.trim() || "";


    const email =
        document.getElementById(
            "email"
        )?.value
            ?.trim()
            .toLowerCase() || "";


    const country =
        document.getElementById(
            "country"
        )?.value
            ?.trim() || "";


    const phoneRaw =
        document.getElementById(
            "phone"
        )?.value
            ?.trim() || "";


    const password =
        document.getElementById(
            "password"
        )?.value || "";


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value || "";


    const terms =
        document.getElementById(
            "terms"
        )?.checked || false;


    const statusElement =
        getRegistrationMessageElement();


    /* =================================================
       VALIDATION
    ================================================= */

    if (!fullName) {

        showMessage(
            statusElement,
            "Please enter your full name.",
            "error"
        );

        return;
    }


    if (!email) {

        showMessage(
            statusElement,
            "Please enter your email address.",
            "error"
        );

        return;
    }


    if (!country) {

        showMessage(
            statusElement,
            "Please select your country.",
            "error"
        );

        return;
    }


    if (
        !password ||
        password.length < 6
    ) {

        showMessage(
            statusElement,
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            statusElement,
            "Passwords do not match.",
            "error"
        );

        return;
    }


    if (!terms) {

        showMessage(
            statusElement,
            "Please accept the Terms and Conditions.",
            "error"
        );

        return;
    }


    /* =================================================
       OPTIONAL PHONE VALIDATION

       Normalize ONCE here so the user gets an early
       validation message.

       createRegistrationAccount receives the RAW
       phone and normalizes it again internally.
       This is intentional validation consistency,
       not double-storage normalization.
    ================================================= */

    if (phoneRaw) {

        const normalizedPhoneForValidation =
            normalizePhoneNumber(
                country,
                phoneRaw
            );


        if (
            !validateE164Phone(
                normalizedPhoneForValidation
            )
        ) {

            showMessage(
                statusElement,
                "Please enter a valid international phone number, or leave the phone field empty.",
                "error"
            );

            return;
        }
    }


    /* =================================================
       REGISTRATION
    ================================================= */

    const registerButton =
        document.getElementById(
            "registerButton"
        ) ||
        document.getElementById(
            "createAccountButton"
        );


    try {

        if (registerButton) {

            registerButton.disabled =
                true;
        }


        showMessage(
            statusElement,
            "Creating your TIPECO GROUP account...",
            "info"
        );


        /* =============================================
           CREATE FIREBASE ACCOUNT + PROFILE
        ============================================= */

        const user =
            await createRegistrationAccount(
                {
                    fullName,
                    email,
                    country,
                    phone:
                        phoneRaw,
                    password
                }
            );


        /* =============================================
           EMAIL VERIFICATION
        ============================================= */

        try {

            await sendEmailVerification(
                user
            );

        } catch (verificationError) {

            console.error(
                "TIPECO verification email error:",
                verificationError
            );

            /*
               Keep the account/profile because the user
               may retry sending verification later.

               The account remains pending_verification.
            */

            showMessage(
                statusElement,
                "Your account was created, but the verification email could not be sent. Please try again later.",
                "error"
            );

            clearTipecoSession();

            return;
        }


        /* =============================================
           KEEP PROFILE PENDING

           The account must remain pending until Firebase
           confirms emailVerified === true.
        ============================================= */

        await updateUserProfile(
            user.uid,
            {

                emailVerified:
                    false,

                accountStatus:
                    "pending_verification",

                updatedAt:
                    serverTimestamp()
            }
        );


        /* =============================================
           SUCCESS
        ============================================= */

        showMessage(
            statusElement,
            "Account created successfully. Please check your email and click the verification link before logging in.",
            "success"
        );


        const emailVerificationSection =
            document.getElementById(
                "emailVerificationSection"
            );


        if (
            emailVerificationSection
        ) {

            emailVerificationSection.style.display =
                "block";
        }


        clearTipecoSession();


    } catch (error) {

        console.error(
            "TIPECO registration error:",
            error
        );


        showMessage(
            statusElement,
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );


    } finally {

        if (registerButton) {

            registerButton.disabled =
                false;
        }
    }
}


/* =====================================================
   EMAIL VERIFICATION
===================================================== */

async function verifyEmailAddress() {

    const statusElement =
        getVerificationMessageElement();


    try {

        const user =
            auth.currentUser;


        if (!user) {

            showMessage(
                statusElement,
                "Please complete registration first.",
                "error"
            );

            return false;
        }


        /* =============================================
           REFRESH FIREBASE AUTH STATE
        ============================================= */

        await reload(
            user
        );


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            showMessage(
                statusElement,
                "Your Firebase session could not be found. Please register or log in again.",
                "error"
            );

            return false;
        }


        /* =============================================
           EMAIL CHECK ONLY

           Phone verification is NOT required.
        ============================================= */

        if (
            currentUser.emailVerified !== true
        ) {

            showMessage(
                statusElement,
                "Your email is not verified yet. Open the verification email and click the verification link.",
                "error"
            );

            return false;
        }


        /* =============================================
           UPDATE FIRESTORE

           Email verification is complete.
           Account becomes ACTIVE.
        ============================================= */

        await updateUserProfile(
            currentUser.uid,
            {

                emailVerified:
                    true,

                accountStatus:
                    "active",

                updatedAt:
                    serverTimestamp()
            }
        );


        showMessage(
            statusElement,
            "Your email has been verified successfully. Your TIPECO GROUP account is now active.",
            "success"
        );


        clearTipecoSession();


        await signOut(
            auth
        );


        setTimeout(
            () => {

                window.location.href =
                    LOGIN_PAGE;

            },
            1200
        );


        return true;


    } catch (error) {

        console.error(
            "TIPECO email verification error:",
            error
        );


        showMessage(
            statusElement,
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );


        return false;
    }
}


/* =====================================================
   LOGIN
===================================================== */

async function handleLogin(
    event
) {

    if (event) {
        event.preventDefault();
    }


    const email =
        document.getElementById(
            "login"
        )?.value
            ?.trim()
            .toLowerCase() || "";


    const password =
        document.getElementById(
            "password"
        )?.value || "";


    const statusElement =
        document.getElementById(
            "loginStatus"
        ) ||
        document.getElementById(
            "loginMessage"
        );


    if (
        !email ||
        !password
    ) {

        showMessage(
            statusElement,
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    try {

        showMessage(
            statusElement,
            "Signing you in...",
            "info"
        );


        /* =============================================
           FIREBASE LOGIN
        ============================================= */

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        await reload(
            user
        );


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            throw new Error(
                "Unable to access the Firebase account."
            );
        }


        /* =============================================
           EMAIL VERIFICATION REQUIRED
        ============================================= */

        if (
            currentUser.emailVerified !== true
        ) {

            showMessage(
                statusElement,
                "Please verify your email before logging in.",
                "error"
            );


            await signOut(
                auth
            );


            clearTipecoSession();


            return;
        }


        /* =============================================
           FIRESTORE PROFILE
        ============================================= */

        const profile =
            await getUserProfile(
                currentUser.uid
            );


        if (!profile) {

            await signOut(
                auth
            );

            clearTipecoSession();


            showMessage(
                statusElement,
                "Your TIPECO GROUP profile could not be found.",
                "error"
            );


            return;
        }


        /* =============================================
           BLOCKED / SUSPENDED
        ============================================= */

        const status =
            getAccountStatus(
                profile
            );


        if (
            status === "blocked" ||
            status === "suspended"
        ) {

            await signOut(
                auth
            );

            clearTipecoSession();


            showMessage(
                statusElement,
                "Your TIPECO GROUP account is currently blocked or suspended.",
                "error"
            );


            return;
        }


        /* =============================================
           EMAIL VERIFIED = ACTIVE

           No phone verification required.
        ============================================= */

        if (
            profile.emailVerified !== true ||
            profile.accountStatus !== "active"
        ) {

            await updateUserProfile(
                currentUser.uid,
                {

                    emailVerified:
                        true,

                    accountStatus:
                        "active",

                    updatedAt:
                        serverTimestamp()
                }
            );


            profile.emailVerified =
                true;

            profile.accountStatus =
                "active";
        }


        /* =============================================
           SAVE SESSION CONVENIENCE DATA
        ============================================= */

        saveTipecoSession(
            currentUser,
            profile
        );


        /* =============================================
           OWNER DASHBOARD
        ============================================= */

        if (
            isTipecoOwner(
                profile
            )
        ) {

            window.location.href =
                OWNER_DASHBOARD;

            return;
        }


        /* =============================================
           GENERAL USERS
        ============================================= */

        window.location.href =
            DEFAULT_HOME;


    } catch (error) {

        console.error(
            "TIPECO login error:",
            error
        );


        clearTipecoSession();


        showMessage(
            statusElement,
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );
    }
}


/* =====================================================
   OWNER AUTHORIZATION
===================================================== */

window.tipecoRequireOwner =
async function () {

    return new Promise(
        (resolve) => {

            let completed =
                false;


            const finish =
                (result) => {

                    if (
                        completed
                    ) {
                        return;
                    }


                    completed =
                        true;


                    resolve(
                        result
                    );
                };


            let unsubscribe =
                () => {};


            unsubscribe =
                onAuthStateChanged(
                    auth,
                    async (user) => {

                        /* =================================
                           NO USER
                        ================================= */

                        if (!user) {

                            unsubscribe();

                            clearTipecoSession();


                            window.location.href =
                                LOGIN_PAGE;


                            finish(
                                false
                            );


                            return;
                        }


                        try {

                            /* =============================
                               REFRESH AUTH STATE
                            ============================= */

                            await reload(
                                user
                            );


                            const currentUser =
                                auth.currentUser;


                            if (!currentUser) {

                                unsubscribe();

                                clearTipecoSession();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               EMAIL VERIFICATION
                            ============================= */

                            if (
                                currentUser.emailVerified !==
                                true
                            ) {

                                await signOut(
                                    auth
                                );

                                unsubscribe();

                                clearTipecoSession();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               FIRESTORE PROFILE
                            ============================= */

                            const profile =
                                await getUserProfile(
                                    currentUser.uid
                                );


                            if (!profile) {

                                await signOut(
                                    auth
                                );

                                unsubscribe();

                                clearTipecoSession();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               OWNER ROLE
                            ============================= */

                            if (
                                !isTipecoOwner(
                                    profile
                                )
                            ) {

                                if (
                                    PUBLIC_OWNER_FORBIDDEN
                                ) {

                                    await signOut(
                                        auth
                                    );

                                    unsubscribe();

                                    clearTipecoSession();


                                    window.location.href =
                                        DEFAULT_HOME;


                                    finish(
                                        false
                                    );


                                    return;
                                }
                            }


                            /* =============================
                               ACCOUNT STATUS
                            ============================= */

                            const status =
                                getAccountStatus(
                                    profile
                                );


                            if (
                                status === "blocked" ||
                                status === "suspended"
                            ) {

                                await signOut(
                                    auth
                                );

                                unsubscribe();

                                clearTipecoSession();


                                window.location.href =
                                    LOGIN_PAGE;


                                finish(
                                    false
                                );


                                return;
                            }


                            /* =============================
                               OWNER ACCOUNT ACTIVE

                               Email verification only.
                               No phone verification.
                            ============================= */

                            if (
                                profile.emailVerified !==
                                    true ||
                                profile.accountStatus !==
                                    "active"
                            ) {

                                await updateUserProfile(
                                    currentUser.uid,
                                    {

                                        emailVerified:
                                            true,

                                        accountStatus:
                                            "active",

                                        updatedAt:
                                            serverTimestamp()
                                    }
                                );


                                profile.emailVerified =
                                    true;

                                profile.accountStatus =
                                    "active";
                            }


                            /* =============================
                               SESSION
                            ============================= */

                            saveTipecoSession(
                                currentUser,
                                profile
                            );


                            unsubscribe();


                            finish(
                                {
                                    user:
                                        currentUser,

                                    profile:
                                        profile
                                }
                            );


                        } catch (error) {

                            console.error(
                                "TIPECO owner authorization error:",
                                error
                            );


                            unsubscribe();


                            try {

                                await signOut(
                                    auth
                                );

                            } catch (
                                signOutError
                            ) {

                                console.warn(
                                    "TIPECO owner sign-out warning:",
                                    signOutError
                                );
                            }


                            clearTipecoSession();


                            window.location.href =
                                LOGIN_PAGE;


                            finish(
                                false
                            );
                        }
                    }
                );
        }
    );
};


/* =====================================================
   LOGOUT
===================================================== */

window.tipecoLogout =
async function () {

    try {

        clearTipecoSession();


        await signOut(
            auth
        );


        window.location.href =
            LOGIN_PAGE;


    } catch (error) {

        console.error(
            "TIPECO logout error:",
            error
        );
    }
};


/* =====================================================
   RESET PASSWORD

   EMAIL ONLY
===================================================== */

window.tipecoResetPassword =
async function (
    email
) {

    const normalizedEmail =
        String(
            email || ""
        )
            .trim()
            .toLowerCase();


    if (!normalizedEmail) {

        throw new Error(
            "Email address is required."
        );
    }


    await sendPasswordResetEmail(
        auth,
        normalizedEmail
    );


    return true;
};


/* =====================================================
   CURRENT USER
===================================================== */

window.tipecoGetCurrentUser =
function () {

    return auth.currentUser;
};


/* =====================================================
   CURRENT PROFILE
===================================================== */

window.tipecoGetCurrentProfile =
async function () {

    const user =
        auth.currentUser;


    if (!user) {
        return null;
    }


    return await getUserProfile(
        user.uid
    );
};


/* =====================================================
   OWNER CHECK
===================================================== */

window.tipecoIsOwner =
async function () {

    const user =
        auth.currentUser;


    if (!user) {
        return false;
    }


    const profile =
        await getUserProfile(
            user.uid
        );


    return isTipecoOwner(
        profile
    );
};


/* =====================================================
   EMAIL VERIFICATION BRIDGE
===================================================== */

window.tipecoVerifyEmail =
async function () {

    return await verifyEmailAddress();
};


/* =====================================================
   REGISTRATION BRIDGE
===================================================== */

window.tipecoRegister =
async function (
    event
) {

    return await handleRegistration(
        event
    );
};


/* =====================================================
   LOGIN BRIDGE
===================================================== */

window.tipecoLogin =
async function (
    event
) {

    return await handleLogin(
        event
    );
};


/* =====================================================
   AUTO CONNECT FORMS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* =============================================
           REGISTER FORM
        ============================================= */

        const registerForm =
            document.getElementById(
                "registerForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegistration
            );
        }


        /* =============================================
           LOGIN FORM
        ============================================= */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        /* =============================================
           EMAIL VERIFICATION BUTTON

           If register.html already has inline
           onclick="window.tipecoVerifyEmail()",
           do NOT attach a second listener.

           This prevents double verification calls.
        ============================================= */

        const verifyEmailButton =
            document.getElementById(
                "verifyEmailButton"
            );


        if (verifyEmailButton) {

            const inlineHandler =
                verifyEmailButton.getAttribute(
                    "onclick"
                );


            if (!inlineHandler) {

                verifyEmailButton.addEventListener(
                    "click",
                    verifyEmailAddress
                );
            }
        }
    }
);


/* =====================================================
   AUTH STATE INFORMATION

   Informational only.

   It does NOT grant authentication authority.
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {
            return;
        }


        try {

            await reload(
                user
            );


            const profile =
                await getUserProfile(
                    user.uid
                );


            if (!profile) {

                console.warn(
                    "TIPECO: Authenticated user has no Firestore profile."
                );


                return;
            }


            console.log(
                "TIPECO Auth State:",
                {

                    uid:
                        user.uid,

                    email:
                        user.email,

                    emailVerified:
                        user.emailVerified,

                    country:
                        profile.country,

                    accountStatus:
                        profile.accountStatus,

                    role:
                        profile.role
                }
            );


        } catch (error) {

            console.error(
                "TIPECO auth state error:",
                error
            );
        }
    }
);


/* =====================================================
   VERSION
===================================================== */

console.log(
    "TIPECO GROUP auth.js v9.1 loaded successfully."
);
