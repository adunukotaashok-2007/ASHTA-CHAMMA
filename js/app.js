/* =========================================================
   ASHTA CHAMMA - APP INITIALIZATION & CONTROLS
========================================================= */

window.soundEnabled = true;

document.addEventListener("DOMContentLoaded", () => {
    setupButtons();
    setupPawnInteraction();
    setupMobileAudioUnlock();
    showHome();
});

/* --- SCREEN SWITCHING --- */
function showHome() {
    document.getElementById("homeScreen")?.classList.remove("hidden");
    document.getElementById("gameScreen")?.classList.add("hidden");
}

function showGame() {
    document.getElementById("homeScreen")?.classList.add("hidden");
    document.getElementById("gameScreen")?.classList.remove("hidden");
    
    // Setup initial game state when entering the board
    initializeGame();
    if (typeof setStickColor === "function") setStickColor(1);
    if (typeof resetThrowDisplay === "function") resetThrowDisplay();
    updateMessage("Player 1 starts. Throw the sticks!");
}

/* --- AUDIO UNLOCK FOR MOBILE --- */
function setupMobileAudioUnlock() {
    const unlock = () => {
        getAudioContext();
        document.removeEventListener("touchstart", unlock);
        document.removeEventListener("pointerdown", unlock);
    };
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("pointerdown", unlock, { once: true });
}

/* --- BUTTON EVENTS --- */
function setupButtons() {
    // 🎮 Local Play
    document.getElementById("playLocalButton")?.addEventListener("click", () => {
        getAudioContext();
        Multiplayer.role = "local";
        Multiplayer.connected = false;
        showGame();
    });

    // ← Back to Home
    document.getElementById("backHomeButton")?.addEventListener("click", () => {
        showHome();
    });

    // 🪵 Throw Sticks
    document.getElementById("throwButton")?.addEventListener("click", () => {
        getAudioContext();
        if (gameState.gameOver || gameState.waitingForPawn) return;

        if (Multiplayer.connected && Multiplayer.localPlayer !== gameState.currentPlayer) {
            updateMessage("Wait for your opponent's turn.");
            return;
        }

        animateSticks();
        const value = throwBaraSticks();

        if (!Multiplayer.connected || Multiplayer.role === "host") {
            processThrow(value);
            if (Multiplayer.connected) Multiplayer.sendState();
        } else {
            Multiplayer.sendAction({ type: "throw", value });
        }
    });

    // 🔄 New Game
    document.getElementById("newGameButton")?.addEventListener("click", () => {
        getAudioContext();
        resetGameState();
        if (typeof setStickColor === "function") setStickColor(1);
        if (typeof resetThrowDisplay === "function") resetThrowDisplay();
        playMoveSound();
        if (Multiplayer.connected) Multiplayer.sendState();
        updateMessage("New game started!");
    });

    // 🔊 Sound Toggle
    document.getElementById("soundButton")?.addEventListener("click", () => {
        window.soundEnabled = !window.soundEnabled;
        const btn = document.getElementById("soundButton");
        if (btn) btn.textContent = window.soundEnabled ? "🔊" : "🔇";
        if (window.soundEnabled) {
            getAudioContext();
            playTurnSound();
        }
    });

    // 🌐 Multiplayer: Create Room (Host)
    document.getElementById("createRoomButton")?.addEventListener("click", () => {
        getAudioContext();
        document.getElementById("homeRoomArea")?.classList.remove("hidden");
        document.getElementById("joinInputArea")?.classList.add("hidden");
        Multiplayer.createRoom();
    });

    // 🔗 Multiplayer: Join Room (Guest)
    document.getElementById("joinRoomButton")?.addEventListener("click", () => {
        document.getElementById("homeRoomArea")?.classList.remove("hidden");
        document.getElementById("joinInputArea")?.classList.remove("hidden");
        const status = document.getElementById("homeRoomStatus");
        if (status) status.textContent = "Enter Player 1's code below";
    });

    // 🚀 Multiplayer: Connect
    document.getElementById("connectButton")?.addEventListener("click", () => {
        getAudioContext();
        const code = document.getElementById("roomInput")?.value.trim();
        Multiplayer.joinRoom(code);
    });

    // 📋 Copy Room Code
    document.getElementById("copyCodeButton")?.addEventListener("click", () => {
        const code = document.getElementById("roomCode")?.textContent;
        if (code && code !== "----") {
            navigator.clipboard?.writeText(code).then(() => {
                const st = document.getElementById("homeRoomStatus");
                if (st) st.textContent = "Code copied to clipboard!";
            });
        }
    });

    // 📜 Rules Modal
    const openRules = () => document.getElementById("rulesModal")?.classList.remove("hidden");
    const closeRules = () => document.getElementById("rulesModal")?.classList.add("hidden");

    document.getElementById("rulesButton")?.addEventListener("click", openRules);
    document.getElementById("gameRulesButton")?.addEventListener("click", openRules);
    document.getElementById("closeRules")?.addEventListener("click", closeRules);
    
    document.getElementById("rulesModal")?.addEventListener("click", e => {
        if (e.target.id === "rulesModal") closeRules();
    });
}

/* --- PAWN CLICKS --- */
function setupPawnInteraction() {
    document.addEventListener("click", event => {
        const pawn = event.target.closest(".pawn");
        if (!pawn) return;

        const player = Number(pawn.dataset.player);
        const pawnIndex = Number(pawn.dataset.pawn);

        if (!gameState.waitingForPawn || player !== gameState.currentPlayer) return;

        if (Multiplayer.connected && Multiplayer.localPlayer !== gameState.currentPlayer) {
            updateMessage("Wait for your turn.");
            return;
        }

        if (Multiplayer.connected && Multiplayer.role === "guest") {
            Multiplayer.sendAction({ type: "move", player, pawnIndex });
            return;
        }

        movePawn(player, pawnIndex);
    });
}
