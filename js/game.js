/* =========================================================
   ASHTA CHAMMA - GAME ENGINE
========================================================= */

const PAWNS_PER_PLAYER = 6;
const ENTRY_THROWS = new Set([1, 6, 12]);

const players = {
    1: { name: "Player 1", color: "player1" },
    2: { name: "Player 2", color: "player2" }
};

/*
    Game state.
    Pawn position codes:
      -1 = in yard (not yet entered)
       0+ = on outer path index
      -2 = home (finished)
*/
let gameState = {
    currentPlayer: 1,
    lastThrow: null,
    gameOver: false,
    pawns: {
        1: Array(PAWNS_PER_PLAYER).fill(-1),
        2: Array(PAWNS_PER_PLAYER).fill(-1)
    },
    homeCount: { 1: 0, 2: 0 }
};

let waitingForPawn = false;

/* ---------------------------------------------------------
   RESET GAME
--------------------------------------------------------- */
function resetGameState() {
    gameState = {
        currentPlayer: 1,
        lastThrow: null,
        gameOver: false,
        pawns: {
            1: Array(PAWNS_PER_PLAYER).fill(-1),
            2: Array(PAWNS_PER_PLAYER).fill(-1)
        },
        homeCount: { 1: 0, 2: 0 }
    };
    waitingForPawn = false;
    renderGame();
    updateStatus("Player 1's Turn", "Throw the Bara sticks");
}

/* ---------------------------------------------------------
   PROCESS A THROW
--------------------------------------------------------- */
function processThrow(value) {
    if (gameState.gameOver) return;
    if (waitingForPawn) return;

    gameState.lastThrow = value;
    displayThrow(value);
    playThrowSound();

    const movable = getMovablePawns(gameState.currentPlayer, value);

    if (movable.length === 0) {
        updateStatus(
            `${players[gameState.currentPlayer].name}`,
            `No legal move for ${getThrowName(value)}`
        );

        // Entry throws still give another throw
        if (ENTRY_THROWS.has(value)) {
            updateStatus(
                `${players[gameState.currentPlayer].name}`,
                `${getThrowName(value)} — throw again`
            );
            gameState.lastThrow = null;
            return;
        }

        switchTurn();
        return;
    }

    waitingForPawn = true;
    highlightMovablePawns(movable);
    updateStatus(
        `${players[gameState.currentPlayer].name}`,
        "Select a highlighted pawn"
    );
}

/* ---------------------------------------------------------
   GET MOVABLE PAWNS
--------------------------------------------------------- */
function getMovablePawns(player, value) {
    const result = [];

    for (let pawnIndex = 0; pawnIndex < PAWNS_PER_PLAYER; pawnIndex++) {
        const position = gameState.pawns[player][pawnIndex];

        // Yard - needs entry throw
        if (position === -1) {
            if (ENTRY_THROWS.has(value)) {
                result.push(pawnIndex);
            }
            continue;
        }

        // Already home
        if (position === -2) continue;

        // On path
        const newPosition = calculateNewPosition(player, position, value);
        if (newPosition !== null) {
            result.push(pawnIndex);
        }
    }

    return result;
}

/* ---------------------------------------------------------
   CALCULATE NEW POSITION
--------------------------------------------------------- */
function calculateNewPosition(player, position, value) {
    const playerStart = START_POSITION[player];
    const relative = ((position - playerStart) + OUTER_PATH.length) % OUTER_PATH.length;
    const newRelative = relative + value;

    // Complete one full route -> enter home
    if (newRelative >= OUTER_PATH.length) {
        // Only exact landing counts as home
        if (newRelative === OUTER_PATH.length) {
            return -2;
        }
        // Overshoot -> invalid move
        return null;
    }

    return (playerStart + newRelative) % OUTER_PATH.length;
}

/* ---------------------------------------------------------
   MOVE PAWN
--------------------------------------------------------- */
function movePawn(player, pawnIndex) {
    if (!waitingForPawn) return;
    if (player !== gameState.currentPlayer) return;

    const value = gameState.lastThrow;
    const current = gameState.pawns[player][pawnIndex];

    // Enter pawn from yard
    if (current === -1) {
        if (!ENTRY_THROWS.has(value)) return;
        gameState.pawns[player][pawnIndex] = START_POSITION[player];
        playMoveSound();
        afterMove(player, pawnIndex);
        return;
    }

    // Normal move
    const newPosition = calculateNewPosition(player, current, value);
    if (newPosition === null) return;

    // Home
    if (newPosition === -2) {
        gameState.pawns[player][pawnIndex] = -2;
        gameState.homeCount[player]++;
        playHomeSound();
        afterMove(player, pawnIndex);
        return;
    }

    // Attempt capture
    captureOpponentIfNeeded(player, newPosition);

    gameState.pawns[player][pawnIndex] = newPosition;
    playMoveSound();
    afterMove(player, pawnIndex);
}

/* ---------------------------------------------------------
   CAPTURE OPPONENT
--------------------------------------------------------- */
function captureOpponentIfNeeded(player, position) {
    if (SAFE_POSITIONS.has(position)) return;

    const opponent = player === 1 ? 2 : 1;
    let captured = false;

    for (let i = 0; i < PAWNS_PER_PLAYER; i++) {
        if (gameState.pawns[opponent][i] === position) {
            gameState.pawns[opponent][i] = -1;
            captured = true;
        }
    }

    if (captured) {
        playCaptureSound();
        updateMessage(`${players[player].name} captured a pawn!`);
    }
}

/* ---------------------------------------------------------
   AFTER MOVE
--------------------------------------------------------- */
function afterMove(player, pawnIndex) {
    waitingForPawn = false;
    clearMovableHighlights();
    renderGame();

    // Check win
    if (gameState.homeCount[player] >= PAWNS_PER_PLAYER) {
        gameState.gameOver = true;
        playWinSound();
        updateStatus(
            `${players[player].name} WINS! 🎉`,
            "All 6 pawns reached home"
        );
        updateMessage(`${players[player].name} has won the game!`);

        if (window.Multiplayer) window.Multiplayer.sendState();
        return;
    }

    // Extra turn conditions
    const extraTurn = ENTRY_THROWS.has(gameState.lastThrow) ||
                      gameState.pawns[player][pawnIndex] === -2;

    if (extraTurn) {
        gameState.lastThrow = null;
        updateStatus(
            `${players[player].name}'s Turn`,
            "Extra throw!"
        );
    } else {
        switchTurn();
    }

    if (window.Multiplayer) window.Multiplayer.sendState();
}

/* ---------------------------------------------------------
   SWITCH TURN
--------------------------------------------------------- */
function switchTurn() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.lastThrow = null;
    waitingForPawn = false;
    clearMovableHighlights();
    renderGame();

    updateStatus(
        `${players[gameState.currentPlayer].name}'s Turn`,
        "Throw the Bara sticks"
    );

    playTurnSound();
}

/* ---------------------------------------------------------
   HIGHLIGHT MOVABLE PAWNS
--------------------------------------------------------- */
function highlightMovablePawns(pawnIndexes) {
    clearMovableHighlights();
    pawnIndexes.forEach(pawnIndex => {
        const pawn = document.querySelector(
            `.pawn[data-player="${gameState.currentPlayer}"][data-pawn="${pawnIndex}"]`
        );
        highlightPawn(pawn);
    });
}

/* ---------------------------------------------------------
   RENDER GAME
--------------------------------------------------------- */
function renderGame() {
    // Clear all pawns
    document.querySelectorAll(".pawn").forEach(pawn => pawn.remove());

    // Render pawns
    for (const player of [1, 2]) {
        for (let pawnIndex = 0; pawnIndex < PAWNS_PER_PLAYER; pawnIndex++) {
            const position = gameState.pawns[player][pawnIndex];

            if (position === -1) {
                renderYardPawn(player, pawnIndex);
            } else if (position === -2) {
                // Home pawns are shown as count on player card
            } else {
                renderBoardPawn(player, pawnIndex, position);
            }
        }
    }

    // Update home counts
    const p1 = document.getElementById("p1Count");
    const p2 = document.getElementById("p2Count");
    if (p1) p1.textContent = `${gameState.homeCount[1]}/6 Home`;
    if (p2) p2.textContent = `${gameState.homeCount[2]}/6 Home`;

    // Highlight active player
    document.getElementById("player1Card")
        ?.classList.toggle("active", gameState.currentPlayer === 1);
    document.getElementById("player2Card")
        ?.classList.toggle("active", gameState.currentPlayer === 2);
}

/* ---------------------------------------------------------
   RENDER BOARD PAWN
--------------------------------------------------------- */
function renderBoardPawn(player, pawnIndex, position) {
    const cell = getPathCell(position);
    if (!cell) return;
    const pawn = createPawn(player, pawnIndex);
    cell.appendChild(pawn);
}

/* ---------------------------------------------------------
   RENDER YARD PAWN
--------------------------------------------------------- */
function renderYardPawn(player, pawnIndex) {
    const yard = player === 1 ? PLAYER1_YARD : PLAYER2_YARD;
    const coordinate = yard[pawnIndex];
    if (!coordinate) return;

    const cell = getCell(coordinate[0], coordinate[1]);
    if (!cell) return;

    const pawn = createPawn(player, pawnIndex);
    cell.appendChild(pawn);
}

/* ---------------------------------------------------------
   CREATE PAWN ELEMENT
--------------------------------------------------------- */
function createPawn(player, pawnIndex) {
    const pawn = document.createElement("div");
    pawn.className = `pawn ${players[player].color}`;
    pawn.dataset.player = player;
    pawn.dataset.pawn = pawnIndex;
    pawn.textContent = pawnIndex + 1;
    return pawn;
}

/* ---------------------------------------------------------
   SERIALIZE STATE (multiplayer)
--------------------------------------------------------- */
function getSerializableState() {
    return JSON.parse(JSON.stringify(gameState));
}

/* ---------------------------------------------------------
   LOAD REMOTE STATE
--------------------------------------------------------- */
function loadRemoteState(remoteState) {
    if (!remoteState) return;

    gameState = JSON.parse(JSON.stringify(remoteState));
    waitingForPawn = false;
    clearMovableHighlights();
    renderGame();

    if (gameState.gameOver) {
        const winner = gameState.homeCount[1] >= 6 ? 1 : 2;
        updateStatus(`${players[winner].name} WINS! 🎉`, "Game finished");
    } else {
        updateStatus(
            `${players[gameState.currentPlayer].name}'s Turn`,
            gameState.lastThrow
                ? `Last throw: ${getThrowName(gameState.lastThrow)}`
                : "Throw the Bara sticks"
        );
    }
}

/* ---------------------------------------------------------
   STATUS / MESSAGE UI
--------------------------------------------------------- */
function updateStatus(title, subtitle) {
    const turn = document.getElementById("turnText");
    const throwText = document.getElementById("throwText");
    if (turn) turn.textContent = title;
    if (throwText) throwText.textContent = subtitle;
}

function updateMessage(message) {
    const box = document.getElementById("messageBox");
    if (box) box.textContent = message;
}

/* =========================================================
   ADVANCED PROCEDURAL SOUND ENGINE
========================================================= */

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
    return audioContext;
}

/**
 * Filtered noise generator (used for scrapes, impacts, crackle).
 */
function playNoise(duration, lowFreq, highFreq, volume, type = "bandpass") {
    if (window.soundEnabled === false) return;

    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(lowFreq, ctx.currentTime);
    if (highFreq > lowFreq) {
        filter.frequency.exponentialRampToValueAtTime(highFreq, ctx.currentTime + duration);
    }
    filter.Q.value = 2.0;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + duration);
}

/**
 * Wood clack: sine sweep + high-pass noise crackle.
 */
function playWoodClick(pitch, duration, volume) {
    if (window.soundEnabled === false) return;

    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, ctx.currentTime + duration);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);

    playNoise(duration * 0.6, 1200, 2000, volume * 0.7, "highpass");
}

/**
 * 1. THROW STICKS - realistic wooden bounce cascade.
 */
function playThrowSound() {
    if (window.soundEnabled === false) return;

    const bounces = 4;
    let delay = 0;

    for (let i = 0; i < bounces; i++) {
        setTimeout(() => {
            const pitch = 220 - (i * 25) + (Math.random() * 30);
            const duration = 0.08 - (i * 0.01);
            const vol = 0.12 - (i * 0.02);
            playWoodClick(pitch, duration, vol);
        }, delay);
        delay += 45 + (Math.random() * 35);
    }
}

/**
 * 2. MOVE PAWN - slide + land plop.
 */
function playMoveSound() {
    if (window.soundEnabled === false) return;
    playNoise(0.25, 450, 250, 0.05, "bandpass");
    setTimeout(() => {
        playWoodClick(280, 0.1, 0.08);
    }, 180);
}

/**
 * 3. CAPTURE - dramatic knock-out.
 */
function playCaptureSound() {
    if (window.soundEnabled === false) return;
    playWoodClick(180, 0.25, 0.25);
    playWoodClick(90, 0.35, 0.15);
    setTimeout(() => {
        playNoise(0.3, 1500, 300, 0.08, "bandpass");
    }, 30);
}

/**
 * 4. HOME - pentatonic chime arpeggio.
 */
function playHomeSound() {
    if (window.soundEnabled === false) return;

    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
        setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.62);
        }, idx * 100);
    });
}

/**
 * 5. TURN CHANGE - dual-tone bell.
 */
function playTurnSound() {
    if (window.soundEnabled === false) return;

    const ctx = getAudioContext();
    const tones = [587.33, 880.00];

    tones.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
    });
}

/**
 * 6. WIN - triumphant multi-chord fanfare with vibrato.
 */
function playWinSound() {
    if (window.soundEnabled === false) return;

    const ctx = getAudioContext();
    const chords = [
        [261.63, 329.63, 392.00, 523.25],
        [392.00, 493.88, 587.33, 783.99],
        [523.25, 659.25, 783.99, 1046.50]
    ];

    chords.forEach((chord, chordIdx) => {
        setTimeout(() => {
            chord.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);

                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.frequency.value = 6;
                lfoGain.gain.value = 4;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);

                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

                osc.connect(gain);
                gain.connect(ctx.destination);

                lfo.start();
                osc.start();
                lfo.stop(ctx.currentTime + 0.8);
                osc.stop(ctx.currentTime + 0.82);
            });
        }, chordIdx * 250);
    });
}

/* ---------------------------------------------------------
   INITIALIZE GAME
--------------------------------------------------------- */
function initializeGame() {
    createBoard();
    resetGameState();
}
