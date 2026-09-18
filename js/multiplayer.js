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

        const status = document.getElementById("homeRoomStatus");
        if (status) status.textContent = "Creating Room...";

        try {
            this.peer = new Peer();
        } catch (e) {
            if (status) status.textContent = "Error: PeerJS failed.";
            return;
        }

        this.peer.on("open", id => {
            this.roomId = id;
            this.showRoomCode(id);
        });

        this.peer.on("connection", connection => {
            this.connection = connection;
            this.setupConnection();
        });

        this.peer.on("error", error => {
            if (status) status.textContent = `Error: ${error.type}`;
        });
    },

    joinRoom(roomId) {
        roomId = String(roomId || "").trim();
        const status = document.getElementById("homeRoomStatus");

        if (!roomId) {
            if (status) status.textContent = "Please enter a code!";
            return;
        }

        this.role = "guest";
        this.localPlayer = 2;
        if (status) status.textContent = "Connecting to Host...";

        try {
            this.peer = new Peer();
        } catch (e) {
            if (status) status.textContent = "Error loading networking.";
            return;
        }

        this.peer.on("open", () => {
            this.connection = this.peer.connect(roomId, { reliable: true });
            this.setupConnection();
        });

        this.peer.on("error", error => {
            if (status) status.textContent = `Connection failed: ${error.type}`;
        });
    },

    setupConnection() {
        if (!this.connection) return;

        this.connection.on("open", () => {
            this.connected = true;
            const status = document.getElementById("homeRoomStatus");
            if (status) status.textContent = `Connected! You are Player ${this.localPlayer}`;

            if (this.role === "host") {
                this.sendState();
            }

            setTimeout(() => {
                if (typeof showGame === "function") showGame();
            }, 800);
        });

        this.connection.on("data", message => {
            this.receiveMessage(message);
        });

        this.connection.on("close", () => {
            this.connected = false;
            updateMessage("Opponent disconnected.");
            if (typeof updateControlsState === "function") updateControlsState();
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
            if (typeof loadRemoteState === "function") loadRemoteState(message.state);
        } else if (message.type === "action") {
            handleRemoteAction(message.action);
        }
    },

    showRoomCode(id) {
        const area = document.getElementById("homeRoomArea");
        const code = document.getElementById("roomCode");
        const status = document.getElementById("homeRoomStatus");

        if (area) area.classList.remove("hidden");
        if (code) code.textContent = id;
        if (status) status.textContent = "Waiting for Player 2 to join...";
    }
};

function handleRemoteAction(action) {
    if (!action) return;

    if (Multiplayer.role === "host") {
        if (action.type === "throw") {
            if (typeof processThrow === "function") processThrow(action.value);
            Multiplayer.sendState();
        } else if (action.type === "move") {
            if (typeof movePawn === "function") movePawn(action.player, action.pawnIndex);
            Multiplayer.sendState();
        }
    } else if (Multiplayer.role === "guest") {
        if (action.type === "throw") {
            if (typeof processThrow === "function") processThrow(action.value);
        } else if (action.type === "move") {
            if (typeof movePawn === "function") movePawn(action.player, action.pawnIndex);
        }
    }
}
