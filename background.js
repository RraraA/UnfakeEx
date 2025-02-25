chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleOverlay") {
        chrome.storage.local.set({ overlayEnabled: request.state });
        sendResponse({ status: "updated" });
    }
});
