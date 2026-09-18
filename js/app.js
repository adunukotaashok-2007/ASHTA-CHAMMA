/* =========================================================
   ASHTA CHAMMA - APP INITIALIZATION & CONTROLS
========================================================= */

window.soundEnabled = true;

document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
    setupButtons();
    setupPawnInteraction();
    setupMobileAudioUnlock();
    updateMessage("Player 1 starts. Throw the Bara sticks!");
});

function setupMobileAudioUnlock() {
    const unlock = () => {
        getAudioContext();
        document.removeEventListener("touchstart", unlock);
        document.removeEventListener("pointerdown", unlock);
    };
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("pointerdown", unlock, { once: true });
}

function setupButtons() {
    const throwButton = document.getElementById("throwButton");

    throwButton?.addEventListener("click", () => {
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

    document.getElementById("newGameButton")?.addEventListener("click", () => {
        getAudioContext();
        resetGameState();
        playMoveSound();
        if (Multiplayer.connected) Multiplayer.sendState();
        updateMessage("New game started!");
    });

    document.getElementById("soundButton")?.addEventListener("click", () => {
        window.soundEnabled = !window.soundEnabled;
        const button = document.getElementById("soundButton");
        if (window.soundEnabled) {
            button.textContent = "🔊 Sound ON";
            getAudioContext();
            playTurnSound();
        } else {
            button.textContent = "🔇 Sound OFF";
        }
    });

    document.getElementById("createRoomButton")?.addEventListener("click", () => {
        getAudioContext();
        document.getElementById("roomArea")?.classList.remove("hidden");
        document.getElementById("joinInputArea")?.classList.add("hidden");
        Multiplayer.createRoom();
    });

    document.getElementById("joinRoomButton")?.addEventListener("click", () => {
        document.getElementById("roomArea")?.classList.remove("hidden");
        document.getElementById("joinInputArea")?.classList.remove("hidden");
        updateMessage("Enter Player 1's room code and tap Connect.");
    });

    document.getElementById("connectButton")?.addEventListener("click", () => {
        getAudioContext();
        const input = document.getElementById("roomInput");
        Multiplayer.joinRoom(input?.value);
    });

    document.getElementById("copyCodeButton")?.addEventListener("click", () => {
        const code = document.getElementById("roomCode")?.textContent;
        if (code && code !== "----") {
            navigator.clipboard.writeText(code).then(() => {
                updateMessage("Room code copied to clipboard!");
            });
        }
    });

    document.getElementById("rulesButton")?.addEventListener("click", () => {
        document.getElementById("rulesModal")?.classList.remove("hidden");
    });

    document.getElementById("closeRules")?.addEventListener("click", () => {
        document.getElementById("rulesModal")?.classList.add("hidden");
    });

    document.getElementById("rulesModal")?.addEventListener("click", e => {
        if (e.target.id === "rulesModal") {
            e.target.classList.add("hidden");
        }
    });
}

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
