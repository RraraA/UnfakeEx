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
                chrome.storage.local.set({ user: { email: data.email, idToken: data.idToken } });
                sendResponse({ success: true, email: data.email });
            } else {
                sendResponse({ success: false, error: data.error.message });
            }
        })
        .catch(error => {
            sendResponse({ success: false, error: error.message });
        });

        return true; // Necessary for async response
    }

    if (request.action === "signOut") {
        chrome.storage.local.remove("user", () => {
            sendResponse({ success: true });
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
