import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCqZWRApBF5Kzna4EbHJQGJveUE9nEjjRo",
    authDomain: "unfake-d8d9c.firebaseapp.com",
    databaseURL: "https://unfake-d8d9c-default-rtdb.firebaseio.com",
    projectId: "unfake-d8d9c",
    storageBucket: "unfake-d8d9c.appspot.com",
    messagingSenderId: "332199381098",
    appId: "1:332199381098:web:5af91e85108de696602213",
    measurementId: "G-G0QHNLNMZG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ✅ Login Function
export const loginUser = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = { uid: result.user.uid, email: result.user.email };

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ user });
        }
        return user;
    } catch (error) {
        console.error("Login failed", error);
        throw new Error(error.message);
    }
};

// ✅ Logout Function
export const logoutUser = async () => {
    try {
        await signOut(auth);
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.remove("user");
        }
    } catch (error) {
        console.error("Logout failed", error);
        throw new Error(error.message);
    }
};

// ✅ Sync Auth State
export const listenForAuthChanges = (setUser) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userData = { uid: user.uid, email: user.email };
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ user: userData });
            }
            setUser(userData);
        } else {
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.remove("user");
            }
            setUser(null);
        }
    });
};


export { db, addDoc, collection, auth };