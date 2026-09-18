const UI = {
    setStatus(text, important=false) {
        document.getElementById('actionText').textContent = text;
        if(important) document.getElementById('systemMsg').textContent = text;
    },
    
    renderBoard(state) {
        // Clear yards and board cells
        document.getElementById('p1-yard').innerHTML = '';
        document.getElementById('p2-yard').innerHTML = '';
        document.querySelectorAll('.cell').forEach(c => c.innerHTML = '');

        const createPawn = (player, index, pos) => {
            const p = document.createElement('div');
            p.className = `pawn p${player}`;
            p.textContent = index + 1;
            if (state.currentPlayer === player && state.waitingForPawn && state.movablePawns.includes(index)) {
                p.classList.add('highlight');
                p.onclick = () => window.Game.handlePawnClick(player, index);
            }
            return p;
        };

        // Render pawns
        [1, 2].forEach(player => {
            state.pawns[player].forEach((pos, index) => {
                const pawnEl = createPawn(player, index, pos);
                if (pos === -1) {
                    document.getElementById(`p${player}-yard`).appendChild(pawnEl);
                } else if (pos >= 0 && pos < 48) {
                    const boardIdx = Board.getPathIndex(player, pos);
                    const cell = document.querySelector(`.cell[data-index="${boardIdx}"]`);
                    if(cell) cell.appendChild(pawnEl);
                }
                // pos === 48 is Home, not rendered (handled in score)
            });
        });
    },

    renderSticks(player, value) {
        const container = document.querySelector('.sticks-container');
        const label = document.getElementById('stickOwnerLabel');
        
        if (player === 1) {
            container.classList.remove('p2-turn');
            label.textContent = "Player 1 Sticks";
        } else {
            container.classList.add('p2-turn');
            label.textContent = "Player 2 Sticks";
        }

        if (value === null) {
            document.querySelectorAll('.stick-pips').forEach(p => p.innerHTML='');
            document.getElementById('resultValue').textContent = "?";
            document.getElementById('resultName').textContent = "Ready";
            document.querySelector('.throw-result-display').classList.remove('extra-glow');
        }
    },

    updateScores(state) {
        document.getElementById('p1-home').textContent = `${state.homeCount[1]}/6 Home`;
        document.getElementById('p2-home').textContent = `${state.homeCount[2]}/6 Home`;
        
        // Sync rotation based on role and turn (HOTSEAT ROTATION LOGIC)
        const wrapper = document.getElementById('boardAndYards');
        if (Multiplayer.role === 'guest') {
            wrapper.classList.add('rotated'); // Permanently flip for Guest
        } else if (Multiplayer.role === 'host') {
            wrapper.classList.remove('rotated'); // Permanently upright for Host
        } else {
            // Local Hotseat Mode: Flip board to face current player
            if (state.currentPlayer === 2) {
                wrapper.classList.add('rotated');
            } else {
                wrapper.classList.remove('rotated');
            }
        }
    }
};

class GameEngine {
    constructor() {
        this.initGame();
    }

    initGame() {
        this.gameState = {
            currentPlayer: 1,
            lastThrow: null,
            gameOver: false,
            waitingForPawn: false,
            movablePawns: [],
            // -1 = Yard, 0-47 = Path, 48 = Home
            pawns: {
                1: [-1, -1, -1, -1, -1, -1],
                2: [-1, -1, -1, -1, -1, -1]
            },
            homeCount: { 1: 0, 2: 0 }
        };
        this.updateUI();
    }

    handleThrow() {
        if (this.gameState.waitingForPawn || this.gameState.gameOver) return;

        const btn = document.getElementById('throwBtn');
        btn.disabled = true;

        Sticks.roll((val) => {
            this.gameState.lastThrow = val;
            this.calculateMovablePawns(val);

            if (this.gameState.movablePawns.length === 0) {
                UI.setStatus(`No moves for ${val}! Swapping turns...`, true);
                setTimeout(() => this.nextTurn(), 1500);
            } else {
                this.gameState.waitingForPawn = true;
                UI.setStatus(`Select a pawn to move ${val} steps`);
            }
            
            if (Multiplayer.role === 'host') Multiplayer.sendState();
            this.updateUI();
            btn.disabled = false;
        });
    }

    calculateMovablePawns(val) {
        const player = this.gameState.currentPlayer;
        const pawns = this.gameState.pawns[player];
        const movable = [];

        pawns.forEach((pos, index) => {
            if (pos === -1) {
                if ([1, 6, 12].includes(val)) movable.push(index);
            } else if (pos >= 0 && pos < 48) {
                const newPos = pos + val;
                if (newPos <= 48) movable.push(index); // 48 is exact home
            }
        });
        this.gameState.movablePawns = movable;
    }

    handlePawnClick(player, pawnIndex) {
        if (!this.gameState.waitingForPawn || player !== this.gameState.currentPlayer) return;
        if (!this.gameState.movablePawns.includes(pawnIndex)) return;

        const val = this.gameState.lastThrow;
        const currentPos = this.gameState.pawns[player][pawnIndex];
        let nextPos = currentPos === -1 ? 0 : currentPos + val;

        this.movePawn(player, pawnIndex, nextPos);
    }

    movePawn(player, pawnIndex, nextPos) {
        const isSpecial = [1, 6, 12].includes(this.gameState.lastThrow);
        let captured = false;

        // Capture Logic
        if (nextPos >= 0 && nextPos < 48) {
            const boardIdx = Board.getPathIndex(player, nextPos);
            if (!Board.SAFE_SPACES.has(boardIdx)) {
                const opponent = player === 1 ? 2 : 1;
                this.gameState.pawns[opponent].forEach((pos, i) => {
                    if (pos >= 0 && pos < 48 && Board.getPathIndex(opponent, pos) === boardIdx) {
                        this.gameState.pawns[opponent][i] = -1; // Send to yard
                        captured = true;
                    }
                });
            }
        }

        // Apply Move
        if (nextPos === 48) {
            this.gameState.pawns[player][pawnIndex] = 48; // Reached Home
            this.gameState.homeCount[player]++;
            Sound.playHomeSound();
        } else {
            this.gameState.pawns[player][pawnIndex] = nextPos;
            captured ? Sound.playCaptureSound() : Sound.playMoveSound();
        }

        this.gameState.waitingForPawn = false;
        this.gameState.movablePawns = [];

        if (this.gameState.homeCount[player] === 6) {
            this.gameState.gameOver = true;
            Sound.playWinSound();
            UI.setStatus(`PLAYER ${player} WINS!`, true);
        } else {
            if (isSpecial || captured) {
                UI.setStatus("Extra Turn!", true);
            } else {
                this.nextTurn();
                return; // nextTurn calls updateUI
            }
        }
        
        if (Multiplayer.role === 'host') Multiplayer.sendState();
        this.updateUI();
    }

    nextTurn() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.gameState.lastThrow = null;
        this.gameState.waitingForPawn = false;
        Sound.playTurnSound();
        if (Multiplayer.role === 'host') Multiplayer.sendState();
        this.updateUI();
    }

    updateUI() {
        UI.renderBoard(this.gameState);
        UI.renderSticks(this.gameState.currentPlayer, this.gameState.lastThrow);
        UI.updateScores(this.gameState);
        
        const turnText = document.getElementById('turnText');
        const throwBtn = document.getElementById('throwBtn');
        
        if (this.gameState.gameOver) {
            turnText.textContent = "Game Over!";
            throwBtn.style.display = "none";
        } else {
            turnText.textContent = `Player ${this.gameState.currentPlayer}'s Turn`;
            
            // Only show button if not waiting for a pawn move
            throwBtn.style.display = this.gameState.waitingForPawn ? "none" : "block";
            
            document.getElementById('p1-bar').classList.toggle('active', this.gameState.currentPlayer === 1);
            document.getElementById('p2-bar').classList.toggle('active', this.gameState.currentPlayer === 2);
        }
    }
}

window.Game = new GameEngine();
