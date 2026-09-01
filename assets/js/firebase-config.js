/* =====================================================
   TIPECO GROUP - FIREBASE CONFIGURATION
   REAL PROJECT
   Project ID: tipeco-group
===================================================== */


/* =====================================================
   FIREBASE APP
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";


/* =====================================================
   FIREBASE AUTHENTICATION
===================================================== */

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =====================================================
   FIRESTORE DATABASE
===================================================== */

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   FIREBASE ANALYTICS
===================================================== */

import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";


/* =====================================================
   TIPECO GROUP FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyC6732ZWnK21BaGX23k7qom_tokHaeJUpw",

    authDomain:
        "tipeco-group.firebaseapp.com",

    projectId:
        "tipeco-group",

    storageBucket:
        "tipeco-group.firebasestorage.app",

    messagingSenderId:
        "455947277400",

    appId:
        "1:455947277400:web:10a1414d10ccf9af52a62d",

    measurementId:
        "G-853M7YFZ3P"

};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
    initializeApp(firebaseConfig);


/* =====================================================
   INITIALIZE AUTH
===================================================== */

const auth =
    getAuth(app);


/* =====================================================
   INITIALIZE FIRESTORE
===================================================== */

const db =
    getFirestore(app);


/* =====================================================
   INITIALIZE ANALYTICS
===================================================== */

const analytics =
    getAnalytics(app);


/* =====================================================
   EXPORT FIREBASE SERVICES
===================================================== */

export {
    app,
    auth,
    db,
    analytics
};
