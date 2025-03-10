document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup loaded!");

    // ✅ Ensure Firebase is initialized
    if (!window.auth || !window.db) {
        console.error("Firebase not initialized. Make sure firebaseConfig.js is loaded first.");
        return;
    }

    // UI Elements
    let signInContainer = document.getElementById("signInContainer");
    let voteSection = document.getElementById("voteSection");
    let emailInput = document.getElementById("emailInput");
    let passwordInput = document.getElementById("passInput");
    let signInBtn = document.getElementById("signInBtn");
    let signOutBtn = document.getElementById("signOutBtn");
    let errorMessage = document.getElementById("errorMessage");

    // 🔍 Debug Firebase Initialization
    console.log("Firebase Apps Loaded:", firebase.apps.length);
    console.log("Auth Object:", window.auth);
    console.log("Firestore Object:", window.db);

    // 🔍 Check user authentication state
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User signed in:", user.email);
            signInContainer.style.display = "none"; 
            voteSection.style.display = "block";
        } else {
            console.log("No user signed in.");
            signInContainer.style.display = "block";
            voteSection.style.display = "none";
        }
    });

    // 🔹 Handle Email/Password Sign-In
    signInBtn.addEventListener("click", () => {
        let email = emailInput.value.trim();
        let password = passwordInput.value.trim();

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                errorMessage.textContent = "";
            })
            .catch(error => {
                console.error("Sign-in error:", error.message);
                errorMessage.textContent = error.message;
            });
    });

    // 🔹 Handle Sign-Out
    signOutBtn.addEventListener("click", () => {
        auth.signOut().then(() => {
            console.log("User signed out.");
        });
    });

    // Close Popup Button
    document.getElementById("closePopup").addEventListener("click", function () {
        window.close();
    });
});
