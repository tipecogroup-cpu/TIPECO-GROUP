/* =====================================================
   TIPECO GROUP - FIREBASE CONFIGURATION
   Real Production Backend
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6732ZWnK21BaGX23k7qom_tokHaeJUpw",
    authDomain: "tipeco-group.firebaseapp.com",
    projectId: "tipeco-group",
    storageBucket: "tipeco-group.firebasestorage.app",
    messagingSenderId: "455947277400",
    appId: "1:455947277400:web:10a1414d10ccf9af52a62d"
};

/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

/* =====================================================
   FIREBASE AUTHENTICATION
===================================================== */

const auth = getAuth(app);

/* =====================================================
   CLOUD FIRESTORE
===================================================== */

const db = getFirestore(app);

/* =====================================================
   EXPORT
===================================================== */

export {
    app,
    auth,
    db
};
