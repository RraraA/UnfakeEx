chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const apiKey = "AIzaSyCqZWRApBF5Kzna4EbHJQGJveUE9nEjjRo";

    if (request.action === "signIn") {
        fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: request.email,
                password: request.password,
                returnSecureToken: true
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.idToken) {
                // Fetch user details to get the UID
                fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: data.idToken })
                })
                .then(res => res.json())
                .then(userData => {
                    if (userData.users && userData.users.length > 0) {
                        const userUid = userData.users[0].localId; // Get UID
    
                        // 🔹 Store UID in Chrome storage
                        chrome.storage.local.set({ 
                            user: { email: data.email, idToken: data.idToken, uid: userUid },
                            userUid: userUid
                        });
    
                        console.log(`[DEBUG] Stored UID: ${userUid}`);
    
                        sendResponse({ success: true, email: data.email, uid: userUid });
                    } else {
                        sendResponse({ success: false, error: "Failed to retrieve UID" });
                    }
                })
                .catch(err => sendResponse({ success: false, error: err.message }));
            } else {
                sendResponse({ success: false, error: data.error.message });
            }
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
    
        return true; // Necessary for async response
    }
    // if (request.action === "signIn") {
    //     fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             email: request.email,
    //             password: request.password,
    //             returnSecureToken: true
    //         })
    //     })
    //     .then(response => response.json())
    //     .then(data => {
    //         if (data.idToken) {
    //             chrome.storage.local.set({ user: { email: data.email, idToken: data.idToken } });
    //             sendResponse({ success: true, email: data.email });
    //         } else {
    //             sendResponse({ success: false, error: data.error.message });
    //         }
    //     })
    //     .catch(error => {
    //         sendResponse({ success: false, error: error.message });
    //     });

    //     return true; // Necessary for async response
    // }

    if (request.action === "signOut") {
        chrome.storage.local.remove("user", () => {
            chrome.storage.local.set({ voteEnabled: false }, () => {
                sendResponse({ success: true });
            });
        });
        return true;
    }

    if (request.action === "authStatus") {
        chrome.storage.local.get(["user"], (data) => {
            if (data.user && data.user.email) {
                sendResponse({ authenticated: true, email: data.user.email });
            } else {
                sendResponse({ authenticated: false });
            }
        });
        return true;
    }

    if (request.action === "toggleOverlay") {
        chrome.storage.local.set({ voteEnabled: request.enabled }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});
