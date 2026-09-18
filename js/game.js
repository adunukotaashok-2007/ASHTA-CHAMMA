/* =========================================================
   ASHTA CHAMMA - GAME ENGINE & SOUND SYNTHESIS
========================================================= */

const PAWNS_PER_PLAYER = 6;
const ENTRY_THROWS = new Set([1, 6, 12]);

const players = {
    1: { name: "Player 1", color: "player1" },
    2: { name: "Player 2", color: "player2" }
};

let gameState = {
    currentPlayer: 1,
    lastThrow: null,
    gameOver: false,
    waitingForPawn: false,
    movablePawns: [],
    pawns: {
        1: Array(PAWNS_PER_PLAYER).fill(-1),
        2: Array(PAWNS_PER_PLAYER).fill(-1)
    },
    homeCount: { 1: 0, 2: 0 }
};

function resetGameState() {
    gameState = {
        currentPlayer: 1,
        lastThrow: null,
        gameOver: false,
        waitingForPawn: false,
        movablePawns: [],
        pawns: {
            1: Array(PAWNS_PER_PLAYER).fill(-1),
            2: Array(PAWNS_PER_PLAYER).fill(-1)
        },
        homeCount: { 1: 0, 2: 0 }
    };
    renderGame();
    updateStatus("Player 1's Turn", "Throw the sticks");
    updateControlsState();
}

function processThrow(value) {
    if (gameState.gameOver || gameState.waitingForPawn) return;

    gameState.lastThrow = value;
    displayThrow(value);
    playThrowSound();

    const movable = getMovablePawns(gameState.currentPlayer, value);

    if (movable.length === 0) {
        updateStatus(
            `${players[gameState.currentPlayer].name}`,
            `No moves for ${getThrowName(value)}`
        );

        if (ENTRY_THROWS.has(value)) {
            updateStatus(
                `${players[gameState.currentPlayer].name}`,
                `${getThrowName(value)} — Extra throw!`
            );
            gameState.lastThrow = null;
            updateControlsState();
            return;
        }

        setTimeout(switchTurn, 1200);
        return;
    }

    gameState.waitingForPawn = true;
    gameState.movablePawns = movable;
    highlightMovablePawns(movable);
    updateStatus(`${players[gameState.currentPlayer].name}`, "Tap a glowing pawn");
    updateControlsState();
}

function getMovablePawns(player, value) {
    const result = [];
    for (let i = 0; i < PAWNS_PER_PLAYER; i++) {
        const pos = gameState.pawns[player][i];
        if (pos === -1) {
            if (ENTRY_THROWS.has(value)) result.push(i);
            continue;
        }
        if (pos === -2) continue;
        const newPos = calculateNewPosition(player, pos, value);
        if (newPos !== null) result.push(i);
    }
    return result;
}

function calculateNewPosition(player, position, value) {
    const start = START_POSITION[player];
    const relative = ((position - start) + OUTER_PATH.length) % OUTER_PATH.length;
    const newRelative = relative + value;

    if (newRelative >= OUTER_PATH.length) {
        if (newRelative === OUTER_PATH.length) return -2;
        return null;
    }
    return (start + newRelative) % OUTER_PATH.length;
}

function movePawn(player, pawnIndex) {
    if (!gameState.waitingForPawn) return;
    if (player !== gameState.currentPlayer) return;

    const value = gameState.lastThrow;
    const current = gameState.pawns[player][pawnIndex];

    if (current === -1) {
        if (!ENTRY_THROWS.has(value)) return;
        gameState.pawns[player][pawnIndex] = START_POSITION[player];
        captureOpponentIfNeeded(player, START_POSITION[player]);
        playMoveSound();
        afterMove(player, pawnIndex);
        return;
    }

    const newPos = calculateNewPosition(player, current, value);
    if (newPos === null) return;

    if (newPos === -2) {
        gameState.pawns[player][pawnIndex] = -2;
        gameState.homeCount[player]++;
        playHomeSound();
        afterMove(player, pawnIndex);
        return;
    }

    captureOpponentIfNeeded(player, newPos);
    gameState.pawns[player][pawnIndex] = newPos;
    playMoveSound();
    afterMove(player, pawnIndex);
}

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
        updateMessage(`${players[player].name} captured an opponent!`);
    }
}

function afterMove(player, pawnIndex) {
    gameState.waitingForPawn = false;
    gameState.movablePawns = [];
    clearMovableHighlights();
    renderGame();

    if (gameState.homeCount[player] >= PAWNS_PER_PLAYER) {
        gameState.gameOver = true;
        playWinSound();
        updateStatus(`${players[player].name} WINS! 🎉`, "All 6 pawns reached home!");
        updateMessage(`Game over! ${players[player].name} is victorious!`);
        updateControlsState();
        if (window.Multiplayer) window.Multiplayer.sendState();
        return;
    }

    const extraTurn = ENTRY_THROWS.has(gameState.lastThrow) || gameState.pawns[player][pawnIndex] === -2;
    gameState.lastThrow = null;

    if (extraTurn) {
        updateStatus(`${players[player].name}'s Turn`, "Extra throw awarded!");
        if (typeof resetThrowDisplay === "function") setTimeout(resetThrowDisplay, 1500);
    } else {
        switchTurn();
    }

    updateControlsState();
    if (window.Multiplayer) window.Multiplayer.sendState();
}

function switchTurn() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.lastThrow = null;
    gameState.waitingForPawn = false;
    gameState.movablePawns = [];
    clearMovableHighlights();
    renderGame();

    if (typeof setStickColor === "function") setStickColor(gameState.currentPlayer);
    if (typeof resetThrowDisplay === "function") resetThrowDisplay();

    updateStatus(`${players[gameState.currentPlayer].name}'s Turn`, "Throw the sticks");
    updateControlsState();
    playTurnSound();
}

function highlightMovablePawns(pawnIndexes) {
    clearMovableHighlights();
    pawnIndexes.forEach(pawnIndex => {
        const pawn = document.querySelector(`.pawn[data-player="${gameState.currentPlayer}"][data-pawn="${pawnIndex}"]`);
        if (pawn) pawn.classList.add("movable");
    });
}

function renderGame() {
    document.querySelectorAll(".pawn").forEach(p => p.remove());

    for (const player of [1, 2]) {
        for (let i = 0; i < PAWNS_PER_PLAYER; i++) {
            if (typeof getYardSlot === "function") {
                const slot = getYardSlot(player, i);
                if (slot) slot.innerHTML = "";
            }
        }
    }

    for (const player of [1, 2]) {
        for (let i = 0; i < PAWNS_PER_PLAYER; i++) {
            const pos = gameState.pawns[player][i];
            if (pos === -1) {
                renderYardPawn(player, i);
            } else if (pos >= 0) {
                renderBoardPawn(player, i, pos);
            }
        }
    }

    const p1 = document.getElementById("p1Count");
    const p2 = document.getElementById("p2Count");
    if (p1) p1.textContent = `${gameState.homeCount[1]}/6 Home`;
    if (p2) p2.textContent = `${gameState.homeCount[2]}/6 Home`;

    document.getElementById("player1Card")?.classList.toggle("active", gameState.currentPlayer === 1);
    document.getElementById("player2Card")?.classList.toggle("active", gameState.currentPlayer === 2);
}

function renderBoardPawn(player, pawnIndex, position) {
    if (typeof getPathCell === "function") {
        const cell = getPathCell(position);
        if (cell) cell.appendChild(createPawn(player, pawnIndex));
    }
}

function renderYardPawn(player, pawnIndex) {
    if (typeof getYardSlot === "function") {
        const slot = getYardSlot(player, pawnIndex);
        if (slot) slot.appendChild(createPawn(player, pawnIndex));
    }
}

function createPawn(player, pawnIndex) {
    const pawn = document.createElement("div");
    pawn.className = `pawn ${players[player].color}`;
    pawn.dataset.player = player;
    pawn.dataset.pawn = pawnIndex;
    pawn.textContent = pawnIndex + 1;
    return pawn;
}

function getSerializableState() {
    return JSON.parse(JSON.stringify(gameState));
}

function loadRemoteState(remoteState) {
    if (!remoteState) return;
    gameState = JSON.parse(JSON.stringify(remoteState));
    renderGame();

    if (typeof setStickColor === "function") setStickColor(gameState.currentPlayer);

    if (gameState.waitingForPawn && gameState.movablePawns?.length) {
        highlightMovablePawns(gameState.movablePawns);
    } else {
        clearMovableHighlights();
    }

    if (gameState.gameOver) {
        const winner = gameState.homeCount[1] >= PAWNS_PER_PLAYER ? 1 : 2;
        updateStatus(`${players[winner].name} WINS! 🎉`, "Game finished");
    } else {
        updateStatus(
            `${players[gameState.currentPlayer].name}'s Turn`,
            gameState.waitingForPawn ? "Select glowing pawn" : "Throw sticks"
        );
    }
    updateControlsState();
}

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

function updateControlsState() {
    const throwBtn = document.getElementById("throwButton");
    if (!throwBtn) return;

    if (gameState.gameOver || gameState.waitingForPawn) {
        throwBtn.disabled = true;
        return;
    }

    if (window.Multiplayer && window.Multiplayer.connected) {
        throwBtn.disabled = window.Multiplayer.localPlayer !== gameState.currentPlayer;
    } else {
        throwBtn.disabled = false;
    }
}

/* =========================================================
   PROCEDURAL SOUND ENGINE
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

function playNoise(duration, lowFreq, highFreq, volume, type = "bandpass") {
    if (window.soundEnabled === false) return;
    try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(lowFreq, ctx.currentTime);
        if (highFreq > lowFreq) {
            filter.frequency.exponentialRampToValueAtTime(highFreq, ctx.currentTime + duration);
        }

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noiseNode.start();
        noiseNode.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playWoodClick(pitch, duration, volume) {
    if (window.soundEnabled === false) return;
    try {
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

        playNoise(duration * 0.6, 1200, 2000, volume * 0.6, "highpass");
    } catch (e) {}
}

function playThrowSound() {
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            playWoodClick(230 - i * 25, 0.08, 0.12 - i * 0.02);
        }, i * 65);
    }
}

function playMoveSound() {
    playNoise(0.2, 450, 250, 0.05, "bandpass");
    setTimeout(() => playWoodClick(280, 0.09, 0.08), 150);
}

function playCaptureSound() {
    playWoodClick(180, 0.25, 0.25);
    playWoodClick(90, 0.35, 0.15);
}

function playHomeSound() {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => {
            try {
                const ctx = getAudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.52);
            } catch (e) {}
        }, idx * 100);
    });
}

function playTurnSound() {
    [587.33, 880.00].forEach((freq, idx) => {
        setTimeout(() => {
            try {
                const ctx = getAudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.03, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.22);
            } catch (e) {}
        }, idx * 60);
    });
}

function playWinSound() {
    const chords = [
        [261.63, 329.63, 392.00, 523.25],
        [392.00, 493.88, 587.33, 783.99],
        [523.25, 659.25, 783.99, 1046.50]
    ];
    chords.forEach((chord, chordIdx) => {
        setTimeout(() => {
            chord.forEach(freq => {
                try {
                    const ctx = getAudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "triangle";
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.72);
                } catch (e) {}
            });
        }, chordIdx * 250);
    });
}

function initializeGame() {
    if (typeof createBoard === "function") createBoard();
    resetGameState();
}
