/* =========================================================
   ASHTA CHAMMA - APPLICATION ENTRY POINT
========================================================= */

window.soundEnabled = true;

/* ---------------------------------------------------------
   DOM READY
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
    setupButtons();
    setupPawnInteraction();
    updateMessage("Player 1 starts. Throw the Bara sticks!");
});

/* ---------------------------------------------------------
   SETUP BUTTONS
--------------------------------------------------------- */
function setupButtons() {

    /* THROW STICKS */
    const throwButton = document.getElementById("throwButton");

    throwButton?.addEventListener("click", () => {
        getAudioContext();

        if (gameState.gameOver) return;

        // In online mode, only current player can throw
        if (Multiplayer.connected &&
            Multiplayer.localPlayer !== gameState.currentPlayer) {
            updateMessage("Wait for the other player.");
            return;
        }

        if (waitingForPawn) {
            updateMessage("Select your highlighted pawn first.");
            return;
        }

        // Animate sticks
        animateSticks();

        // Generate throw value
        const value = throwBaraSticks();

        // Local game OR host applies directly
        if (!Multiplayer.connected || Multiplayer.role === "host") {
            processThrow(value);
            if (Multiplayer.connected) {
                Multiplayer.sendState();
            }
        } else {
            // Guest sends throw request to host
            Multiplayer.sendAction({ type: "throw", value });
        }
    });

    /* NEW GAME */
    document.getElementById("newGameButton")?.addEventListener("click", () => {
        getAudioContext();
        resetGameState();
        playMoveSound();
        if (Multiplayer.connected) {
            Multiplayer.sendState();
        }
        updateMessage("New game started!");
    });

    /* SOUND TOGGLE */
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

    /* CREATE ROOM */
    document.getElementById("createRoomButton")?.addEventListener("click", () => {
        getAudioContext();
        document.getElementById("roomArea")?.classList.remove("hidden");
        Multiplayer.createRoom();
    });

    /* JOIN ROOM */
    document.getElementById("joinRoomButton")?.addEventListener("click", () => {
        document.getElementById("roomArea")?.classList.remove("hidden");
        updateMessage("Enter Player 1's room code.");
    });

    /* CONNECT */
    document.getElementById("connectButton")?.addEventListener("click", () => {
        getAudioContext();
        const input = document.getElementById("roomInput");
        const roomCode = input?.value.trim();
        Multiplayer.joinRoom(roomCode);
    });

    /* RULES OPEN */
    document.getElementById("rulesButton")?.addEventListener("click", () => {
        document.getElementById("rulesModal")?.classList.remove("hidden");
    });

    /* RULES CLOSE */
    document.getElementById("closeRules")?.addEventListener("click", () => {
        document.getElementById("rulesModal")?.classList.add("hidden");
    });

    document.getElementById("rulesModal")?.addEventListener("click", event => {
        if (event.target.id === "rulesModal") {
            event.target.classList.add("hidden");
        }
    });
}

/* ---------------------------------------------------------
   PAWN CLICK HANDLING (event delegation)
--------------------------------------------------------- */
function setupPawnInteraction() {
    document.addEventListener("click", event => {
        const pawn = event.target.closest(".pawn");
        if (!pawn) return;

        const player = Number(pawn.dataset.player);
        const pawnIndex = Number(pawn.dataset.pawn);

        if (!waitingForPawn) return;
        if (player !== gameState.currentPlayer) return;

        // In online mode, only your own pawns respond
        if (Multiplayer.connected &&
            Multiplayer.localPlayer !== gameState.currentPlayer) {
            updateMessage("Wait for the other player.");
            return;
        }

        // Guest sends move request to host
        if (Multiplayer.connected && Multiplayer.role === "guest") {
            Multiplayer.sendAction({
                type: "move",
                player,
                pawnIndex
            });
            return;
        }

        // Local play or host
        movePawn(player, pawnIndex);
    });
}
