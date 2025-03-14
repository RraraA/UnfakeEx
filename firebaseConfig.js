// ✅ Ensure Firebase SDK is initialized only once
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyCqZWRApBF5Kzna4EbHJQGJveUE9nEjjRo",
        authDomain: "unfake-d8d9c.firebaseapp.com",
        databaseURL: "https://unfake-d8d9c-default-rtdb.firebaseio.com",
        projectId: "unfake-d8d9c",
        storageBucket: "unfake-d8d9c.appspot.com",
        messagingSenderId: "332199381098",
        appId: "1:332199381098:web:5af91e85108de696602213",
        measurementId: "G-G0QHNLNMZG"
    });
}

// ✅ Make Firebase globally accessible
window.auth = firebase.auth();
window.db = firebase.firestore();
window.provider = new firebase.auth.GoogleAuthProvider();

// ✅ Login Function
window.loginUser = async function () {
    try {
        const result = await auth.signInWithPopup(provider);
        const user = { uid: result.user.uid, email: result.user.email };

        if (chrome.storage) {
            chrome.storage.local.set({ user });
        }
        return user;
    } catch (error) {
        console.error("Login failed", error);
        alert(error.message);
    }
};

// ✅ Logout Function
window.logoutUser = async function () {
    try {
        await auth.signOut();
        if (chrome.storage) {
            chrome.storage.local.remove("user");
        }
    } catch (error) {
        console.error("Logout failed", error);
        alert(error.message);
    }
};

// ✅ Sync Auth State
window.listenForAuthChanges = function (setUser) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userData = { uid: user.uid, email: user.email };
            if (chrome.storage) {
                chrome.storage.local.set({ user: userData });
            }
            setUser(userData);
        } else {
            if (chrome.storage) {
                chrome.storage.local.remove("user");
            }
            setUser(null);
        }
    });
};
