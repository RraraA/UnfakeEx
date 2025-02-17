document.addEventListener("DOMContentLoaded", function () {
    let toggleOverlay = document.getElementById("toggleOverlay");
    let tweetLinkInput = document.getElementById("tweetLink");
    let submitTweetButton = document.getElementById("submitTweet");
    let closePopupButton = document.getElementById("closePopup");

    // Load stored overlay state from Chrome storage
    chrome.storage.local.get(["voteEnabled"], function (data) {
        console.log("Loaded overlay state:", data.voteEnabled);
        toggleOverlay.checked = data.voteEnabled ?? false;
    });

    // Handle overlay toggle (Directly updates voting UI)
    toggleOverlay.addEventListener("change", function () {
        let isEnabled = toggleOverlay.checked;
        console.log("Toggling voting UI:", isEnabled);

        // Store the state in Chrome storage
        chrome.storage.local.set({ voteEnabled: isEnabled }, function () {
            console.log("Voting UI state updated:", isEnabled);
        });

        // Send message to `content.js` to update UI
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs.length || !tabs[0].id) {
                console.warn("No active tab found.");
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleVotingUI", enabled: isEnabled }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Error sending message to content script:", chrome.runtime.lastError.message);
                } else {
                    console.log("Voting UI toggle message sent successfully:", response);
                }
            });
        });
    });

    // Handle Tweet Link Submission
    submitTweetButton.addEventListener("click", function () {
        let tweetLink = tweetLinkInput.value.trim();

        if (!tweetLink.includes("twitter.com") && !tweetLink.includes("x.com")) {
            alert("Please enter a valid Twitter/X link!");
            return;
        }

        // Send message to background script to analyze tweet
        chrome.runtime.sendMessage({ action: "analyzeTweet", tweet: tweetLink }, function (response) {
            if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
                console.log("Tweet submission response:", response);
            }
        });

        alert(`Submitted: ${tweetLink}`);
        tweetLinkInput.value = ""; // Clear input after submission
    });

    // Close popup button
    closePopupButton.addEventListener("click", function () {
        window.close();
    });
});
