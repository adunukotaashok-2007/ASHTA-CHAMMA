/* PEERJS MULTIPLAYER SIGNALING & UI BINDINGS */

let peer = null;
let connection = null;
let isHost = false;

// ==========================================
// 1. CORE NETWORK LOGIC
// ==========================================

function hostGame(onReady, onDataReceived) {
    if (typeof Peer === 'undefined') {
        alert("PeerJS is not loaded. Check your internet connection.");
        return;
    }
    
    // Create new peer with auto-generated ID
    peer = new Peer(); 
    
    peer.on('open', (id) => {
        console.log('Host Room ID:', id);
        if (onReady) onReady(id);
    });

    peer.on('connection', (conn) => {
        connection = conn;
        isHost = true;
        setupConnection(onDataReceived);
    });
    
    peer.on('error', (err) => {
        console.error('Peer error:', err);
        alert('Multiplayer Error: ' + err.type);
    });
}

function joinGame(hostId, onConnected, onDataReceived) {
    if (typeof Peer === 'undefined') {
        alert("PeerJS is not loaded. Check your internet connection.");
        return;
    }

    peer = new Peer();
    
    peer.on('open', () => {
        connection = peer.connect(hostId, { reliable: true });
        isHost = false;
        
        connection.on('open', () => {
            console.log('Connected to Host!');
            setupConnection(onDataReceived);
            if (onConnected) onConnected();
        });
    });
    
    peer.on('error', (err) => {
        console.error('Peer error:', err);
        alert('Connection failed! Please check the Room ID.');
        const statusText = document.getElementById('ashta-join-status');
        if (statusText) statusText.textContent = "Connection failed.";
    });
}

function setupConnection(onDataReceived) {
    connection.on('data', (data) => {
        console.log('Received data:', data);
        if (onDataReceived) onDataReceived(data);
    });
    
    connection.on('close', () => {
        alert('Opponent disconnected! Game over.');
        location.reload(); // Reload to main menu
    });
}

function sendGameData(action, payload) {
    if (connection && connection.open) {
        connection.send({ action: action, payload: payload });
    }
}


// ==========================================
// 2. MULTIPLAYER UI EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // A. TAB SWITCHING (Host Room vs Join Room)
    const tabCreate = document.getElementById('ashta-tab-create');
    const tabJoin = document.getElementById('ashta-tab-join');
    const panelHost = document.getElementById('ashta-host-panel');
    const panelJoin = document.getElementById('ashta-join-panel');

    if (tabCreate && tabJoin) {
        tabCreate.onclick = () => {
            tabCreate.classList.add('active');
            tabJoin.classList.remove('active');
            panelHost.classList.remove('hidden');
            panelJoin.classList.add('hidden');
        };
        
        tabJoin.onclick = () => {
            tabJoin.classList.add('active');
            tabCreate.classList.remove('active');
            panelJoin.classList.remove('hidden');
            panelHost.classList.add('hidden');
        };
    }

    // B. HOSTING A ROOM
    const createRoomBtn = document.getElementById('ashta-create-room-btn');
    const roomIdText = document.getElementById('ashta-room-id-text');
    const roomDisplay = document.getElementById('ashta-room-display');
    const hostStatus = document.getElementById('ashta-host-status');
    const copyBtn = document.getElementById('ashta-copy-code-btn');

    if (createRoomBtn) {
        createRoomBtn.onclick = () => {
            createRoomBtn.disabled = true;
            createRoomBtn.textContent = "Creating...";
            
            hostGame((id) => {
                // On Room Created
                createRoomBtn.classList.add('hidden');
                roomDisplay.classList.remove('hidden');
                roomIdText.textContent = id;
                hostStatus.textContent = "Waiting for opponent to join...";
            }, handleIncomingNetworkData);
        };
    }

    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(roomIdText.textContent);
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy", 2000);
        };
    }

    // C. JOINING A ROOM
    const joinRoomBtn = document.getElementById('ashta-join-room-btn');
    const joinInput = document.getElementById('ashta-join-code-input');
    const joinStatus = document.getElementById('ashta-join-status');

    if (joinRoomBtn) {
        joinRoomBtn.onclick = () => {
            const hostId = joinInput.value.trim();
            if (!hostId) {
                alert("Please enter a Room ID");
                return;
            }

            joinRoomBtn.disabled = true;
            joinStatus.textContent = "Connecting to Host...";

            joinGame(hostId, () => {
                // On Successfully Connected
                startGameFromNetwork();
            }, handleIncomingNetworkData);
        };
    }
});


// ==========================================
// 3. GAME SYNC LOGIC
// ==========================================

function startGameFromNetwork() {
    // Hide setup screens and show game screen
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    
    // Start the board
    initAshtaBoardUI();
    
    if (isHost) {
        alert("Opponent Connected! You are Player 1 (Red).");
        // Host is Player 1, so they can roll. Guest sticks are hidden.
    } else {
        alert("Connected to Host! You are Player 2 (Yellow).");
        // Force board rotation so Guest sees their yard at the bottom
        window.isHotseat = false;
        document.getElementById('board-wrapper').classList.add('rotate-180');
        document.getElementById('p1-yard-container').classList.add('rotate-180');
        document.getElementById('p2-yard-container').classList.add('rotate-180');
    }
}

// Global handler for when data arrives from the other player
function handleIncomingNetworkData(data) {
    if (!data || !data.action) return;

    if (data.action === 'ROLL') {
        // Opponent rolled the sticks
        gameState.lastThrow = data.payload.value;
        updateSticksUI(gameState.currentPlayer, data.payload);
        document.getElementById('throw-result-display').textContent = `Throw: ${data.payload.value}`;
        
        // Let the local logic figure out moves for sync purposes
        gameState.movablePawns = getMovablePawns(gameState.currentPlayer, data.payload.value);
        if (gameState.movablePawns.length > 0) {
            gameState.waitingForPawn = true;
        }
        renderAshtaState();
    }
    
    else if (data.action === 'MOVE') {
        // Opponent moved a pawn
        const p = data.payload.player;
        const pawnIdx = data.payload.pawnIndex;
        
        // Execute the exact same click logic locally
        gameState.waitingForPawn = true; 
        handlePawnClick(p, pawnIdx); 
    }
}

// NOTE: To make network play fully active, we would intercept clicks in game.js 
// and call sendGameData('ROLL', rolledData) inside handleAshtaRoll() 
// and sendGameData('MOVE', {player, pawnIndex}) inside handlePawnClick().
