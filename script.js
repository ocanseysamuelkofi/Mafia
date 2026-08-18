"use strict";

/*
=========================================================
FIREBASE SETUP
=========================================================

1. Go to https://console.firebase.google.com/
2. Create a Firebase project.
3. Add a Web App.
4. Open Realtime Database.
5. Create a database.
6. Replace the configuration below with your own details.
*/

const firebaseConfig = {
    ap*Key: "PASTE_YOUR_API_KEY_HERE",
  * authDomain: "PASTE_YOUR_PROJECT.f*rebaseapp.com",
    databaseURL:
 *      "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
    p*ojectId: "PASTE_YOUR_PROJECT_ID",
*   storageBucket: "PASTE_YOUR_PROJ*CT.appspot.com",
    messagingSend*rId: "PASTE_YOUR_SENDER_ID",
    a*pId: "PASTE_YOUR_APP_ID"
};

let d*tabase = null;
let currentGameCode*= "";
let currentPlayerId = "";
le* currentRole = "";
let currentGame*= null;
let selectedMafiaTarget = *";
let selectedVoteTarget = "";
le* notificationTimer = null;

const *ages = {
    home: document.queryS*lector("#homePage"),
    join: doc*ment.querySelector("#joinPage"),
 *  screen: document.querySelector("*screenPage"),
    player: document*querySelector("#playerPage"),
    *oderator: document.querySelector("*moderatorPage")
};

document.addEv*ntListener("DOMContentLoaded", ini*ializeApplication);

function init*alizeApplication() {
    attachEve*tListeners();
    initializeFireba*e();
    processURL();
    showCon*inueButton();
}

function initiali*eFirebase() {
    const configIsMi*sing = Object.values(firebaseConfi*).some((value) =>
        value.in*ludes("PASTE_YOUR")
    );

    if*(configIsMissing) {
        showNo*ification(
            "Add your F*rebase configuration inside script*js first.",
            "error",
 *          8000
        );
        *eturn;
    }

    try {
        fi*ebase.initializeApp(firebaseConfig*;
        database = firebase.data*ase();
    } catch (error) {
     *  console.error(error);
        sh*wNotification(
            "Fireba*e could not be started. Check your*configuration.",
            "erro*"
        );
    }
}

function att*chEventListeners() {
    document
*       .querySelector("#createGame*utton")
        .addEventListener(*click", createGame);

    document*        .querySelector("#openJoinB*tton")
        .addEventListener("*lick", () => {
            showPag*("join");
        });

    documen*
        .querySelector("#joinForm*)
        .addEventListener("submi*", joinGame);

    document
      * .querySelector("#copyLinkButton")*        .addEventListener("click",*copyJoinLink);

    document
     *  .querySelector("#assignModerator*utton")
        .addEventListener(*click", assignModerator);

    doc*ment
        .querySelector("#star*GameButton")
        .addEventList*ner("click", startGame);

    docu*ent
        .querySelector("#mafia*liminateButton")
        .addEvent*istener("click", eliminatePlayer);*
    document
        .querySelect*r("#submitVoteButton")
        .ad*EventListener("click", submitVote)*

    document
        .querySelec*or("#beginMafiaTurnButton")
      * .addEventListener("click", beginM*fiaTurn);

    document
        .q*erySelector("#beginDiscussionButto*")
        .addEventListener("clic*", beginDiscussion);

    document*        .querySelector("#beginVoti*gButton")
        .addEventListene*("click", beginVoting);

    docum*nt
        .querySelector("#reveal*oteButton")
        .addEventListe*er("click", revealVoteResult);

  * document
        .querySelector("*continueRoundButton")
        .add*ventListener("click", continueToNe*tRound);

    document
        .qu*rySelector("#newGameButton")
     *  .addEventListener("click", () =>*{
            localStorage.removeI*em("mafiaSession");
            wi*dow.location.href = removeQueryPar*meters();
        });

    documen*
        .querySelector("#continue*ameButton")
        .addEventListe*er("click", continuePreviousGame);*
    document.querySelectorAll("[data-go-home]").forEach((button) => *
        button.addEventListener("*lick", () => showPage("home"));
  * });

    window.addEventListener(*popstate", processURL);
}

functio* processURL() {
    const paramete*s = new URLSearchParams(window.loc*tion.search);
    const gameCode =*normalizeGameCode(parameters.get("*ame") || "");
    const view = par*meters.get("view");

    if (gameC*de && view === "join") {
        d*cument.querySelector("#joinGameCod*").value = gameCode;
        showP*ge("join");
        return;
    }
*    if (gameCode && view === "scre*n") {
        currentGameCode = ga*eCode;
        currentRole = "scre*n";
        showPage("screen");
  *     listenToGame(gameCode);
     *  return;
    }

    showPage("hom*");
}

async function createGame()*{
    if (!requireDatabase()) {
  *     return;
    }

    const game*ode = generateGameCode();
    curr*ntGameCode = gameCode;
    current*ole = "screen";

    const gameDat* = {
        code: gameCode,
     *  createdAt: firebase.database.Ser*erValue.TIMESTAMP,
        status:*"lobby",
        phase: "lobby",
 *      round: 0,
        moderatorI*: "",
        mafiaId: "",
       *eliminatedByMafiaId: "",
        v*tedOutId: "",
        latestEvent:*{
            title: "Waiting for *layers",
            message: "Sca* the QR code to join the game."
  *     }
    };

    try {
        a*ait database.ref(`games/${gameCode*`).set(gameData);

        saveSes*ion({
            gameCode,
      *     role: "screen",
            p*ayerId: ""
        });

        co*st screenURL = getViewURL(gameCode* "screen");
        window.history*pushState({}, "", screenURL);

   *    showPage("screen");
        li*tenToGame(gameCode);
        gener*teQRCode(gameCode);
    } catch (e*ror) {
        console.error(error*;
        showNotification("The ga*e could not be created.", "error")*
    }
}

async function joinGame(*vent) {
    event.preventDefault()*

    if (!requireDatabase()) {
  *     return;
    }

    const game*ode = normalizeGameCode(
        d*cument.querySelector("#joinGameCod*").value
    );

    const playerN*me = document
        .querySelect*r("#playerName")
        .value
  *     .trim()
        .replace(/\s+*g, " ");

    if (!gameCode || !pl*yerName) {
        showNotificatio*(
            "Enter a game code a*d your name.",
            "error"*        );
        return;
    }

*   try {
        const gameSnapsho* = await database
            .ref*`games/${gameCode}`)
            .*nce("value");

        if (!gameSn*pshot.exists()) {
            show*otification("That game does not ex*st.", "error");
            return*
        }

        const game = g*meSnapshot.val();

        if (gam*.status !== "lobby") {
           *showNotification(
                *This game has already started.",
 *              "error"
            *;
            return;
        }

 *      const playersSnapshot = awai* database
            .ref(`games/*{gameCode}/players`)
            .*nce("value");

        const playe*s = playersSnapshot.val() || {};

*       const duplicateName = Objec*.values(players).some(
           *(player) =>
                player*name.toLowerCase() === playerName.*oLowerCase()
        );

        i* (duplicateName) {
            sho*Notification(
                "Som*one has already joined with that n*me.",
                "error"
    *       );
            return;
    *   }

        const playerReferenc* = database
            .ref(`game*/${gameCode}/players`)
           *.push();

        currentGameCode * gameCode;
        currentPlayerId*= playerReference.key;
        cur*entRole = "player";

        await*playerReference.set({
            *d: currentPlayerId,
            na*e: playerName,
            alive: *rue,
            joinedAt: firebas*.database.ServerValue.TIMESTAMP
  *     });

        saveSession({
  *         gameCode,
            rol*: "player",
            playerId: currentPlayerId
        });

        document.querySelector("#joinedPlayerName").textContent =
            playerName;

        showPage("player");
        listenToGame(gameCode);
        showNotification("You joined the game.", "success");
    } catch (error) {
        console.error(error);
        showNotification("You could not join the game.", "error");
    }
}

function listenToGame(gameCode) {
    if (!database) {
        return;
    }

    database.ref(`games/${gameCode}`).off();

    database.ref(`games/${gameCode}`).on("value", (snapshot) => {
        if (!snapshot.exists()) {
            showNotification(
                "This game no longer exists.",
                "error"
            );
            return;
        }

        currentGame = snapshot.val();
        currentGameCode = gameCode;

        updateInterface();
    });
}

function updateInterface() {
    if (!currentGame) {
        return;
    }

    if (currentRole === "screen") {
        renderScreen();
        return;
    }

    const currentPlayer = getPlayers()[currentPlayerId];

    if (!currentPlayer) {
        return;
    }

    if (currentGame.moderatorId === currentPlayerId) {
        currentRole = "moderator";

        saveSession({
            gameCode: currentGameCode,
            playerId: currentPlayerId,
            role: "moderator"
        });

        showPage("moderator");
        renderModerator();
    } else {
        currentRole = "player";

        saveSession({
            gameCode: currentGameCode,
            playerId: currentPlayerId,
            role: "player"
        });

        showPage("player");
        renderPlayer();
    }
}

function renderScreen() {
    document.querySelector("#screenGameCode").textContent =
        currentGameCode;

    if (currentGame.status === "lobby") {
        showElement("#screenLobby");
        hideElement("#screenGame");
        hideElement("#gameOverScreen");

        renderLobbyPlayers();
        generateQRCode(currentGameCode);
        return;
    }

    hideElement("#screenLobby");
    showElement("#screenGame");

    renderPublicGame();

    if (currentGame.status === "finished") {
        displayGameOver();
    } else {
        hideElement("#gameOverScreen");
    }
}

function renderLobbyPlayers() {
    const players = Object.values(getPlayers());
    const playerList = document.querySelector("#screenPlayerList");
    const select = document.querySelector("#moderatorSelect");

    document.querySelector("#playerCountBadge").textContent =
        `${players.length} ${players.length === 1 ? "player" : "players"}`;

    if (!players.length) {
        playerList.innerHTML = `
            <div class="empty-state">
                Waiting for players to join...
            </div>
        `;
    } else {
        playerList.innerHTML = players
            .map((player) => createPlayerRow(player, false))
            .join("");
    }

    const previousSelection =
        currentGame.moderatorId || select.value;

    select.innerHTML = `
        <option value="">Select a player</option>
        ${players
            .map(
                (player) => `
                    <option value="${escapeHTML(player.id)}">
                        ${escapeHTML(player.name)}
                    </option>
                `
            )
            .join("")}
    `;

    select.value = previousSelection || "";

    const moderator = getPlayers()[currentGame.moderatorId];

    document.querySelector("#moderatorDisplay").textContent =
        moderator
            ? `${moderator.name} is the moderator`
            : "No moderator selected";

    document.querySelector("#startGameButton").disabled =
        players.length < 4 || !currentGame.moderatorId;
}

async function assignModerator() {
    const moderatorId =
        document.querySelector("#moderatorSelect").value;

    if (!moderatorId) {
        showNotification("Select a moderator first.", "error");
        return;
    }

    await database
        .ref(`games/${currentGameCode}/moderatorId`)
        .set(moderatorId);

    showNotification("Moderator selected.", "success");
}

async function startGame() {
    const players = Object.values(getPlayers());
    const moderatorId = currentGame.moderatorId;

    if (players.length < 4) {
        showNotification(
            "At least 4 people must join.",
            "error"
        );
        return;
    }

    if (!moderatorId) {
        showNotification("Choose a moderator first.", "error");
        return;
    }

    const possibleMafiaPlayers = players.filter(
        (player) => player.id !== moderatorId
    );

    const mafia =
        possibleMafiaPlayers[
            Math.floor(Math.random() * possibleMafiaPlayers.length)
        ];

    const updates = {
        status: "active",
        phase: "waiting_for_moderator",
        round: 1,
        mafiaId: mafia.id,
        eliminatedByMafiaId: "",
        votedOutId: "",
        latestEvent: {
            title: "The game has started",
            message:
                "The Mafia is hidden. Look at your own device for instructions."
        },
        votes: null
    };

    await database
        .ref(`games/${currentGameCode}`)
        .update(updates);
}

function renderPublicGame() {
    const alivePlayers = getAlivePlayers(false);
    const eligibleVoters = getEligibleVoters();
    const votes = currentGame.votes || {};
    const voteCount = Object.keys(votes).length;

    document.querySelector("#screenRoundLabel").textContent =
        `ROUND ${currentGame.round || 1}`;

    document.querySelector("#aliveCountBadge").textContent =
        `${alivePlayers.length} alive`;

    document.querySelector("#alivePlayerList").innerHTML =
        alivePlayers
            .map(
                (player) => `
                    <div class="player-tile">
                        <div class="player-avatar">
                            ${escapeHTML(player.name.charAt(0).toUpperCase())}
                        </div>
                        <strong>${escapeHTML(player.name)}</strong>
                    </div>
                `
            )
            .join("");

    const phaseText = getPublicPhaseText(currentGame.phase);

    document.querySelector("#screenPhaseTitle").textContent =
        phaseText.title;

    document.querySelector("#screenPhaseMessage").textContent =
        phaseText.message;

    document.querySelector("#publicEventTitle").textContent =
        currentGame.latestEvent?.title || "Game in progress";

    document.querySelector("#publicEventMessage").textContent =
        currentGame.latestEvent?.message ||
        "Follow the moderator's instructions.";

    if (currentGame.phase === "voting") {
        showElement("#voteProgress");

        const totalVoters = eligibleVoters.length;
        const percentage =
            totalVoters === 0
                ? 0
                : Math.min((voteCount / totalVoters) * 100, 100);

        document.querySelector("#voteProgressText").textContent =
            `${voteCount} / ${totalVoters}`;

        document.querySelector("#voteProgressBar").style.width =
            `${percentage}%`;
    } else {
        hideElement("#voteProgress");
    }

    if (currentGame.phase === "vote_result") {
        showVoteResultOverlay();
    } else {
        hideElement("#resultOverlay");
    }
}

function getPublicPhaseText(phase) {
    const phaseDetails = {
        waiting_for_moderator: {
            title: "The game is ready",
            message:
                "The moderator will begin the Mafia's turn."
        },
        mafia_turn: {
            title: "The Mafia is choosing",
            message:
                "Wait quietly while the Mafia selects someone."
        },
        elimination_result: {
            title: "Someone has been eliminated",
            message:
                "Check the latest event to see who is out."
        },
        discussion: {
            title: "Discuss and investigate",
            message:
                "Who is behaving suspiciously? Decide who may be the Mafia."
        },
        voting: {
            title: "Voting is open",
            message:
                "Every living player should vote on their own device."
        },
        waiting_for_result: {
            title: "Voting is complete",
            message:
                "The moderator will now reveal the result."
        },
        vote_result: {
            title: "The votes have been counted",
            message:
                "The player with the highest number of votes is eliminated."
        }
    };

    return (
        phaseDetails[phase] || {
            title: "Game in progress",
            message: "Follow the moderator's instructions."
        }
    );
}

function renderPlayer() {
    const player = getPlayers()[currentPlayerId];

    if (!player) {
        return;
    }

    document.querySelector("#joinedPlayerName").textContent =
        player.name;

    if (currentGame.status === "lobby") {
        showElement("#playerLobby");
        hideElement("#playerStatusCard");

        document.querySelector("#playerRoundLabel").textContent =
            "Lobby";

        return;
    }

    hideElement("#playerLobby");
    showElement("#playerStatusCard");

    document.querySelector("#playerRoundLabel").textContent =
        `Round ${currentGame.round || 1}`;

    const isMafia = currentGame.mafiaId === currentPlayerId;

    document.querySelector("#roleIcon").textContent =
        isMafia ? "🕵️" : "👤";

    document.querySelector("#playerRoleTitle").textContent =
        isMafia ? "You are the MAFIA" : "You are a Player";

    document.querySelector("#playerRoleMessage").textContent =
        isMafia
            ? "Keep your identity secret. Eliminate players when the moderator allows you."
            : "Work with the others to identify and vote out the Mafia.";

    toggleElement("#eliminatedMessage", !player.alive);

    hideElement("#mafiaControls");
    hideElement("#votingControls");
    hideElement("#playerWaitingMessage");

    if (!player.alive) {
        return;
    }

    if (isMafia && currentGame.phase === "mafia_turn") {
        renderMafiaControls();
        return;
    }

    if (currentGame.phase === "voting") {
        renderVotingControls();
        return;
    }

    showElement("#playerWaitingMessage");

    document.querySelector("#playerWaitingMessage").innerHTML =
        `<span class="pulse-dot"></span>${escapeHTML(
            getPlayerWaitingText()
        )}`;
}

function getPlayerWaitingText() {
    const messages = {
        waiting_for_moderator:
            "Waiting for the moderator to begin.",
        mafia_turn:
            "The Mafia is choosing someone.",
        elimination_result:
            "A player has been eliminated.",
        discussion:
            "Discuss who you think the Mafia is.",
        waiting_for_result:
            "All votes are in. Waiting for the moderator.",
        vote_result:
            "The vote result has been revealed."
    };

    return messages[currentGame.phase] || "Waiting...";
}

function renderMafiaControls() {
    showElement("#mafiaControls");
    selectedMafiaTarget = "";

    const possibleTargets = getAlivePlayers(false).filter(
        (player) => player.id !== currentPlayerId
    );

    document.querySelector("#mafiaTargetList").innerHTML =
        possibleTargets
            .map(
                (player) => `
                    <label class="selection-option">
                        <input
                            type="radio"
                            name="mafiaTarget"
                            value="${escapeHTML(player.id)}"
                        >
                        <strong>${escapeHTML(player.name)}</strong>
                    </label>
                `
            )
            .join("");

    document
        .querySelectorAll('input[name="mafiaTarget"]')
        .forEach((radio) => {
            radio.addEventListener("change", (event) => {
                selectedMafiaTarget = event.target.value;

                document.querySelector(
                    "#mafiaEliminateButton"
                ).disabled = false;
            });
        });

    document.querySelector("#mafiaEliminateButton").disabled = true;
}

async function eliminatePlayer() {
    if (
        currentGame.mafiaId !== currentPlayerId ||
        currentGame.phase !== "mafia_turn" ||
        !selectedMafiaTarget
    ) {
        return;
    }

    const target = getPlayers()[selectedMafiaTarget];

    if (!target || !target.alive) {
        showNotification(
            "That player cannot be eliminated.",
            "error"
        );
        return;
    }

    const updates = {};

    updates[
        `games/${currentGameCode}/players/${selectedMafiaTarget}/alive`
    ] = false;

    updates[
        `games/${currentGameCode}/eliminatedByMafiaId`
    ] = selectedMafiaTarget;

    updates[`games/${currentGameCode}/phase`] =
        "elimination_result";

    updates[`games/${currentGameCode}/latestEvent`] = {
        title: `${target.name} has been eliminated`,
        message:
            "The remaining players must now discuss who they think the Mafia is."
    };

    await database.ref().update(updates);

    selectedMafiaTarget = "";
}

function renderVotingControls() {
    showElement("#votingControls");

    const votes = currentGame.votes || {};
    const alreadyVoted = Boolean(votes[currentPlayerId]);
    const possibleTargets = getAlivePlayers(false).filter(
        (player) => player.id !== currentPlayerId
    );

    if (alreadyVoted) {
        document.querySelector("#voteTargetList").innerHTML = `
            <div class="status-box">
                Your vote has been submitted.
            </div>
        `;

        document.querySelector("#submitVoteButton").disabled = true;
        document.querySelector("#submitVoteButton").textContent =
            "Vote Submitted";

        return;
    }

    selectedVoteTarget = "";

    document.querySelector("#submitVoteButton").textContent =
        "Submit Vote";

    document.querySelector("#submitVoteButton").disabled = true;

    document.querySelector("#voteTargetList").innerHTML =
        possibleTargets
            .map(
                (player) => `
                    <label class="selection-option">
                        <input
                            type="radio"
                            name="voteTarget"
                            value="${escapeHTML(player.id)}"
                        >
                        <strong>${escapeHTML(player.name)}</strong>
                    </label>
                `
            )
            .join("");

    document
        .querySelectorAll('input[name="voteTarget"]')
        .forEach((radio) => {
            radio.addEventListener("change", (event) => {
                selectedVoteTarget = event.target.value;

                document.querySelector(
                    "#submitVoteButton"
                ).disabled = false;
            });
        });
}

async function submitVote() {
    if (
        currentGame.phase !== "voting" ||
        !selectedVoteTarget
    ) {
        return;
    }

    const player = getPlayers()[currentPlayerId];

    if (!player?.alive) {
        return;
    }

    const voteReference = database.ref(
        `games/${currentGameCode}/votes/${currentPlayerId}`
    );

    const result = await voteReference.transaction(
        (currentValue) => {
            if (currentValue !== null) {
                return;
            }

            return {
                voterId: currentPlayerId,
                targetId: selectedVoteTarget,
                submittedAt:
                    firebase.database.ServerValue.TIMESTAMP
            };
        }
    );

    if (!result.committed) {
        showNotification(
            "You have already submitted a vote.",
            "error"
        );
        return;
    }

    showNotification("Your vote was submitted.", "success");

    selectedVoteTarget = "";
    await checkIfVotingIsComplete();
}

async function checkIfVotingIsComplete() {
    const snapshot = await database
        .ref(`games/${currentGameCode}`)
        .once("value");

    const game = snapshot.val();

    if (!game || game.phase !== "voting") {
        return;
    }

    const players = game.players || {};
    const eligibleVoterCount = Object.values(players).filter(
        (player) =>
            player.alive && player.id !== game.moderatorId
    ).length;

    const submittedVoteCount = Object.keys(
        game.votes || {}
    ).length;

    if (
        eligibleVoterCount > 0 &&
        submittedVoteCount >= eligibleVoterCount
    ) {
        await database
            .ref(`games/${currentGameCode}/phase`)
            .set("waiting_for_result");
    }
}

function renderModerator() {
    const players = getPlayers();

    document.querySelector("#moderatorRoundLabel").textContent =
        currentGame.status === "lobby"
            ? "Lobby"
            : `Round ${currentGame.round || 1}`;

    const mafia = players[currentGame.mafiaId];

    document.querySelector("#mafiaNameDisplay").textContent =
        mafia
            ? mafia.name
            : "Hidden until the game starts";

    const alivePlayers = getAlivePlayers(false);

    document.querySelector("#moderatorAliveBadge").textContent =
        `${alivePlayers.length} alive`;

    document.querySelector("#moderatorPlayerList").innerHTML =
        Object.values(players)
            .map((player) => createPlayerRow(player, true))
            .join("");

    renderModeratorControls();
    renderModeratorVotes();
}

function renderModeratorControls() {
    const phase = currentGame.phase;

    hideElement("#beginMafiaTurnButton");
    hideElement("#beginDiscussionButton");
    hideElement("#beginVotingButton");
    hideElement("#revealVoteButton");
    hideElement("#continueRoundButton");

    const title = document.querySelector("#moderatorPhaseTitle");
    const instructions = document.querySelector(
        "#moderatorInstructions"
    );

    if (currentGame.status === "lobby") {
        title.textContent = "You are the moderator";

        instructions.textContent =
            "Wait for the screen host to start the game.";

        return;
    }

    switch (phase) {
        case "waiting_for_moderator":
            title.textContent = "Start the Mafia's turn";

            instructions.textContent =
                "When everyone is ready, allow the Mafia to choose one player.";

            showElement("#beginMafiaTurnButton");
            break;

        case "mafia_turn":
            title.textContent = "The Mafia is choosing";

            instructions.textContent =
                "Wait until the Mafia eliminates one player.";
            break;

        case "elimination_result":
            title.textContent = "Player eliminated";

            instructions.textContent =
                "Announce the elimination, then allow the remaining players to discuss.";

            showElement("#beginDiscussionButton");
            break;

        case "discussion":
            title.textContent = "Discussion time";

            instructions.textContent =
                "Allow the players to discuss. Open voting when they are ready.";

            showElement("#beginVotingButton");
            break;

        case "voting":
            title.textContent = "Voting is open";

            instructions.textContent =
                "Wait until all living players have submitted their votes.";
            break;

        case "waiting_for_result":
            title.textContent = "Voting is complete";

            instructions.textContent =
                "Reveal the player who received the highest number of votes.";

            showElement("#revealVoteButton");
            break;

        case "vote_result":
            title.textContent = "Vote result revealed";

            instructions.textContent =
                currentGame.status === "finished"
                    ? "The Mafia was found. The game is over."
                    : "The eliminated player was not the Mafia. Continue to the next round.";

            if (currentGame.status !== "finished") {
                showElement("#continueRoundButton");
            }
            break;

        default
