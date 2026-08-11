// Firebase Config Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let db = null;
let isFirebaseConnected = false;

// Initialize Firebase with user config stored in LocalStorage
export function initFirebase() {
    const savedConfig = localStorage.getItem('fincontrol_firebase_config');
    if (!savedConfig) {
        console.log("Firebase config not found. Running in LocalStorage mode.");
        return false;
    }

    try {
        const config = JSON.parse(savedConfig);
        const app = initializeApp(config);
        db = getFirestore(app);
        isFirebaseConnected = true;
        console.log("Firebase initialized successfully!");
        return true;
    } catch (e) {
        console.error("Firebase init failed:", e);
        isFirebaseConnected = false;
        return false;
    }
}

export function getDb() {
    return db;
}

export function isConnected() {
    return isFirebaseConnected;
}

export { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc };

