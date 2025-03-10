chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Message received in background.js:", request);

    if (request.action === "toggleOverlay") {
        chrome.storage.local.set({ overlayEnabled: request.state }, () => {
            console.log("✅ Overlay state updated:", request.state);
            sendResponse({ status: "updated" });
        });
        return true; // Keep the sendResponse channel open for async storage operation
    }

    if (request.action === "getUserStatus") {
        chrome.storage.local.get(["user"], (data) => {
            console.log("👤 Checking user status in background.js...");
            sendResponse({ isLoggedIn: !!data.user });
        });
        return true; // Keep the sendResponse channel open
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && (tab.url.includes("x.com") || tab.url.includes("twitter.com"))) {
        console.log(`🔄 Page updated: ${tab.url}. Reinserting content script...`);
        
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        }).catch(err => {
            console.error("⚠️ Failed to reinject content script:", err);
        });
    }
});

// ✅ Handle extension context invalidation and auto-restart content script if needed
chrome.runtime.onInstalled.addListener(() => {
    console.log("🚀 Extension installed or updated.");
    chrome.storage.local.set({ overlayEnabled: true }, () => console.log("✅ Default overlay state set."));
});

// ✅ Ensure content scripts remain active after extension updates
chrome.runtime.onStartup.addListener(() => {
    console.log("🔄 Extension restarted. Ensuring scripts are running.");
    chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] }, (tabs) => {
        tabs.forEach(tab => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            }).catch(err => console.warn("⚠️ Could not reinject on startup:", err));
        });
    });
});
