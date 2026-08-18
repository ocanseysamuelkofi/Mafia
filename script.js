/* =========================================================
   MAFIA GAME
   Front-end prototype
========================================================= */


/* ================= GAME STATE ================= */

const game = {

    code: "MAFIA123",

    status: "LOBBY",

    phase: "LOBBY",

    players: [],

    moderator: null,

    mafia: null,

    currentRound: 0,

    votes: {},

    mafiaTarget: null

};


/* ================= PLAYER OBJECT ================= */

function createPlayer(name) {

    return {
        id: Date.now() + Math.random(),
        name: name,
        role: "PLAYER",
        alive: true,
        joined: true
    };

}


/* ================= VIEW SWITCHING ================= */

function showScreen(view) {

    document.querySelectorAll(".view").forEach(element => {
        element.classList.remove("active");
    });

    if (view === "screen") {
        document.getElementById("screen-view").classList.add("active");
    }

    if (view === "player") {
        document.getElementById("player-view").classList.add("active");
    }

    if (view === "moderator") {
        document.getElementById("moderator-view").classList.add("active");
    }

}


/* ================= JOIN GAME ================= */

function joinGame() {

    const input = document.getElementById("player-name");

    const name = input.value.trim();

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    if (game.players.some(
        player => player.name.toLowerCase() === name.toLowerCase()
    )) {
        alert("That name is already being used.");
        return;
    }

    const player = createPlayer(name);

    game.players.push(player);

    input.value = "";

    updateScreen();

    updateModerator();

    showPlayerMessage(
        `<div class="player-card">

            <h2>You're in!</h2>

            <p style="color:#aaa;margin:20px 0;">
                Welcome, ${escapeHTML(name)}
            </p>

            <div class="player-role innocent">
                <div class="role-icon">⏳</div>

                <div class="role-name">
                    Waiting...
                </div>

                <div class="player-message">
                    The moderator will be selected soon.
                </div>
            </div>

        </div>`
    );

}


/* ================= UPDATE SCREEN ================= */

function updateScreen() {

    const content = document.getElementById("screen-content");

    if (game.phase === "LOBBY") {

        content.innerHTML = `

            <div class="qr-page">

                <div class="game-title">
                    MAFIA
                </div>

                <p class="subtitle">
                    Scan the QR code to join the game
                </p>

                <div class="qr-code">
                    <div class="qr-pattern"></div>
                </div>

                <p class="join-code">
                    Game Code:
                    <strong>${game.code}</strong>
                </p>

                <div class="screen-status">
                    ${game.players.length}
                    player(s) joined
                </div>

                <div style="
                    margin-top:30px;
                    color:#aaa;
                    font-size:18px;
                ">
                    ${game.players.map(
                        p => escapeHTML(p.name)
                    ).join(" • ")}
                </div>

            </div>

        `;

        return;
    }


    if (game.phase === "MODERATOR_SELECTED") {

        content.innerHTML = `

            <div class="qr-page">

                <div class="game-title"
                    style="font-size:70px;">
                    MODERATOR
                </div>

                <p class="subtitle">
                    ${escapeHTML(game.moderator.name)}
                    has been selected
                </p>

                <div style="
                    margin-top:40px;
                    font-size:22px;
                    color:#aaa;
                ">
                    Get ready...
                </div>

            </div>

        `;

        return;
    }


    if (game.phase === "MAFIA_TURN") {

        content.innerHTML = `

            <div class="qr-page">

                <div class="game-title"
                    style="font-size:65px;">
                    MAFIA
                </div>

                <p class="subtitle">
                    The Mafia is choosing...
                </p>

                <div style="
                    font-size:80px;
                    margin-top:40px;
                ">
                    🔪
                </div>

            </div>

        `;

        return;
    }


    if (game.phase === "DISCUSSION") {

        content.innerHTML = `

            <div class="qr-page">

                <div class="game-title"
                    style="font-size:65px;">
                    DISCUSS
                </div>

                <p class="subtitle">
                    Who do you think is the Mafia?
                </p>

                <div style="
                    font-size:60px;
                    margin-top:30px;
                ">
                    🗣️
                </div>

                <p style="
                    margin-top:30px;
                    color:#aaa;
                ">
                    Round ${game.currentRound}
                </p>

            </div>

        `;

        return;
    }


    if (game.phase === "VOTING") {

        content.innerHTML = `

            <div class="qr-page">

                <div class="game-title"
                    style="font-size:65px;">
                    VOTE
                </div>

                <p class="subtitle">
                    Who is the Mafia?
                </p>

                <div style="
                    font-size:60px;
                    margin-top:30px;
                ">
                    🗳️
                </div>

            </div>

        `;

        return;
    }


    if (game.phase === "RESULT") {

        showVoteResultsOnScreen();

        return;
    }


    if (game.phase === "GAME_OVER") {

        content.innerHTML = `

            <div class="qr-page">

                <div class="game-title">
                    GAME OVER
                </div>

                <p class="subtitle">
                    ${game.mafia && game.mafia.alive === false
                        ? "THE PLAYERS WIN!"
                        : "THE MAFIA WINS!"}
                </p>

                <div style="
                    margin-top:40px;
                    font-size:80px;
                ">
                    ${game.mafia && game.mafia.alive === false
                        ? "🏆"
                        : "🔴"}
                </div>

                <p style="
                    margin-top:30px;
                    font-size:24px;
                ">
                    The Mafia was:
                    <strong style="color:#e50914;">
                        ${escapeHTML(game.mafia.name)}
                    </strong>
                </p>

            </div>

        `;

    }

}


/* ================= SELECT MODERATOR ================= */

function selectModerator() {

    if (game.players.length < 3) {

        alert(
            "You need at least 3 people to start a game."
        );

        return;
    }

    const randomIndex =
        Math.floor(Math.random() * game.players.length);

    game.moderator = game.players[randomIndex];

    game.moderator.role = "MODERATOR";

    game.phase = "MODERATOR_SELECTED";

    updateScreen();

    updateModerator();

}


/* ================= ASSIGN MAFIA ================= */

function assignMafia() {

    const possiblePlayers =
        game.players.filter(
            player =>
                player !== game.moderator &&
                player.alive
        );

    if (possiblePlayers.length === 0) {
        return;
    }

    const randomIndex =
        Math.floor(
            Math.random() * possiblePlayers.length
        );

    game.mafia = possiblePlayers[randomIndex];

    game.mafia.role = "MAFIA";

    game.phase = "MAFIA_READY";

    updateModerator();

    updatePlayerRole();

}


/* ================= START GAME ================= */

function startGame() {

    if (!game.moderator) {
        alert("Select a moderator first.");
        return;
    }

    if (!game.mafia) {
        assignMafia();
    }

    game.currentRound = 1;

    game.phase = "MAFIA_TURN";

    updateScreen();

    updateModerator();

    updatePlayerRole();

}


/* ================= MAFIA TURN ================= */

function showMafiaControls() {

    const content =
        document.getElementById("moderator-content");

    const livingPlayers =
        game.players.filter(
            player =>
                player.alive &&
                player !== game.moderator &&
                player !== game.mafia
        );

    content.innerHTML = `

        <div class="control-card">

            <h2>🔴 Mafia Information</h2>

            <div class="secret-mafia">
                ${escapeHTML(game.mafia.name)}
            </div>

            <p style="
                color:#aaa;
                margin-top:10px;
            ">
                The Mafia must eliminate one player.
            </p>

        </div>

        <div class="control-card">

            <h2>Living Players</h2>

            <div class="player-list">

                ${livingPlayers.map(player => `

                    <button
                        class="player-choice"
                        onclick="mafiaEliminate('${player.id}')">

                        ${escapeHTML(player.name)}

                    </button>

                `).join("")}

            </div>

        </div>

    `;

}


/* ================= MAFIA ELIMINATION ================= */

function mafiaEliminate(playerId) {

    if (game.phase !== "MAFIA_TURN") {
        return;
    }

    const target =
        game.players.find(
            player =>
                String(player.id) === String(playerId)
        );

    if (!target || !target.alive) {
        return;
    }

    if (
        target === game.mafia ||
        target === game.moderator
    ) {
        return;
    }

    target.alive = false;

    game.mafiaTarget = target;

    game.phase = "DISCUSSION";

    updateScreen();

    updateModerator();

    updatePlayerRole();

}


/* ================= START DISCUSSION ================= */

function startDiscussion() {

    game.phase = "DISCUSSION";

    updateScreen();

    updateModerator();

}


/* ================= START VOTING ================= */

function startVoting() {

    game.votes = {};

    game.phase = "VOTING";

    updateScreen();

    updateModerator();

    updatePlayerRole();

}


/* ================= PLAYER ROLE SCREEN ================= */

function updatePlayerRole() {

    const currentName =
        document.getElementById("player-name").value.trim();

    if (!currentName) {
        return;
    }

    const player =
        game.players.find(
            p =>
                p.name.toLowerCase() ===
                currentName.toLowerCase()
        );

    if (!player) {
        return;
    }

    if (!player.alive) {

        showPlayerMessage(`

            <div class="dead">

                <div class="dead-icon">
                    💀
                </div>

                <h2>YOU ARE OUT</h2>

                <p style="
                    color:#aaa;
                    margin-top:15px;
                ">
                    You have been eliminated.
                </p>

            </div>

        `);

        return;
    }


    if (player === game.moderator) {

        showPlayerMessage(`

            <div class="player-card">

                <h2>🛡️ MODERATOR</h2>

                <p class="player-message">
                    Use the Moderator screen to
                    control the game.
                </p>

            </div>

        `);

        return;
    }


    if (player === game.mafia) {

        if (game.phase === "MAFIA_TURN") {

            const targets =
                game.players.filter(
                    p =>
                        p.alive &&
                        p !== game.mafia &&
                        p !== game.moderator
                );

            showPlayerMessage(`

                <div class="player-card">

                    <div class="player-role mafia">

                        <div class="role-icon">
                            🔴
                        </div>

                        <div class="role-name">
                            YOU ARE THE MAFIA
                        </div>

                        <div class="player-message">
                            Choose one person to eliminate.
                        </div>

                    </div>

                </div>

                <div class="player-actions">

                    <h3>
                        Choose your target
                    </h3>

                    ${targets.map(target => `

                        <button
                            class="player-choice"
                            onclick="playerMafiaEliminate('${target.id}')">

                            ${escapeHTML(target.name)}

                        </button>

                    `).join("")}

                </div>

            `);

        }

        else {

            showPlayerMessage(`

                <div class="player-card">

                    <div class="player-role mafia">

                        <div class="role-icon">
                            🔴
                        </div>

                        <div class="role-name">
                            YOU ARE THE MAFIA
                        </div>

                        <div class="player-message">
                            Stay hidden.
                        </div>

                    </div>

                </div>

            `);

        }

        return;
    }


    /* NORMAL PLAYER */

    if (game.phase === "VOTING") {

        const targets =
            game.players.filter(
                p =>
                    p.alive &&
                    p !== game.moderator &&
                    p !== player
            );

        showPlayerMessage(`

            <div class="player-card">

                <h2>🗳️ VOTE</h2>

                <p class="player-message">
                    Who do you think is the Mafia?
                </p>

            </div>

            <div class="player-actions">

                ${targets.map(target => `

                    <button
                        class="player-choice"
                        onclick="castVote('${target.id}')">

                        ${escapeHTML(target.name)}

                    </button>

                `).join("")}

            </div>

        `);

        return;
    }


    showPlayerMessage(`

        <div class="player-card">

            <div class="player-role innocent">

                <div class="role-icon">
                    🟢
                </div>

                <div class="role-name">
                    YOU ARE INNOCENT
                </div>

                <div class="player-message">

                    ${game.phase === "DISCUSSION"
                        ? "Discuss with the other players."
                        : "Wait for the next phase."}

                </div>

            </div>

        </div>

    `);

}


/* ================= PLAYER MAFIA ACTION ================= */

function playerMafiaEliminate(playerId) {

    mafiaEliminate(playerId);

}


/* ================= CAST VOTE ================= */

function castVote(targetId) {

    const currentName =
        document.getElementById("player-name").value.trim();

    const voter =
        game.players.find(
            p =>
                p.name.toLowerCase() ===
                currentName.toLowerCase()
        );

    if (!voter || !voter.alive) {
        return;
    }

    if (voter === game.moderator) {
        return;
    }

    if (voter === game.mafia) {
        return;
    }

    game.votes[voter.id] = targetId;

    showPlayerMessage(`

        <div class="player-card">

            <h2>✓ VOTE SUBMITTED</h2>

            <p class="player-message">
                Your vote has been recorded.
            </p>

            <div style="
                margin-top:30px;
                font-size:50px;
            ">
                🗳️
            </div>

        </div>

    `);

    updateModerator();

}


/* ================= COUNT VOTES ================= */

function countVotes() {

    const counts = {};

    Object.values(game.votes).forEach(targetId => {

        if (!counts[targetId]) {
            counts[targetId] = 0;
        }

        counts[targetId]++;

    });

    return counts;

}


/* ================= SHOW RESULTS ================= */

function showResults() {

    const counts = countVotes();

    let highestVotes = 0;

    let candidates = [];

    Object.entries(counts).forEach(
        ([playerId, votes]) => {

            if (votes > highestVotes) {

                highestVotes = votes;

                candidates = [playerId];

            }

            else if (votes === highestVotes) {

                candidates.push(playerId);

            }

        }
    );


    if (candidates.length === 0) {

        alert("Nobody voted.");

        return;
    }


    /* Tie */

    if (candidates.length > 1) {

        alert(
            "There is a tie. Start another vote."
        );

        return;
    }


    const eliminated =
        game.players.find(
            player =>
                String(player.id) ===
                String(candidates[0])
        );

    if (!eliminated) {
        return;
    }

    eliminated.alive = false;

    game.phase = "RESULT";

    updateScreen();

    updateModerator();

}


/* ================= RESULT SCREEN ================= */

function showVoteResultsOnScreen() {

    const eliminated =
        game.players.find(
            player => !player.alive &&
                player !== game.mafiaTarget
        );

    /*
        Find the latest player eliminated by vote.
    */

    const deadPlayers =
        game.players.filter(
            player =>
                !player.alive &&
                player !== game.mafiaTarget
        );

    const votedOut =
        deadPlayers.length
            ? deadPlayers[deadPlayers.length - 1]
            : null;


    if (!votedOut) {
        return;
    }


    const isMafia =
        votedOut === game.mafia;


    document.getElementById(
        "screen-content"
    ).innerHTML = `

        <div class="qr-page">

            <div class="game-title"
                style="font-size:55px;">

                ${escapeHTML(votedOut.name)}

            </div>

            <p class="subtitle"
                style="
                    color:${isMafia ? "#e50914" : "#2979ff"};
                ">

                ${isMafia
                    ? "IS THE MAFIA"
                    : "IS NOT THE MAFIA"}

            </p>

            <div style="
                margin-top:40px;
                font-size:80px;
            ">
                ${isMafia ? "🔴" : "🔵"}
            </div>

        </div>

    `;

}


/* ================= CONTINUE GAME ================= */

function continueGame() {

    if (!game.mafia.alive) {

        game.phase = "GAME_OVER";

        updateScreen();

        updateModerator();

        return;
    }


    const livingPlayers =
        game.players.filter(
            player =>
                player.alive &&
                player !== game.moderator
        );

    const livingInnocents =
        livingPlayers.filter(
            player =>
                player !== game.mafia
        );


    /* Mafia wins when Mafia reaches parity */

    if (
        livingInnocents.length <= 1
    ) {

        game.phase = "GAME_OVER";

        updateScreen();

        updateModerator();

        return;

    }


    game.currentRound++;

    game.phase = "MAFIA_TURN";

    updateScreen();

    updateModerator();

    updatePlayerRole();

}


/* ================= MODERATOR UI ================= */

function updateModerator() {

    const content =
        document.getElementById("moderator-content");


    if (!game.moderator) {

        content.innerHTML = `

            <div class="empty-state">

                <h2>Waiting for players</h2>

                <p>
                    ${game.players.length}
                    player(s) have joined.
                </p>

                <div class="control-buttons">

                    <button
                        class="control-btn start"
                        onclick="selectModerator()">

                        SELECT MODERATOR

                    </button>

                </div>

            </div>

        `;

        return;
    }


    if (!game.mafia) {

        content.innerHTML = `

            <div class="control-card">

                <h2>Moderator</h2>

                <div class="secret-mafia"
                    style="color:#00c853;">

                    ${escapeHTML(game.moderator.name)}

                </div>

            </div>

            <div class="control-card">

                <h2>Players</h2>

                ${playerListHTML()}

                <div class="control-buttons">

                    <button
                        class="control-btn danger"
                        onclick="assignMafia()">

                        SECRETLY SELECT MAFIA

                    </button>

                </div>

            </div>

        `;

        return;
    }


    content.innerHTML = `

        <div class="control-card">

            <h2>🛡️ Moderator</h2>

            <p style="color:#aaa;">
                ${escapeHTML(game.moderator.name)}
            </p>

        </div>


        <div class="control-card">

            <h2>🔒 Secret Mafia</h2>

            <div class="secret-mafia">

                ${escapeHTML(game.mafia.name)}

            </div>

        </div>


        <div class="control-card">

            <h2>Game Status</h2>

            <p style="
                color:#aaa;
                margin-bottom:15px;
            ">
                Round ${game.currentRound}
                <br>
                Phase: ${game.phase}
            </p>

            ${playerListHTML()}

        </div>


        <div class="control-card">

            <h2>Controls</h2>

            <div class="control-buttons">

                ${getModeratorControls()}

            </div>

        </div>

    `;


    if (game.phase === "MAFIA_TURN") {
        showMafiaControls();
    }

}


/* ================= MODERATOR CONTROLS ================= */

function getModeratorControls() {

    if (game.phase === "MAFIA_READY") {

        return `

            <button
                class="control-btn start"
                onclick="startGame()">

                START GAME

            </button>

        `;

    }


    if (game.phase === "DISCUSSION") {

        return `

            <button
                class="control-btn start"
                onclick="startVoting()">

                START VOTING

            </button>

        `;

    }


    if (game.phase === "VOTING") {

        return `

            <button
                class="control-btn start"
                onclick="showResults()">

                SHOW VOTE RESULTS

            </button>

        `;

    }


    if (game.phase === "RESULT") {

        return `

            <button
                class="control-btn start"
                onclick="continueGame()">

                CONTINUE GAME

            </button>

        `;

    }


    return "";

}


/* ================= PLAYER LIST ================= */

function playerListHTML() {

    return `

        <div class="player-list">

            ${game.players.map(player => `

                <div class="
                    player-item
                    ${player.alive ? "" : "dead"}
                ">

                    <div>

                        <div class="player-name">

                            ${escapeHTML(player.name)}

                        </div>

                        <div class="player-role-small">

                            ${player === game.moderator
                                ? "MODERATOR"
                                : player === game.mafia
                                    ? "MAFIA"
                                    : "PLAYER"}

                        </div>

                    </div>

                    <div>

                        ${player.alive
                            ? "🟢"
                            : "💀"}

                    </div>

                </div>

            `).join("")}

        </div>

    `;

}


/* ================= PLAYER MESSAGE ================= */

function showPlayerMessage(html) {

    document.getElementById(
        "player-content"
    ).innerHTML = html;

}


/* ================= SECURITY ================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


/* ================= INITIALIZATION ================= */

updateScreen();

updateModerator();
