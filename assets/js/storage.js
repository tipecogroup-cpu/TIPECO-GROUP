/* =====================================================
   TIPECO GROUP - INDEXEDDB STORAGE
   Version: 2.0
   Listings + Media Storage
===================================================== */

const TIPECO_DB_NAME = "TIPECO_GROUP_DB";
const TIPECO_DB_VERSION = 2;

const TIPECO_LISTINGS_STORE = "listings";
const TIPECO_MEDIA_STORE = "listingMedia";


/* =====================================================
   OPEN DATABASE
===================================================== */

function openTipecoDB() {

    return new Promise(function (resolve, reject) {

        const request = indexedDB.open(
            TIPECO_DB_NAME,
            TIPECO_DB_VERSION
        );


        /* =================================================
           DATABASE UPGRADE
        ================================================== */

        request.onupgradeneeded = function (event) {

            const db = event.target.result;


            /* =============================================
               LISTINGS STORE
            ============================================= */

            if (
                !db.objectStoreNames.contains(
                    TIPECO_LISTINGS_STORE
                )
            ) {

                const listingStore =
                    db.createObjectStore(
                        TIPECO_LISTINGS_STORE,
                        {
                            keyPath: "id"
                        }
                    );


                listingStore.createIndex(
                    "ownerEmail",
                    "ownerEmail",
                    {
                        unique: false
                    }
                );


                listingStore.createIndex(
                    "status",
                    "status",
                    {
                        unique: false
                    }
                );


                listingStore.createIndex(
                    "createdAt",
                    "createdAt",
                    {
                        unique: false
                    }
                );

            }


            /* =============================================
               MEDIA STORE
            ============================================= */

            if (
                !db.objectStoreNames.contains(
                    TIPECO_MEDIA_STORE
                )
            ) {

                db.createObjectStore(
                    TIPECO_MEDIA_STORE,
                    {
                        keyPath: "id"
                    }
                );

            }

        };


        /* =================================================
           SUCCESS
        ================================================== */

        request.onsuccess = function () {

            resolve(
                request.result
            );

        };


        /* =================================================
           ERROR
        ================================================== */

        request.onerror = function () {

            reject(
                request.error
            );

        };

    });

}



/* =====================================================
   SAVE LISTING
===================================================== */

async function saveTipecoListing(listingObject) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_LISTINGS_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                TIPECO_LISTINGS_STORE
            );


        const request =
            store.put(
                listingObject
            );


        request.onsuccess = function () {

            resolve(
                listingObject.id
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   GET ONE LISTING
===================================================== */

async function getTipecoListing(listingId) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_LISTINGS_STORE,
                "readonly"
            );


        const store =
            transaction.objectStore(
                TIPECO_LISTINGS_STORE
            );


        const request =
            store.get(
                listingId
            );


        request.onsuccess = function () {

            resolve(
                request.result || null
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   GET ALL LISTINGS
===================================================== */

async function getTipecoListings() {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_LISTINGS_STORE,
                "readonly"
            );


        const store =
            transaction.objectStore(
                TIPECO_LISTINGS_STORE
            );


        const request =
            store.getAll();


        request.onsuccess = function () {

            resolve(
                request.result || []
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   GET LISTINGS BY OWNER
===================================================== */

async function getTipecoListingsByOwner(ownerEmail) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_LISTINGS_STORE,
                "readonly"
            );


        const store =
            transaction.objectStore(
                TIPECO_LISTINGS_STORE
            );


        const index =
            store.index(
                "ownerEmail"
            );


        const request =
            index.getAll(
                ownerEmail
            );


        request.onsuccess = function () {

            resolve(
                request.result || []
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   UPDATE LISTING
===================================================== */

async function updateTipecoListing(listingObject) {

    return saveTipecoListing(
        listingObject
    );

}



/* =====================================================
   DELETE LISTING
===================================================== */

async function deleteTipecoListing(listingId) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_LISTINGS_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                TIPECO_LISTINGS_STORE
            );


        const request =
            store.delete(
                listingId
            );


        request.onsuccess = function () {

            resolve(
                true
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   SAVE MEDIA
===================================================== */

async function saveTipecoMedia(mediaObject) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_MEDIA_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                TIPECO_MEDIA_STORE
            );


        const request =
            store.put(
                mediaObject
            );


        request.onsuccess = function () {

            resolve(
                mediaObject.id
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   GET MEDIA
===================================================== */

async function getTipecoMedia(mediaId) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_MEDIA_STORE,
                "readonly"
            );


        const store =
            transaction.objectStore(
                TIPECO_MEDIA_STORE
            );


        const request =
            store.get(
                mediaId
            );


        request.onsuccess = function () {

            resolve(
                request.result || null
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   DELETE MEDIA
===================================================== */

async function deleteTipecoMedia(mediaId) {

    const db =
        await openTipecoDB();


    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                TIPECO_MEDIA_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                TIPECO_MEDIA_STORE
            );


        const request =
            store.delete(
                mediaId
            );


        request.onsuccess = function () {

            resolve(
                true
            );

        };


        request.onerror = function () {

            reject(
                request.error
            );

        };


        transaction.oncomplete = function () {

            db.close();

        };

    });

}



/* =====================================================
   TEST STORAGE
===================================================== */

async function testTipecoStorage() {

    try {

        const db =
            await openTipecoDB();


        console.log(
            "TIPECO IndexedDB is working correctly.",
            db.name
        );


        console.log(
            "Listings store:",
            db.objectStoreNames.contains(
                TIPECO_LISTINGS_STORE
            )
        );


        console.log(
            "Media store:",
            db.objectStoreNames.contains(
                TIPECO_MEDIA_STORE
            )
        );


        db.close();

        return true;

    } catch (error) {

        console.error(
            "TIPECO IndexedDB error:",
            error
        );

        return false;

    }

}
