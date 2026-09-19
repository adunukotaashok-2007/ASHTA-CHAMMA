const UI = {
    setStatus(text, important=false) {
        document.getElementById('actionText').textContent = text;
        if(important) document.getElementById('systemMsg').textContent = text;
    },
    
    renderBoard(state) {
        const p1Yard = document.getElementById('p1-yard');
        const p2Yard = document.getElementById('p2-yard');
        p1Yard.innerHTML = '';
        p2Yard.innerHTML = '';
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

        [1, 2].forEach(player => {
            state.pawns[player].forEach((pos, index) => {
                const pawnEl = createPawn(player, index, pos);
                if (pos === -1) {
                    const yard = player === 1 ? p1Yard : p2Yard;
                    yard.appendChild(pawnEl);
                } else if (pos >= 0 && pos < 48) {
                    const boardIdx = Board.getPathIndex(player, pos);
                    const cell = document.querySelector(`.cell[data-index="${boardIdx}"]`);
                    if(cell) cell.appendChild(pawnEl);
                }
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

        [1, 2].forEach(p => {
            const badge = document.getElementById(`p${p}-kill`);
            if (state.hasKilled[p]) {
                badge.textContent = "⚔️ Kill: YES";
                badge.className = "kill-badge unlocked";
            } else {
                badge.textContent = "⚔️ Kill: NO";
                badge.className = "kill-badge locked";
            }
        });
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
            hasKilled: { 1: false, 2: false },
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
                UI.setStatus(`No valid moves for ${val}! Swapping turns...`, true);
                setTimeout(() => this.nextTurn(), 1500);
            } else {
                this.gameState.waitingForPawn = true;
                if (val === 6 && this.gameState.pawns[this.gameState.currentPlayer].includes(-1)) {
                    UI.setStatus("Throw is 6! Tap a yard pawn to bring ALL pawns out!");
                } else {
                    UI.setStatus(`Select a pawn to move ${val} steps`);
                }
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
                if (val === 1 || val === 6) movable.push(index);
            } else if (pos >= 0 && pos < 48) {
                const targetPos = this.calculateNextPosition(player, pos, val);
                if (targetPos > pos && targetPos <= 48) {
                    movable.push(index);
                }
            }
        });
        this.gameState.movablePawns = movable;
    }

    calculateNextPosition(player, currentPos, val) {
        const hasKill = this.gameState.hasKilled[player];
        
        // Clamps at step 23 (end of outer loop) if player hasn't killed an opponent yet
        if (!hasKill) {
            if (currentPos + val >= 23) return 23;
            return currentPos + val;
        }
        return currentPos + val;
    }

    handlePawnClick(player, pawnIndex) {
        if (!this.gameState.waitingForPawn || player !== this.gameState.currentPlayer) return;
        if (!this.gameState.movablePawns.includes(pawnIndex)) return;

        const val = this.gameState.lastThrow;
        const currentPos = this.gameState.pawns[player][pawnIndex];

        if (currentPos === -1 && val === 6) {
            this.gameState.pawns[player].forEach((pPos, i) => {
                if (pPos === -1) this.gameState.pawns[player][i] = 0;
            });
            Sound.playMoveSound();
            this.finishMove(player, false);
            return;
        }

        let nextPos = currentPos === -1 ? 0 : this.calculateNextPosition(player, currentPos, val);
        this.movePawn(player, pawnIndex, nextPos);
    }

    movePawn(player, pawnIndex, nextPos) {
        let captured = false;

        if (nextPos >= 0 && nextPos < 48) {
            const boardIdx = Board.getPathIndex(player, nextPos);
            if (!Board.SAFE_SPACES.has(boardIdx)) {
                const opponent = player === 1 ? 2 : 1;
                this.gameState.pawns[opponent].forEach((pos, i) => {
                    if (pos >= 0 && pos < 48 && Board.getPathIndex(opponent, pos) === boardIdx) {
                        this.gameState.pawns[opponent][i] = -1;
                        captured = true;
                    }
                });
            }
        }

        if (captured) {
            this.gameState.hasKilled[player] = true;
        }

        if (nextPos === 48) {
            this.gameState.pawns[player][pawnIndex] = 48;
            this.gameState.homeCount[player]++;
            Sound.playHomeSound();
        } else {
            this.gameState.pawns[player][pawnIndex] = nextPos;
            captured ? Sound.playCaptureSound() : Sound.playMoveSound();
        }

        this.finishMove(player, captured);
    }

    finishMove(player, captured) {
        const isSpecial = [1, 6, 12].includes(this.gameState.lastThrow);
        this.gameState.waitingForPawn = false;
        this.gameState.movablePawns = [];

        if (this.gameState.homeCount[player] === 6) {
            this.gameState.gameOver = true;
            Sound.playWinSound();
            UI.setStatus(`PLAYER ${player} WINS!`, true);
        } else {
            if (isSpecial || captured) {
                UI.setStatus(captured ? "Kill! Extra Turn & Inner Loop Unlocked!" : "Extra Turn!", true);
            } else {
                this.nextTurn();
                return;
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
            throwBtn.style.display = this.gameState.waitingForPawn ? "none" : "block";
            
            document.getElementById('p1-bar').classList.toggle('active', this.gameState.currentPlayer === 1);
            document.getElementById('p2-bar').classList.toggle('active', this.gameState.currentPlayer === 2);
        }
    }
}

window.Game = new GameEngine();
