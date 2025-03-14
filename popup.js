document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup loaded!");

    let toggleOverlay = document.getElementById("toggleOverlay");
    let tweetLinkInput = document.getElementById("tweetLink");
    let submitTweetButton = document.getElementById("submitTweet");
    let closePopupButton = document.getElementById("closePopup");
    let signInContainer = document.getElementById("signInContainer");
    let voteSection = document.getElementById("voteSection");
    let emailInput = document.getElementById("emailInput");
    let passwordInput = document.getElementById("passInput");
    let signInBtn = document.getElementById("signInBtn");
    let signOutBtn = document.getElementById("signOutBtn");
    let errorMessage = document.getElementById("errorMessage");

    // 🔹 Observe Auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            signInContainer.style.display = "none";
            voteSection.style.display = "block";
            errorMessage.textContent = "";
            console.log("User signed in:", user.email);
        } else {
            // User is signed out
            signInContainer.style.display = "block";
            voteSection.style.display = "none";
            console.log("User signed out.");
        }
    });

    // 🔹 Handle Sign-in button click
    signInBtn.addEventListener("click", () => {
        let email = emailInput.value.trim();
        let password = passwordInput.value.trim();

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                errorMessage.textContent = "";
                emailInput.value = "";
                passwordInput.value = "";
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

        chrome.storage.local.get(["submittedTweets"], function (data) {
            let submittedTweets = data.submittedTweets || [];

            if (!submittedTweets.includes(validTweetURL)) {
                submittedTweets.push(validTweetURL);
                chrome.storage.local.set({ submittedTweets }, function () {
                    console.log("Updated submitted tweets:", submittedTweets);

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

        tweetLinkInput.value = "";
    });

    // Close popup button
    closePopupButton.addEventListener("click", function () {
        window.close();
    });
});