document.addEventListener("DOMContentLoaded", () => {
    const signInBtn = document.getElementById("signInBtn");
    const signOutBtn = document.getElementById("signOutBtn");
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passInput");
    const errorMessage = document.getElementById("errorMessage");
    const signInContainer = document.getElementById("signInContainer");
    const voteSection = document.getElementById("voteSection");
    const closePopupButton = document.getElementById("closePopup");
    const toggleOverlay = document.getElementById("toggleOverlay");
    const tweetLinkInput = document.getElementById("tweetLink");
    const submitTweetButton = document.getElementById("submitTweet");

    // 🔹 Check auth state clearly via storage (always accurate)
    chrome.storage.local.get(["user"], (data) => {
        if (data.user && data.user.email) {
            signInContainer.style.display = "none";
            voteSection.style.display = "block";
        } else {
            signInContainer.style.display = "block";
            voteSection.style.display = "none";
        }
    });

    // 🔹 Sign-in action
    signInBtn.addEventListener("click", () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        chrome.runtime.sendMessage({ action: "signIn", email, password }, response => {
            if (response.success) {
                chrome.storage.local.set({ user: { email } }); // Immediately set user
                signInContainer.style.display = "none";
                voteSection.style.display = "block";
                errorMessage.textContent = "";
            } else {
                errorMessage.textContent = response.error;
            }
        });
    });

    // 🔹 Sign-out action
    signOutBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "signOut" }, response => {
            if (response.success) {
                chrome.storage.local.remove("user"); // Immediately remove user
                signInContainer.style.display = "block";
                voteSection.style.display = "none";
            } else {
                errorMessage.textContent = response.error;
            }
        });
    });

    // 🔹 Handle overlay toggle
    chrome.storage.local.get(["voteEnabled"], data => {
        toggleOverlay.checked = data.voteEnabled ?? false;
    });

    toggleOverlay.addEventListener("change", () => {
        const isEnabled = toggleOverlay.checked;
        chrome.storage.local.set({ voteEnabled: isEnabled });

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggleVotingUI", enabled: isEnabled });
            }
        });
    });

    // 🔹 Extract valid Tweet URL
    function extractTweetURL(input) {
        const tweetRegex = /(https?:\/\/(www\.)?(twitter|x)\.com\/[^\/]+\/status\/\d+)/;
        const match = input.match(tweetRegex);
        return match ? match[1] : null;
    }

    // 🔹 Handle tweet submission
    submitTweetButton.addEventListener("click", () => {
        const tweetLink = tweetLinkInput.value.trim();
        const validTweetURL = extractTweetURL(tweetLink);

        if (!validTweetURL) {
            alert("Please enter a valid Twitter/X tweet link!");
            return;
        }

        chrome.storage.local.get(["submittedTweets"], data => {
            let submittedTweets = data.submittedTweets || [];
            if (!submittedTweets.includes(validTweetURL)) {
                submittedTweets.push(validTweetURL);
                chrome.storage.local.set({ submittedTweets });

                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "updateSubmittedTweets",
                            tweets: submittedTweets
                        });
                    }
                });
            } else {
                alert("This tweet has already been submitted.");
            }
        });

        tweetLinkInput.value = "";
    });

    // 🔹 Close popup action
    closePopupButton.addEventListener("click", () => window.close());
});
