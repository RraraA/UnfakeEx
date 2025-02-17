document.addEventListener("DOMContentLoaded", function () {
    let toggleOverlay = document.getElementById("toggleOverlay");
    let tweetLinkInput = document.getElementById("tweetLink");
    let submitTweetButton = document.getElementById("submitTweet");
    let closePopupButton = document.getElementById("closePopup");

    // Load stored overlay state and submitted tweets from Chrome storage
    chrome.storage.local.get(["voteEnabled", "submittedTweets"], function (data) {
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

    // Function to extract a valid Tweet URL
    function extractTweetURL(input) {
        let tweetRegex = /(https?:\/\/(www\.)?(twitter|x)\.com\/[^\/]+\/status\/\d+)/;
        let match = input.match(tweetRegex);
        return match ? match[1] : null; // Returns the extracted tweet URL or null
    }

    // Handle Tweet Link Submission
    submitTweetButton.addEventListener("click", function () {
        let tweetLink = tweetLinkInput.value.trim();
        let validTweetURL = extractTweetURL(tweetLink);

        if (!validTweetURL) {
            alert("Please enter a valid Twitter/X tweet link!");
            return;
        }

        // Store the submitted tweet in chrome.storage
        chrome.storage.local.get(["submittedTweets"], function (data) {
            let submittedTweets = data.submittedTweets || [];

            // Prevent duplicate submissions
            if (!submittedTweets.includes(validTweetURL)) {
                submittedTweets.push(validTweetURL);
                chrome.storage.local.set({ submittedTweets }, function () {
                    console.log("Updated submitted tweets:", submittedTweets);
                });
            } else {
                alert("This tweet has already been submitted.");
                return;
            }

            // Notify `content.js` to check for new tweets
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (!tabs.length || !tabs[0].id) return;

                chrome.tabs.sendMessage(tabs[0].id, { action: "updateSubmittedTweets", tweets: submittedTweets }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Error sending tweet list to content script:", chrome.runtime.lastError.message);
                    } else {
                        console.log("Submitted tweets updated successfully in content script:", response);
                    }
                });
            });
        });

        alert(`Submitted Tweet: ${validTweetURL}`);
        tweetLinkInput.value = ""; // Clear input after submission
    });

    // Close popup button
    closePopupButton.addEventListener("click", function () {
        window.close();
    });
});
