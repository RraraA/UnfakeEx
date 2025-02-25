let submittedTweets = [];
let observer; // Define observer globally

//Updates Vote Count
function updateVoteCount(tweetElement, tweetURL) {
    fetch(`http://localhost:5000/get-vote-count?tweetUrl=${encodeURIComponent(tweetURL)}`)
        .then(response => response.json())
        .then(data => {
            // Update the designated total vote count field in the overlay
            tweetElement.querySelector(".TVNum").textContent = data.total_votes;
        })
        .catch(error => {
            console.error("Error fetching updated vote count", error);
        });
}


// Function to load submitted tweets from storage
function loadSubmittedTweets() {
    chrome.storage.local.get(["submittedTweets"], function (data) {
        submittedTweets = data.submittedTweets || [];
        // console.log("Loaded submitted tweets:", submittedTweets);
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

//TODO: TEST
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
            <p class="TotalVotesDisplay">Total Votes: <span class="TVNum">0</span></p>
        </div>
    `;

    // Find the tweet's action buttons (Like, Comment, Share) and insert the overlay below it
    let actionButtons = tweetElement.querySelector('[role="group"]');
    if (actionButtons) {
        actionButtons.parentElement.insertAdjacentHTML("afterend", votingHTML);
    } else {
        tweetElement.insertAdjacentHTML("beforeend", votingHTML);
    }

    // Variables to store vote selection and the currently selected button
    let selectedButton = null;

    // Utility function to clear selection from all vote buttons
    function clearSelection() {
        tweetElement.querySelector(".RealBtn").classList.remove("selected");
        tweetElement.querySelector(".UncertainBtn").classList.remove("selected");
        tweetElement.querySelector(".FakeBtn").classList.remove("selected");
    }

    // Event listeners for voting buttons and submitting evidence
    let vote = ""; 
    tweetElement.querySelector(".RealBtn").addEventListener("click", function () {
        vote = "Real";
        clearSelection();
        this.classList.add("selected");
        alert("Vote submitted as: " + vote);
    });
    tweetElement.querySelector(".UncertainBtn").addEventListener("click", function () {
        vote = "Uncertain";
        clearSelection();
        this.classList.add("selected");
        alert("Vote submitted as: " + vote);
    });
    tweetElement.querySelector(".FakeBtn").addEventListener("click", function () {
        vote = "Fake";
        clearSelection();
        this.classList.add("selected");
        alert("Vote submitted as: " + vote);
    });

    tweetElement.querySelector(".SubmitBtn").addEventListener("click", function () {
        let evidenceInput = tweetElement.querySelector(".RefBox").value.trim();
    
        // Check that a vote was selected
        if (!vote) {
            alert("No vote submitted!");
            return;
        }
    
        // If evidence is provided, alert and clear it (optional)
        if (evidenceInput) {
            alert("Evidence submitted: " + evidenceInput);
            tweetElement.querySelector(".RefBox").value = "";
        }
        // Proceed with submission regardless of evidenceInput
        let tweetLinkElement = tweetElement.querySelector('a[href*="/status/"]');
        let tweetURL = new URL(tweetLinkElement.href).href;
    
        fetch('http://localhost:5000/submit-vote', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                tweetUrl: tweetURL,
                vote: vote,
                evidence: evidenceInput  // may be empty
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                alert("Vote successfully submitted!");
                updateVoteCount(tweetElement, tweetURL);
                // Revert the vote button color by clearing selection
                clearSelection();
                vote = ""; // Reset vote variable if desired
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert("Failed to submit vote.");
        });
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
        console.log("Received updated submitted tweets:", message.tweets);
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

// Global polling: Update vote counts for all tweets every 5 seconds
setInterval(() => {
    // console.log("Polling vote counts...");
    document.querySelectorAll('[data-testid="tweet"]').forEach(tweet => {
        if (tweet.querySelector("#VoteCon")) {
            let tweetLinkElement = tweet.querySelector('a[href*="/status/"]');
            if (!tweetLinkElement) return;
            let tweetURL = new URL(tweetLinkElement.href).href;
            updateVoteCount(tweet, tweetURL);
        }
    });
}, 5000);
