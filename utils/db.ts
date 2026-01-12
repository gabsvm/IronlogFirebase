
import { get, set, del, entries, clear as clearIdb } from 'idb-keyval';
import { auth, db as firestore } from './firebase'; // Import your firebase config
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';

const getUserId = () => auth.currentUser?.uid;

// Helper to get the user's document reference in Firestore
const getUserDocRef = () => {
    const userId = getUserId();
    if (!userId) return null;
    return doc(firestore, 'users', userId);
}

/**
 * Synchronizes the entire local IndexedDB database to Firestore.
 */
export const syncIdbToFirestore = async () => {
    const userDocRef = getUserDocRef();
    if (!userDocRef) return;

    console.log("Syncing local data to Firestore...");
    try {
        const batch = writeBatch(firestore);
        const allEntries = await entries();
        
        const dataToSync: { [key: string]: any } = {};
        allEntries.forEach(([key, value]) => {
            // Firestore keys must be strings. Filter out any non-string keys from idb.
            if (typeof key === 'string') {
                dataToSync[key] = value;
            }
        });

        batch.set(userDocRef, { userData: dataToSync }, { merge: true });
        await batch.commit();
        console.log("Firestore sync complete.");
    } catch (error) {
        console.error("Error syncing to Firestore:", error);
    }
};

/**
 * Downloads all data from the user's Firestore document and saves it to IndexedDB.
 */
export const syncFirestoreToIdb = async () => {
    const userDocRef = getUserDocRef();
    if (!userDocRef) return;

    console.log("Syncing Firestore data to local DB...");
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const firestoreData = docSnap.data()?.userData;
            if (firestoreData) {
                await clearIdb();
                for (const key in firestoreData) {
                    await set(key, firestoreData[key]);
                }
                console.log("Local DB overwritten from Firestore backup.");
            }
        } else {
            console.log("No remote backup found. Syncing local data up.");
            await syncIdbToFirestore();
        }
    } catch (error) {
        console.error("Error syncing from Firestore:", error);
    }
};


export const db = {
    get: async <T>(key: string, defaultValue: T): Promise<T> => {
        try {
            const val = await get<T>(key);
            if (val !== undefined) return val;

            const lsItem = window.localStorage.getItem(key);
            if (lsItem !== null) {
                const parsed = JSON.parse(lsItem);
                await set(key, parsed);
                window.localStorage.removeItem(key);
                return parsed;
            }
            return defaultValue;
        } catch (err) {
            console.error(`DB Get Error (${key}):`, err);
            return defaultValue;
        }
    },

    set: async <T>(key: string, value: T): Promise<void> => {
        try {
            await set(key, value);
            const userDocRef = getUserDocRef();
            if (userDocRef) {
                await setDoc(userDocRef, { 
                    userData: { [key]: value } 
                }, { merge: true });
            }
        } catch (err) {
            console.error(`DB Set Error (${key}):`, err);
        }
    },

    del: async (key: string): Promise<void> => {
        try {
            await del(key);
        } catch (err) {
            console.error(`DB Del Error (${key}):`, err);
        }
    },

    clear: async (): Promise<void> => {
        try {
            await clearIdb();
            console.log("Local database has been cleared.");
        } catch (err) {
            console.error("DB Clear Error:", err);
        }
    },

    syncToCloud: syncIdbToFirestore,
    syncFromCloud: syncFirestoreToIdb,
};
