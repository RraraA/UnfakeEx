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
                    <span class="Score">0%</span>
                    <span class="Stance">Uncertain</span>
                </p>
                <button class="AIBtn">AI Check</button>
                <button class="RealBtn" style="display:none;">Real</button>
                <button class="UncertainBtn" style="display:none;">Uncertain</button>
                <button class="FakeBtn" style="display:none;">Fake</button>
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

    tweetElement.querySelector(".AIBtn").addEventListener("click", function () {
        // Hide the AI button and show the voting buttons
        this.style.display = "none";
        tweetElement.querySelector(".RealBtn").style.display = "inline-block";
        tweetElement.querySelector(".UncertainBtn").style.display = "inline-block";
        tweetElement.querySelector(".FakeBtn").style.display = "inline-block";
        tweetElement.querySelector(".SubmitBtn").style.display = "inline-block";

        // Extract the tweet URL
        let tweetLinkElement = tweetElement.querySelector('a[href*="/status/"]');
        let tweetURL = new URL(tweetLinkElement.href).href;

        // --- 1. Submit the tweet for AI checking ---
        fetch('http://localhost:5000/scrape-tweet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ tweetUrl: tweetURL })
        })
        .then(response => response.json())
        .then(scrapeData => {
            if (scrapeData.tweet_text) {
                // --- 2. Send scraped text to the AI model ---
                return fetch('http://localhost:5001/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        text: scrapeData.tweet_text,
                        post_id: scrapeData.tweet_id
                    })
                });
            } else {
                throw new Error("Scraped tweet text is missing.");
            }
        })
        .then(response => response.json())
        .then(predictData => {
            // --- 3. Display AI prediction result in the overlay ---
            tweetElement.querySelector(".CheckedAlgo .Score").textContent = predictData.confidence[0]; // AI confidence for "Real"
            tweetElement.querySelector(".CheckedAlgo .Stance").textContent = predictData.prediction;

            // Now enable voting buttons
            tweetElement.querySelector(".RealBtn").style.display = "inline-block";
            tweetElement.querySelector(".UncertainBtn").style.display = "inline-block";
            tweetElement.querySelector(".FakeBtn").style.display = "inline-block";
            tweetElement.querySelector(".SubmitBtn").style.display = "inline-block";

            alert("AI Prediction: " + predictData.prediction + "\nConfidence: " + predictData.confidence);
        })
        .catch(error => {
            console.error('Error in processing chain:', error);
            alert("Failed to process tweet for AI prediction: " + error.message);
        });
    });

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

    // Ensure a vote has been selected
    if (!vote) {
        alert("No vote submitted!");
        return;
    }

    // Optionally alert evidence and clear the field if provided
    if (evidenceInput) {
        alert("Evidence submitted: " + evidenceInput);
        tweetElement.querySelector(".RefBox").value = "";
    }

    // Extract the tweet URL
    let tweetLinkElement = tweetElement.querySelector('a[href*="/status/"]');
    let tweetURL = new URL(tweetLinkElement.href).href;

    // --- 1. Submit the vote ---
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
            clearSelection();
            vote = ""; // Reset vote variable

            // --- 2. Scrape the tweet text ---
            // return fetch('http://localhost:5000/scrape-tweet', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Accept': 'application/json'
            //     },
            //     body: JSON.stringify({ tweetUrl: tweetURL })
            // });

        } else {
            throw new Error("Vote submission error: " + data.error);
        }
    })
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
