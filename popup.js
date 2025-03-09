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

    // Handle overlay toggle
    toggleOverlay.addEventListener("change", function () {
        let isEnabled = toggleOverlay.checked;
        console.log("Toggling voting UI:", isEnabled);

        chrome.storage.local.set({ voteEnabled: isEnabled }, function () {
            console.log("Voting UI state updated:", isEnabled);
        });

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs.length || !tabs[0].id) {
                console.warn("No active tab found.");
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleVotingUI", enabled: isEnabled });
        });
    });

    // Function to extract a valid Tweet URL
    function extractTweetURL(input) {
        let tweetRegex = /(https?:\/\/(www\.)?(twitter|x)\.com\/[^\/]+\/status\/\d+)/;
        let match = input.match(tweetRegex);
        return match ? match[1] : null;
    }

    // Handle Tweet Link Submission
    submitTweetButton.addEventListener("click", function () {
        let tweetLink = tweetLinkInput.value.trim();
        let validTweetURL = extractTweetURL(tweetLink);

        if (!validTweetURL) {
            alert("Please enter a valid Twitter/X tweet link!");
            return;
        }

        // Store the submitted tweet in Chrome storage
        chrome.storage.local.get(["submittedTweets"], function (data) {
            let submittedTweets = data.submittedTweets || [];

            if (!submittedTweets.includes(validTweetURL)) {
                submittedTweets.push(validTweetURL);
                chrome.storage.local.set({ submittedTweets }, function () {
                    console.log("Updated submitted tweets:", submittedTweets);

                    // Notify content.js to apply the overlay
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        if (!tabs.length || !tabs[0].id) return;

                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "updateSubmittedTweets",
                            tweets: submittedTweets
                        });
                    });
                });
            } else {
                alert("This tweet has already been submitted.");
            }
        });

        // ✅ No more scraping here! Scraping now happens when evidence is submitted.

        tweetLinkInput.value = "";
    });

    // Close popup button
    closePopupButton.addEventListener("click", function () {
        window.close();
    });
});