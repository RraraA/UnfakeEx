// Function to insert the voting UI using an HTML template
function insertVotingSection() {
    if (document.getElementById("VoteCon")) return;

    const tweetActions = document.querySelectorAll('[role="group"]'); // X's action buttons
    if (!tweetActions.length) return;

    tweetActions.forEach(actionsContainer => {
        if (actionsContainer.parentElement.querySelector("#VoteCon")) return;

        // Conenct the Buttons.
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
                <div id=SecRow>
                    <input type="text" class="RefBox" placeholder="Submit Evidence Here"/>
                    <button class="SubmitBtn">Submit</button>
                </div>
                <p class="TVCon">
                    Total Votes: <span class="TVNum">0</span>
                </p>
            </div>
        `;

        actionsContainer.parentElement.insertAdjacentHTML("afterend", votingHTML);
    });

    console.log("Voting section added.");
}

// Function to remove the voting UI
function removeVotingSection() {
    document.querySelectorAll("#VoteCon").forEach(overlay => overlay.remove());
    console.log("Voting section removed.");
}

// Listen for messages from `popup.js`
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleVotingUI") {
        if (message.enabled) {
            insertVotingSection();
        } else {
            removeVotingSection();
        }
        sendResponse({ status: "Voting UI updated." });
    }
});

// Apply UI on page load if toggle is ON
chrome.storage.local.get(["voteEnabled"], function (result) {
    if (result.voteEnabled) {
        insertVotingSection();
    }
});

// MutationObserver to detect new tweets and apply voting UI
const observer = new MutationObserver(() => {
    chrome.storage.local.get(["voteEnabled"], function (result) {
        if (result.voteEnabled) {
            insertVotingSection();
        }
    });
});

// Start observing the page for dynamically loaded tweets
observer.observe(document.body, { childList: true, subtree: true });
