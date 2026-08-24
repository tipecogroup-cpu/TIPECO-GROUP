/* =====================================================
   TIPECO GROUP - INDEXEDDB STORAGE
   Version: 1.0
   Media Storage
===================================================== */

const TIPECO_DB_NAME = "TIPECO_GROUP_DB";
const TIPECO_DB_VERSION = 1;
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
           CREATE OBJECT STORE
        ================================================== */

        request.onupgradeneeded = function (event) {

            const db = event.target.result;


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
