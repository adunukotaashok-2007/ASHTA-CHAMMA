/* =========================================================
   ASHTA CHAMMA - PEERJS MULTIPLAYER
========================================================= */

window.Multiplayer = {
    peer: null,
    connection: null,
    role: "local",
    localPlayer: 1,
    connected: false,
    roomId: null,

    /* -----------------------------------------------------
       CREATE ROOM (Host = Player 1)
    ----------------------------------------------------- */
    createRoom() {
        this.role = "host";
        this.localPlayer = 1;

        updateMessage("Creating Player 1 room...");

        try {
            this.peer = new Peer();
        } catch (e) {
            updateMessage("PeerJS failed to load. Check your internet.");
            console.error(e);
            return;
        }

        this.peer.on("open", id => {
            this.roomId = id;
            this.showRoomCode(id);
            updateMessage("Room created. Share the code with Player 2.");
        });

        this.peer.on("connection", connection => {
            this.connection = connection;
            this.setupConnection();
            this.connected = true;
            updateMessage("Player 2 connected!");
        });

        this.peer.on("error", error => {
            console.error(error);
            updateMessage(`Connection error: ${error.type || "unknown"}`);
        });
    },

    /* -----------------------------------------------------
       JOIN ROOM (Guest = Player 2)
    ----------------------------------------------------- */
    joinRoom(roomId) {
        roomId = String(roomId || "").trim();
        if (!roomId) {
            updateMessage("Enter the Player 1 room code.");
            return;
        }

        this.role = "guest";
        this.localPlayer = 2;

        updateMessage("Connecting to Player 1...");

        try {
            this.peer = new Peer();
        } catch (e) {
            updateMessage("PeerJS failed to load. Check your internet.");
            console.error(e);
            return;
        }

        this.peer.on("open", () => {
            this.connection = this.peer.connect(roomId, {
                reliable: true,
                serialization: "json"
            });
            this.setupConnection();
        });

        this.peer.on("error", error => {
            console.error(error);
            updateMessage(`Connection error: ${error.type || "unknown"}`);
        });
    },

    /* -----------------------------------------------------
       SETUP CONNECTION
    ----------------------------------------------------- */
    setupConnection() {
        if (!this.connection) return;

        this.connection.on("open", () => {
            this.connected = true;
            updateMessage(`Connected as Player ${this.localPlayer}!`);

            this.connection.send({
                type: "hello",
                player: this.localPlayer
            });

            if (this.role === "host") {
                this.sendState();
            }
        });

        this.connection.on("data", message => {
            this.receiveMessage(message);
        });

        this.connection.on("close", () => {
            this.connected = false;
            updateMessage("Other player disconnected.");
        });

        this.connection.on("error", error => {
            console.error(error);
            updateMessage("Peer connection error.");
        });
    },

    /* -----------------------------------------------------
       SEND FULL STATE
    ----------------------------------------------------- */
    sendState() {
        if (!this.connection || !this.connection.open) return;

        this.connection.send({
            type: "state",
            state: getSerializableState()
        });
    },

    /* -----------------------------------------------------
       SEND ACTION
    ----------------------------------------------------- */
    sendAction(action) {
        if (!this.connection || !this.connection.open) return;

        this.connection.send({
            type: "action",
            action
        });
    },

    /* -----------------------------------------------------
       RECEIVE MESSAGE
    ----------------------------------------------------- */
    receiveMessage(message) {
        if (!message) return;

        if (message.type === "state") {
            loadRemoteState(message.state);
            return;
        }

        if (message.type === "action") {
            handleRemoteAction(message.action);
            return;
        }

        if (message.type === "hello") {
            updateMessage(`Player ${message.player} joined the game.`);
        }
    },

    /* -----------------------------------------------------
       SHOW ROOM CODE
    ----------------------------------------------------- */
    showRoomCode(id) {
        const area = document.getElementById("roomArea");
        const code = document.getElementById("roomCode");
        if (area) area.classList.remove("hidden");
        if (code) code.textContent = id;
    }
};

/* ---------------------------------------------------------
   HANDLE REMOTE ACTION
--------------------------------------------------------- */
function handleRemoteAction(action) {
    if (!action) return;

    // Host is authoritative: applies action and broadcasts state
    if (Multiplayer.role === "host") {
        if (action.type === "throw") {
            processThrow(action.value);
            Multiplayer.sendState();
        }
        if (action.type === "move") {
            movePawn(action.player, action.pawnIndex);
            Multiplayer.sendState();
        }
        return;
    }

    // Guest applies mirrored actions from host
    if (Multiplayer.role === "guest") {
        if (action.type === "throw") {
            processThrow(action.value);
        }
        if (action.type === "move") {
            movePawn(action.player, action.pawnIndex);
        }
    }
}
