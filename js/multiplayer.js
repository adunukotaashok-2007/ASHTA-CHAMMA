const Multiplayer = {
    peer: null,
    connection: null,
    role: 'local',

    initHost() {
        this.role = 'host';
        this.peer = new Peer();
        const status = document.getElementById('connectionStatus');
        
        this.peer.on('open', (id) => {
            document.getElementById('roomCodeContainer').classList.remove('hidden');
            document.getElementById('roomCodeDisplay').textContent = id;
            status.textContent = "Room created! Waiting for guest...";
            
            document.getElementById('copyRoomBtn').onclick = () => {
                navigator.clipboard.writeText(id);
                alert("Room ID copied to clipboard!");
            };
        });

        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.setupConnection();
        });
    },

    joinRoom(id) {
        if (!id) return alert("Please enter a room ID.");
        this.role = 'guest';
        this.peer = new Peer();
        const status = document.getElementById('connectionStatus');
        status.textContent = "Connecting to room...";

        this.peer.on('open', () => {
            this.connection = this.peer.connect(id);
            this.setupConnection();
        });
    },

    setupConnection() {
        this.connection.on('open', () => {
            document.getElementById('connectionStatus').textContent = "Connected! Starting game...";
            setTimeout(() => {
                window.showGame();
                if (this.role === 'host') {
                    window.Game.initGame();
                    this.sendState();
                }
            }, 800);
        });

        this.connection.on('data', (data) => {
            if (data.type === 'state') {
                window.Game.gameState = data.payload;
                
                if (this.role === 'guest' && data.payload.lastThrow !== null) {
                    Sticks.animateSticks(data.payload.lastThrow, () => {
                        window.Game.updateUI();
                    });
                } else {
                    window.Game.updateUI();
                }
            } else if (data.type === 'action' && this.role === 'host') {
                if (data.action === 'throw') {
                    window.Game.handleThrow();
                }
            }
        });
    },

    sendState() {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'state', payload: window.Game.gameState });
        }
    },

    sendAction(action, data) {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'action', action: action, payload: data });
        }
    }
};

document.getElementById('hostBtn').addEventListener('click', () => Multiplayer.initHost());
document.getElementById('joinBtn').addEventListener('click', () => Multiplayer.joinRoom(document.getElementById('joinIdInput').value));
