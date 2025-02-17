let submittedTweets = [];
let observer; // Define observer globally

// Function to load submitted tweets from storage
function loadSubmittedTweets() {
    chrome.storage.local.get(["submittedTweets"], function (data) {
        submittedTweets = data.submittedTweets || [];
        console.log("Loaded submitted tweets:", submittedTweets);
        applyOverlayToSubmittedTweets();
    });
}

// Function to check if a tweet's URL is in submitted tweets list
function applyOverlayToSubmittedTweets() {
    if (!submittedTweets.length) return;

    document.querySelectorAll('[data-testid="tweet"]').forEach(tweet => {
        let tweetLinkElement = tweet.querySelector('a[href*="/status/"]');
        if (!tweetLinkElement) return; // Skip if no link is found

        let tweetURL = new URL(tweetLinkElement.href).href; // Extract clean tweet URL

        // Check if this tweet's URL is in the submitted list
        if (submittedTweets.includes(tweetURL)) {
            insertVotingSection(tweet);
        }
    });
}

// Function to insert the voting UI directly below X buttons
function insertVotingSection(tweetElement) {
    if (tweetElement.querySelector("#VoteCon")) return; // Prevent duplicates

    const votingHTML = `
        <div id="VoteCon">
            <div id="FirstRow"> 
                <p class="CheckedAlgo"> Checked:
                    <span class="Score">100%</span>
                    <span class="Stance">Uncertain</span>
                </p>
                <button class="RealBtn">Real</button>
                <button class="UncertainBtn">Uncertain</button>
                <button class="FakeBtn">Fake</button>
            </div>
            <div id="SecRow">
                <input type="text" class="RefBox" placeholder="Submit Evidence Here"/>
                <button class="SubmitBtn">Submit</button>
            </div>
            <p class="TVCon">
                Total Votes: <span class="TVNum">0</span>
            </p>
        </div>
    `;

    // Find the tweet's action buttons (Like, Comment, Share) and insert the overlay below it
    let actionButtons = tweetElement.querySelector('[role="group"]');
    if (actionButtons) {
        actionButtons.parentElement.insertAdjacentHTML("afterend", votingHTML);
    } else {
        tweetElement.insertAdjacentHTML("beforeend", votingHTML);
    }

    // Attach event listeners for buttons
    tweetElement.querySelector(".SubmitBtn").addEventListener("click", function () {
        let evidenceInput = tweetElement.querySelector(".RefBox").value.trim();
        if (evidenceInput) {
            alert("Evidence submitted: " + evidenceInput);
            tweetElement.querySelector(".RefBox").value = ""; // Clear input after submission
        }
    });

    console.log("Voting section added below action buttons.");
}

// **Function to remove all overlays when the toggle is OFF**
function removeVotingSection() {
    document.querySelectorAll("#VoteCon").forEach(overlay => overlay.remove());
    console.log("All voting overlays removed.");

    // **Stop MutationObserver when toggle is OFF**
    if (observer) {
        observer.disconnect();
        console.log("MutationObserver stopped.");
    }
}

// Listen for messages from `popup.js`
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleVotingUI") {
        if (message.enabled) {
            applyOverlayToSubmittedTweets();
            observeTweets(); // Restart observer when toggled ON
        } else {
            removeVotingSection();
        }
        sendResponse({ status: "Voting UI updated." });
    }

    if (message.action === "updateSubmittedTweets") {
        submittedTweets = message.tweets;
        applyOverlayToSubmittedTweets();
        sendResponse({ status: "Updated submitted tweets." });
    }
});

// Apply overlay on page load if toggle is ON
chrome.storage.local.get(["voteEnabled"], function (data) {
    if (data.voteEnabled) {
        loadSubmittedTweets();
        observeTweets();
    }
});

// **Function to observe new tweets dynamically**
function observeTweets() {
    if (observer) observer.disconnect(); // Prevent duplicate observers

    observer = new MutationObserver(() => {
        loadSubmittedTweets();
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
