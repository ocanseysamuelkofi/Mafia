/* =====================================================
   MAFIA GAME
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const SITE_URL = "https://cdmafia.netlify.app/";

const GAME_CODE = "MAFIA123";


/* =====================================================
   GAME STATE
===================================================== */

const game = {

    code: GAME_CODE,

    phase: "LOBBY",

    players: [],

    moderator: null,

    mafia: null,

    round: 0,

    votes: {},

    lastVoteEliminated: null,

    mafiaEliminated: null

};


/* =====================================================
   CURRENT PLAYER
===================================================== */

let currentPlayerId = null;


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        generateQRCode();

        updateScreen();

        updateModerator();

        setupGameFromURL();

    }
);


/* =====================================================
   QR CODE
===================================================== */

function generateQRCode() {

    const qr = document.getElementById("qrcode");

    if (!qr) return;

    qr.innerHTML = "";

    const joinURL =
        SITE_URL +
        "?game=" +
        encodeURIComponent(game.code);

    new QRCode(qr, {

        text: joinURL,

        width: 250,

        height: 250,

        colorDark: "#000000",

        colorLight: "#ffffff",

        correctLevel:
            QRCode.CorrectLevel.H

    });

}


/* =====================================================
   URL GAME CODE
===================================================== */

function setupGameFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const code =
        params.get("game");

    if (code) {

        const input =
            document.getElementById(
                "player-name"
            );

        if (input) {

            input.focus();

        }

    }

}


/* =====================================================
   SWITCH VIEW
===================================================== */

function showView(view) {

    document
        .querySelectorAll(".view")
        .forEach(
            element =>
                element.classList.remove(
                    "active"
                )
        );


    if (view === "screen") {

        document
            .getElementById(
                "screen-view"
            )
            .classList.add("active");

    }


    if (view === "player") {

        document
            .getElementById(
                "player-view"
            )
            .classList.add("active");

    }


    if (view === "moderator") {

        document
            .getElementById(
                "moderator-view"
            )
            .classList.add("active");

    }

}


/* =====================================================
   JOIN GAME
===================================================== */

function joinGame() {

    const input =
        document.getElementById(
            "player-name"
        );

    const name =
        input.value.trim();


    if (!name) {

        alert(
            "Please enter your name."
        );

        return;

    }


    if (game.phase !== "LOBBY") {

        alert(
            "This game has already started."
        );

        return;

    }


    const alreadyExists =
        game.players.some(
            player =>
                player.name.toLowerCase() ===
                name.toLowerCase()
        );


    if (alreadyExists) {

        alert(
            "That name is already in the game."
        );

        return;

    }


    const player = {

        id:
            Date.now() +
            Math.random(),

        name: name,

        role: "PLAYER",

        alive: true

    };


    game.players.push(player);

    currentPlayerId =
        player.id;


    input.value = "";


    renderPlayerLobby();

    updateScreen();

    updateModerator();

}


/* =====================================================
   PLAYER LOBBY
===================================================== */

function renderPlayerLobby() {

    const player =
        getCurrentPlayer();

    if (!player) return;


    document.getElementById(
        "player-content"
    ).innerHTML = `

        <div class="player-page">

            <div class="player-icon">
                ✅
            </div>

            <h2>
                You're in!
            </h2>

            <p>
                Welcome,
                <strong>
                    ${escapeHTML(player.name)}
                </strong>
            </p>

            <div class="role-card innocent">

                <div class="role-icon">
                    ⏳
                </div>

                <div class="role-title">
                    WAITING
                </div>

                <div class="role-description">
                    The moderator will start
                    the game soon.
                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   CURRENT PLAYER
===================================================== */

function getCurrentPlayer() {

    return game.players.find(
        player =>
            player.id === currentPlayerId
    );

}


/* =====================================================
   SELECT MODERATOR
===================================================== */

function selectModerator() {

    if (game.players.length < 3) {

        alert(
            "At least 3 players are required."
        );

        return;

    }


    const available =
        [...game.players];


    const index =
        Math.floor(
            Math.random() *
            available.length
        );


    game.moderator =
        available[index];


    game.moderator.role =
        "MODERATOR";


    game.phase =
        "MODERATOR_SELECTED";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   ASSIGN MAFIA
===================================================== */

function assignMafia() {

    if (!game.moderator) {

        alert(
            "Choose the moderator first."
        );

        return;

    }


    const available =
        game.players.filter(
            player =>
                player !== game.moderator &&
                player.alive
        );


    if (!available.length) {

        alert(
            "No players available."
        );

        return;

    }


    const index =
        Math.floor(
            Math.random() *
            available.length
        );


    game.mafia =
        available[index];


    game.mafia.role =
        "MAFIA";


    game.phase =
        "MAFIA_READY";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   START GAME
===================================================== */

function startGame() {

    if (!game.moderator) {

        alert(
            "Moderator has not been selected."
        );

        return;

    }


    if (!game.mafia) {

        assignMafia();

    }


    game.round = 1;

    game.phase =
        "MAFIA_TURN";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   MAFIA ELIMINATION
===================================================== */

function mafiaEliminate(playerId) {

    if (
        game.phase !==
        "MAFIA_TURN"
    ) {

        return;

    }


    const target =
        game.players.find(
            player =>
                String(player.id) ===
                String(playerId)
        );


    if (!target) return;


    if (!target.alive) return;


    if (
        target === game.mafia ||
        target === game.moderator
    ) {

        return;

    }


    target.alive = false;

    game.mafiaEliminated =
        target;


    game.phase =
        "DISCUSSION";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   START DISCUSSION
===================================================== */

function startDiscussion() {

    game.phase =
        "DISCUSSION";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   START VOTING
===================================================== */

function startVoting() {

    game.votes = {};

    game.phase =
        "VOTING";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   PLAYER VOTING
===================================================== */

function voteFor(playerId) {

    const voter =
        getCurrentPlayer();


    if (!voter) return;


    if (!voter.alive) return;


    if (
        voter ===
        game.moderator
    ) {

        return;

    }


    if (voter === game.mafia) {

        return;

    }


    if (
        game.phase !==
        "VOTING"
    ) {

        return;

    }


    if (
        game.votes[voter.id]
    ) {

        alert(
            "You have already voted."
        );

        return;

    }


    const target =
        game.players.find(
            player =>
                String(player.id) ===
                String(playerId)
        );


    if (!target) return;


    if (!target.alive) return;


    if (target === voter) {

        alert(
            "You cannot vote for yourself."
        );

        return;

    }


    game.votes[voter.id] =
        target.id;


    showPlayerMessage(`

        <div class="player-page">

            <div class="player-icon">
                🗳️
            </div>

            <h2>
                VOTE SUBMITTED
            </h2>

            <p>
                Your vote has been recorded.
            </p>

            <div class="role-card innocent">

                <div class="role-icon">
                    ✓
                </div>

                <div class="role-title">
                    WAITING
                </div>

                <div class="role-description">
                    Wait for the moderator
                    to reveal the result.
                </div>

            </div>

        </div>

    `);


    updateModerator();

}


/* =====================================================
   COUNT VOTES
===================================================== */

function countVotes() {

    const counts = {};


    Object.values(
        game.votes
    ).forEach(
        targetId => {

            if (
                !counts[targetId]
            ) {

                counts[targetId] = 0;

            }

            counts[targetId]++;

        }
    );


    return counts;

}


/* =====================================================
   SHOW RESULTS
===================================================== */

function showResults() {

    const counts =
        countVotes();


    if (
        Object.keys(counts).length === 0
    ) {

        alert(
            "Nobody has voted yet."
        );

        return;

    }


    let highest =
        -1;

    let winners = [];


    Object.entries(
        counts
    ).forEach(
        ([id, count]) => {

            if (count > highest) {

                highest = count;

                winners = [id];

            }

            else if (
                count === highest
            ) {

                winners.push(id);

            }

        }
    );


    /* TIE */

    if (winners.length > 1) {

        game.phase =
            "TIE";


        updateScreen();

        updateModerator();

        return;

    }


    const eliminated =
        game.players.find(
            player =>
                String(player.id) ===
                String(winners[0])
        );


    if (!eliminated) return;


    eliminated.alive =
        false;


    game.lastVoteEliminated =
        eliminated;


    game.phase =
        "RESULT";


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   CONTINUE AFTER RESULT
===================================================== */

function continueAfterResult() {

    if (
        game.lastVoteEliminated ===
        game.mafia
    ) {

        game.phase =
            "GAME_OVER";


        updateScreen();

        updateModerator();

        updatePlayerInterface();

        return;

    }


    const living =
        game.players.filter(
            player =>
                player.alive &&
                player !== game.moderator
        );


    const mafiaAlive =
        game.mafia &&
        game.mafia.alive;


    const innocentCount =
        living.filter(
            player =>
                player !== game.mafia
        ).length;


    /* MAFIA WINS */

    if (
        mafiaAlive &&
        innocentCount <= 1
    ) {

        game.phase =
            "GAME_OVER";


        updateScreen();

        updateModerator();

        updatePlayerInterface();

        return;

    }


    game.round++;

    game.phase =
        "MAFIA_TURN";


    game.mafiaEliminated =
        null;

    game.lastVoteEliminated =
        null;


    updateScreen();

    updateModerator();

    updatePlayerInterface();

}


/* =====================================================
   SCREEN
===================================================== */

function updateScreen() {

    const content =
        document.getElementById(
            "screen-content"
        );


    document.getElementById(
        "display-game-code"
    ).textContent =
        game.code;


    if (
        game.phase ===
        "LOBBY"
    ) {

        content.innerHTML = `

            <div class="screen-lobby">

                <h1>
                    MAFIA
                </h1>

                <p class="screen-subtitle">
                    Scan the QR code to join
                </p>

                <div class="qr-wrapper">

                    <div id="qrcode"></div>

                </div>

                <div class="game-code">

                    GAME CODE:
                    <strong>
                        ${game.code}
                    </strong>

                </div>

                <div id="screen-player-count">

                    ${game.players.length}
                    player(s) joined

                </div>

                <div id="screen-player-list">

                    ${game.players
                        .map(
                            p =>
                                escapeHTML(
                                    p.name
                                )
                        )
                        .join(" • ")}

                </div>

            </div>

        `;

        generateQRCode();

        return;

    }


    if (
        game.phase ===
        "MODERATOR_SELECTED"
    ) {

        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    🛡️
                </div>

                <h1>
                    MODERATOR
                </h1>

                <p>
                    ${escapeHTML(
                        game.moderator.name
                    )}
                    has been selected.
                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "MAFIA_READY"
    ) {

        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    🔒
                </div>

                <h1>
                    GET READY
                </h1>

                <p>
                    The moderator is
                    preparing the game.
                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "MAFIA_TURN"
    ) {

        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    🔴
                </div>

                <h1>
                    MAFIA TURN
                </h1>

                <p>
                    The Mafia is choosing
                    someone...
                </p>

                <p>
                    Round ${game.round}
                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "DISCUSSION"
    ) {

        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    🗣️
                </div>

                <h1>
                    DISCUSSION
                </h1>

                <p>
                    Discuss who you think
                    the Mafia is.
                </p>

                <p>
                    Round ${game.round}
                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "VOTING"
    ) {

        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    🗳️
                </div>

                <h1>
                    VOTE
                </h1>

                <p>
                    Choose who you think
                    is the Mafia.
                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "TIE"
    ) {

        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    ⚖️
                </div>

                <h1>
                    TIE
                </h1>

                <p>
                    The vote is tied.
                </p>

                <p>
                    A new vote is required.
                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "RESULT"
    ) {

        const player =
            game.lastVoteEliminated;


        const mafia =
            player ===
            game.mafia;


        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">
                    ${mafia
                        ? "🔴"
                        : "🔵"}
                </div>

                <h1>
                    ${escapeHTML(
                        player.name
                    )}
                </h1>

                <p style="
                    color:
                    ${mafia
                        ? "#e50914"
                        : "#2979ff"};
                ">

                    ${mafia
                        ? "IS THE MAFIA"
                        : "IS NOT THE MAFIA"}

                </p>

            </div>

        `;

        return;

    }


    if (
        game.phase ===
        "GAME_OVER"
    ) {

        const mafiaFound =
            !game.mafia.alive;


        content.innerHTML = `

            <div class="game-screen">

                <div class="big-screen-icon">

                    ${mafiaFound
                        ? "🏆"
                        : "🔴"}

                </div>

                <h1>

                    ${mafiaFound
                        ? "PLAYERS WIN"
                        : "MAFIA WINS"}

                </h1>

                <p>

                    The Mafia was:
                    <strong>
                        ${escapeHTML(
                            game.mafia.name
                        )}
                    </strong>

                </p>

            </div>

        `;

    }

}


/* =====================================================
   MODERATOR PANEL
===================================================== */

function updateModerator() {

    const content =
        document.getElementById(
            "moderator-content"
        );


    if (
        game.players.length === 0
    ) {

        content.innerHTML = `

            <div class="empty">

                <h2>
                    Waiting for players
                </h2>

                <p>
                    Players will appear here
                    when they join.
                </p>

            </div>

        `;

        return;

    }


    if (
        !game.moderator
    ) {

        content.innerHTML = `

            <div class="control-card">

                <h2>
                    Players
                </h2>

                ${playerListHTML()}

                <div class="control-buttons">

                    <button
                        class="control-button start"
                        onclick="selectModerator()">

                        SELECT MODERATOR

                    </button>

                </div>

            </div>

        `;

        return;

    }


    content.innerHTML = `

        <div class="control-card">

            <h2>
                Moderator
            </h2>

            <div class="secret-mafia"
                 style="color:#00d26a">

                ${escapeHTML(
                    game.moderator.name
                )}

            </div>

        </div>


        <div class="control-card">

            <h2>
                🔒 Secret Mafia
            </h2>

            <div class="secret-mafia">

                ${game.mafia
                    ? escapeHTML(
                        game.mafia.name
                    )
                    : "Not selected yet"}

            </div>

        </div>


        <div class="control-card">

            <h2>
                Players
            </h2>

            ${playerListHTML()}

        </div>


        <div class="control-card">

            <h2>
                Game Controls
            </h2>

            <div class="control-buttons">

                ${moderatorButtons()}

            </div>

        </div>

    `;

}


/* =====================================================
   MODERATOR BUTTONS
===================================================== */

function moderatorButtons() {

    if (
        !game.mafia
    ) {

        return `

            <button
                class="control-button danger"
                onclick="assignMafia()">

                🔒 SELECT MAFIA

            </button>

        `;

    }


    if (
        game.phase ===
        "MAFIA_READY"
    ) {

        return `

            <button
                class="control-button start"
                onclick="startGame()">

                ▶ START GAME

            </button>

        `;

    }


    if (
        game.phase ===
        "DISCUSSION"
    ) {

        return `

            <button
                class="control-button start"
                onclick="startVoting()">

                🗳️ START VOTING

            </button>

        `;

    }


    if (
        game.phase ===
        "VOTING"
    ) {

        const totalVoters =
            game.players.filter(
                player =>
                    player.alive &&
                    player !==
                        game.moderator
            ).length;


        const submitted =
            Object.keys(
                game.votes
            ).length;


        return `

            <p style="
                width:100%;
                color:#aaa;
            ">

                ${submitted}
                /
                ${totalVoters}
                votes submitted.

            </p>

            <button
                class="control-button start"
                onclick="showResults()">

                SHOW RESULTS

            </button>

        `;

    }


    if (
        game.phase ===
        "RESULT"
    ) {

        return `

            <button
                class="control-button start"
                onclick="continueAfterResult()">

                ▶ CONTINUE GAME

            </button>

        `;

    }


    if (
        game.phase ===
        "TIE"
    ) {

        return `

            <button
                class="control-button start"
                onclick="startVoting()">

                🔄 REVOTE

            </button>

        `;

    }


    if (
        game.phase ===
        "MAFIA_TURN"
    ) {

        return `

            <p style="color:#aaa">

                Waiting for Mafia
                to choose...

            </p>

        `;

    }


    if (
        game.phase ===
        "GAME_OVER"
    ) {

        return `

            <button
                class="control-button start"
                onclick="location.reload()">

                🔄 NEW GAME

            </button>

        `;

    }


    return "";

}


/* =====================================================
   MAFIA CONTROLS FOR MODERATOR
===================================================== */

function mafiaControls() {

    const targets =
        game.players.filter(
            player =>
                player.alive &&
                player !==
                    game.moderator &&
                player !==
                    game.mafia
        );


    return `

        <div class="control-card">

            <h2>
                🔪 Mafia Target
            </h2>

            <p style="
                color:#aaa;
                margin-bottom:15px;
            ">

                The Mafia must eliminate
                one living player.

            </p>

            <div class="player-grid">

                ${targets.map(
                    player => `

                    <button
                        class="choice-button"
                        onclick="
                            mafiaEliminate(
                                '${player.id}'
                            )
                        ">

                        ${escapeHTML(
                            player.name
                        )}

                    </button>

                `
                ).join("")}

            </div>

        </div>

    `;

}


/* =====================================================
   PLAYER LIST
===================================================== */

function playerListHTML() {

    return `

        <div class="player-grid">

            ${game.players.map(
                player => `

                <div class="
                    player-item
                    ${player.alive
                        ? ""
                        : "dead"}
                ">

                    <div>

                        <div class="
                            player-item-name
                        ">

                            ${escapeHTML(
                                player.name
                            )}

                        </div>

                        <div class="
                            player-item-role
                        ">

                            ${
                                player ===
                                game.moderator
                                    ? "MODERATOR"
                                    : player ===
                                      game.mafia
                                        ? "MAFIA"
                                        : "PLAYER"
                            }

                        </div>

                    </div>

                    <div>

                        ${
                            player.alive
                                ? "🟢"
                                : "💀"
                        }

                    </div>

                </div>

            `
            ).join("")}

        </div>

    `;

}


/* =====================================================
   PLAYER INTERFACE
===================================================== */

function updatePlayerInterface() {

    const player =
        getCurrentPlayer();


    if (!player) return;


    if (!player.alive) {

        showPlayerMessage(`

            <div class="dead-player">

                <div class="skull">
                    💀
                </div>

                <h2>
                    YOU ARE OUT
                </h2>

                <p>
                    You have been eliminated.
                </p>

            </div>

        `);

        return;

    }


    if (
        player ===
        game.moderator
    ) {

        showPlayerMessage(`

            <div class="player-page">

                <div class="player-icon">
                    🛡️
                </div>

                <h2>
                    YOU ARE THE MODERATOR
                </h2>

                <p>
                    Use the moderator panel
                    to control the game.
                </p>

            </div>

        `);

        return;

    }


    if (
        player ===
        game.mafia
    ) {

        if (
            game.phase ===
            "MAFIA_TURN"
        ) {

            const targets =
                game.players.filter(
                    p =>
                        p.alive &&
                        p !==
                            game.moderator &&
                        p !==
                            game.mafia
                );


            showPlayerMessage(`

                <div class="player-page">

                    <div class="
                        role-card mafia
                    ">

                        <div class="role-icon">
                            🔴
                        </div>

                        <div class="role-title">
                            YOU ARE THE MAFIA
                        </div>

                        <div class="
                            role-description
                        ">

                            Choose one person
                            to eliminate.

                        </div>

                    </div>

                </div>

                <div class="
                    choice-container
                ">

                    <h3>
                        Choose your target
                    </h3>

                    ${targets.map(
                        target => `

                        <button
                            class="
                                choice-button
                            "
                            onclick="
                                mafiaEliminate(
                                    '${target.id}'
                                )
                            ">

                            ${escapeHTML(
                                target.name
                            )}

                        </button>

                    `
                    ).join("")}

                </div>

            `);

        }

        else {

            showPlayerMessage(`

                <div class="player-page">

                    <div class="
                        role-card mafia
                    ">

                        <div class="role-icon">
                            🔴
                        </div>

                        <div class="role-title">
                            YOU ARE THE MAFIA
                        </div>

                        <div class="
                            role-description
                        ">

                            Stay hidden.
                            Wait for your next turn.

                        </div>

                    </div>

                </div>

            `);

        }

        return;

    }


    /* NORMAL PLAYER */

    if (
        game.phase ===
        "VOTING"
    ) {

        const targets =
            game.players.filter(
                p =>
                    p.alive &&
                    p !==
                        game.moderator &&
                    p !== player
            );


        showPlayerMessage(`

            <div class="player-page">

                <div class="player-icon">
                    🗳️
                </div>

                <h2>
                    WHO IS THE MAFIA?
                </h2>

                <p>
                    Choose one player.
                </p>

            </div>

            <div class="
                choice-container
            ">

                ${targets.map(
                    target => `

                    <button
                        class="
                            choice-button
                        "
                        onclick="
                            voteFor(
                                '${target.id}'
                            )
                        ">

                        ${escapeHTML(
                            target.name
                        )}

                    </button>

                `
                ).join("")}

            </div>

        `);

        return;

    }


    if (
        game.phase ===
        "DISCUSSION"
    ) {

        showPlayerMessage(`

            <div class="player-page">

                <div class="player-icon">
                    🗣️
                </div>

                <h2>
                    DISCUSS
                </h2>

                <p>
                    Talk with the other
                    players and decide
                    who you suspect.
                </p>

            </div>

        `);

        return;

    }


    showPlayerMessage(`

        <div class="player-page">

            <div class="
                role-card innocent
            ">

                <div class="role-icon">
                    🟢
                </div>

                <div class="role-title">
                    YOU ARE INNOCENT
                </div>

                <div class="
                    role-description
                ">

                    Watch carefully.
                    The Mafia is hiding
                    among you.

                </div>

            </div>

        </div>

    `);

}


/* =====================================================
   SHOW PLAYER MESSAGE
===================================================== */

function showPlayerMessage(html) {

    document.getElementById(
        "player-content"
    ).innerHTML =
        html;

}


/* =====================================================
   MAFIA TURN FOR CURRENT PLAYER
===================================================== */

function refreshCurrentPlayer() {

    updatePlayerInterface();

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}


/* =====================================================
   MAKE MODERATOR PANEL SHOW MAFIA CONTROLS
===================================================== */

const originalUpdateModerator =
    updateModerator;


/*
   Add Mafia target controls after
   the normal moderator panel.
*/

function refreshModerator() {

    originalUpdateModerator();

    if (
        game.phase ===
        "MAFIA_TURN"
    ) {

        const content =
            document.getElementById(
                "moderator-content"
            );

        content.innerHTML +=
            mafiaControls();

    }

}


/* =====================================================
   REPLACE NORMAL UPDATE CALLS
===================================================== */

const oldUpdateModerator =
    updateModerator;

updateModerator =
    function () {

        oldUpdateModerator();

        if (
            game.phase ===
            "MAFIA_TURN"
        ) {

            const content =
                document.getElementById(
                    "moderator-content"
                );

            content.innerHTML +=
                mafiaControls();

        }

    };


/* =====================================================
   PLAYER NAME ENTER KEY
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter"
        ) {

            const input =
                document.getElementById(
                    "player-name"
                );

            if (
                document.activeElement ===
                input
            ) {

                joinGame();

            }

        }

    }
);
