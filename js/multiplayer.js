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

    createRoom() {
        this.role = "host";
        this.localPlayer = 1;
        updateMessage("Creating Player 1 room...");

        try {
            this.peer = new Peer();
        } catch (e) {
            updateMessage("PeerJS failed to load. Check internet connection.");
            return;
        }

        this.peer.on("open", id => {
            this.roomId = id;
            this.showRoomCode(id);
            updateMessage("Room created! Share room code with Player 2.");
        });

        this.peer.on("connection", connection => {
            this.connection = connection;
            this.setupConnection();
        });

        this.peer.on("error", error => {
            updateMessage(`Multiplayer error: ${error.type || "unknown"}`);
        });
    },

    joinRoom(roomId) {
        roomId = String(roomId || "").trim();
        if (!roomId) {
            updateMessage("Please enter a valid room code.");
            return;
        }

        this.role = "guest";
        this.localPlayer = 2;
        updateMessage("Connecting to Player 1...");

        try {
            this.peer = new Peer();
        } catch (e) {
            updateMessage("PeerJS failed to load.");
            return;
        }

        this.peer.on("open", () => {
            this.connection = this.peer.connect(roomId, { reliable: true });
            this.setupConnection();
        });

        this.peer.on("error", error => {
            updateMessage(`Connection error: ${error.type || "failed"}`);
        });
    },

    setupConnection() {
        if (!this.connection) return;

        this.connection.on("open", () => {
            this.connected = true;
            updateMessage(`Connected! You are Player ${this.localPlayer}`);
            document.getElementById("roomStatus").textContent = `Connected as Player ${this.localPlayer}`;

            if (this.role === "host") {
                this.sendState();
            }
            updateControlsState();
        });

        this.connection.on("data", message => {
            this.receiveMessage(message);
        });

        this.connection.on("close", () => {
            this.connected = false;
            updateMessage("Opponent disconnected.");
            document.getElementById("roomStatus").textContent = "Disconnected";
            updateControlsState();
        });
    },

    sendState() {
        if (!this.connection || !this.connection.open) return;
        this.connection.send({
            type: "state",
            state: getSerializableState()
        });
    },

    sendAction(action) {
        if (!this.connection || !this.connection.open) return;
        this.connection.send({ type: "action", action });
    },

    receiveMessage(message) {
        if (!message) return;

        if (message.type === "state") {
            loadRemoteState(message.state);
        } else if (message.type === "action") {
            handleRemoteAction(message.action);
        }
    },

    showRoomCode(id) {
        const area = document.getElementById("roomArea");
        const code = document.getElementById("roomCode");
        const status = document.getElementById("roomStatus");
        if (area) area.classList.remove("hidden");
        if (code) code.textContent = id;
        if (status) status.textContent = "Waiting for Player 2...";
    }
};

function handleRemoteAction(action) {
    if (!action) return;

    if (Multiplayer.role === "host") {
        if (action.type === "throw") {
            processThrow(action.value);
            Multiplayer.sendState();
        } else if (action.type === "move") {
            movePawn(action.player, action.pawnIndex);
            Multiplayer.sendState();
        }
    } else if (Multiplayer.role === "guest") {
        if (action.type === "throw") {
            processThrow(action.value);
        } else if (action.type === "move") {
            movePawn(action.player, action.pawnIndex);
        }
    }
}
