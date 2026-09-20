/* ASHTA CHAMMA GAME STATE & LOGIC */

let gameState = {
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
    soundMuted: false
};

// AUDIO SYNTHESIS
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, duration, type = 'sine') {
    if (gameState.soundMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playSound(name) {
    if (name === 'roll') playTone(300, 0.15, 'square');
    if (name === 'move') playTone(500, 0.1, 'sine');
    if (name === 'kill') playTone(200, 0.2, 'sawtooth');
    if (name === 'win') playTone(600, 0.3, 'triangle');
}

function initAshtaBoardUI() {
    const boardEl = document.getElementById('ashta-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let i = 0; i < 49; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        if (SAFE_SPACES.has(i)) cell.classList.add('safe-zone');
        if (i === 24) cell.classList.add('center-home');
        boardEl.appendChild(cell);
    }
    renderAshtaState();
}

function renderAshtaState() {
    // Clear board pawns
    document.querySelectorAll('.cell .pawn').forEach(el => el.remove());
    
    // Clear yards
    const y1 = document.getElementById('p1-yard');
    const y2 = document.getElementById('p2-yard');
    if (y1) y1.innerHTML = '';
    if (y2) y2.innerHTML = '';

    // Render Pawns
    [1, 2].forEach(p => {
        gameState.pawns[p].forEach((pathIdx, pawnIdx) => {
            if (pathIdx === -1) {
                // In Yard
                const yardPawn = document.createElement('div');
                yardPawn.className = `yard-pawn pawn-p${p}`;
                yardPawn.dataset.player = p;
                yardPawn.dataset.pawn = pawnIdx;
                
                if (gameState.waitingForPawn && gameState.currentPlayer === p && gameState.movablePawns.includes(pawnIdx)) {
                    yardPawn.classList.add('movable');
                    yardPawn.onclick = () => handlePawnClick(p, pawnIdx);
                }
                const yardEl = document.getElementById(`p${p}-yard`);
                if (yardEl) yardEl.appendChild(yardPawn);
            } else if (pathIdx < 49) {
                // On Board
                const boardSquareIndex = getPlayerPath(p)[pathIdx];
                const cell = document.querySelector(`.cell[data-index="${boardSquareIndex}"]`);
                if (cell) {
                    const pawn = document.createElement('div');
                    pawn.className = `pawn pawn-p${p}`;
                    pawn.dataset.player = p;
                    pawn.dataset.pawn = pawnIdx;

                    if (gameState.waitingForPawn && gameState.currentPlayer === p && gameState.movablePawns.includes(pawnIdx)) {
                        pawn.classList.add('movable');
                        pawn.onclick = () => handlePawnClick(p, pawnIdx);
                    }
                    cell.appendChild(pawn);
                }
            }
        });
    });

    // Update Headers & Stick Visibility
    const turnText = document.getElementById('ashta-turn-text');
    const killBadge = document.getElementById('ashta-kill-badge');
    if (turnText) turnText.textContent = `Player ${gameState.currentPlayer}'s Turn`;
    if (killBadge) killBadge.textContent = gameState.hasKilled[gameState.currentPlayer] ? "Kill Secured ✓" : "No Kill Yet";

    const p1Box = document.getElementById('p1-sticks-box');
    const p2Box = document.getElementById('p2-sticks-box');
    if (p1Box && p2Box) {
        if (gameState.currentPlayer === 1) {
            p1Box.classList.remove('hidden-stick-box');
            p2Box.classList.add('hidden-stick-box');
        } else {
            p2Box.classList.remove('hidden-stick-box');
            p1Box.classList.add('hidden-stick-box');
        }
    }

    // Auto rotate board for hotseat mode
    if (window.isHotseat) {
        const boardWrapper = document.getElementById('board-wrapper');
        const p1Yard = document.getElementById('p1-yard-container');
        const p2Yard = document.getElementById('p2-yard-container');

        if (boardWrapper && p1Yard && p2Yard) {
            if (gameState.currentPlayer === 2) {
                boardWrapper.classList.add('rotate-180');
                p1Yard.classList.add('rotate-180');
                p2Yard.classList.add('rotate-180');
            } else {
                boardWrapper.classList.remove('rotate-180');
                p1Yard.classList.remove('rotate-180');
                p2Yard.classList.remove('rotate-180');
            }
        }
    }
}

function handleAshtaRoll() {
    if (gameState.gameOver || gameState.waitingForPawn) return;

    playSound('roll');
    const rolled = rollSticks();
    gameState.lastThrow = rolled.value;

    updateSticksUI(gameState.currentPlayer, rolled);
    const resultDisplay = document.getElementById('throw-result-display');
    if (resultDisplay) resultDisplay.textContent = `Throw: ${rolled.value}`;

    // Find movable pawns
    gameState.movablePawns = getMovablePawns(gameState.currentPlayer, rolled.value);

    if (gameState.movablePawns.length === 0) {
        if (resultDisplay) resultDisplay.textContent = `Throw: ${rolled.value} (No Valid Moves)`;
        setTimeout(() => {
            if (![1, 6, 12].includes(rolled.value)) {
                switchTurn();
            } else {
                renderAshtaState();
            }
        }, 1200);
    } else {
        gameState.waitingForPawn = true;
        renderAshtaState();
    }
}

function getMovablePawns(player, throwVal) {
    const valid = [];
    const pawns = gameState.pawns[player];
    const killed = gameState.hasKilled[player];

    pawns.forEach((currIdx, pawnIdx) => {
        if (currIdx === -1) {
            if (throwVal === 1 || throwVal === 6) valid.push(pawnIdx);
        } else if (currIdx < 48) {
            const nextIdx = currIdx + throwVal;
            if (nextIdx <= 48) {
                if (nextIdx >= 24 && !killed) {
                    if (currIdx < 23) valid.push(pawnIdx);
                } else {
                    valid.push(pawnIdx);
                }
            }
        }
    });
    return valid;
}

function handlePawnClick(player, pawnIdx) {
    if (!gameState.waitingForPawn || player !== gameState.currentPlayer) return;

    const throwVal = gameState.lastThrow;
    const path = getPlayerPath(player);

    if (gameState.pawns[player][pawnIdx] === -1) {
        if (throwVal === 1) {
            gameState.pawns[player][pawnIdx] = 0;
        } else if (throwVal === 6) {
            gameState.pawns[player].forEach((pos, idx) => {
                if (pos === -1) gameState.pawns[player][idx] = 0;
            });
        }
    } else {
        let target = gameState.pawns[player][pawnIdx] + throwVal;
        if (target >= 24 && !gameState.hasKilled[player]) {
            target = 23;
        }
        gameState.pawns[player][pawnIdx] = target;

        const targetSquare = path[target];
        if (!SAFE_SPACES.has(targetSquare)) {
            const opponent = player === 1 ? 2 : 1;
            const oppPath = getPlayerPath(opponent);
            
            gameState.pawns[opponent].forEach((oppPos, oppIdx) => {
                if (oppPos !== -1 && oppPath[oppPos] === targetSquare) {
                    gameState.pawns[opponent][oppIdx] = -1;
                    gameState.hasKilled[player] = true;
                    playSound('kill');
                }
            });
        }
    }

    playSound('move');
    gameState.waitingForPawn = false;
    gameState.movablePawns = [];

    if (gameState.pawns[player].every(pos => pos === 48)) {
        gameState.gameOver = true;
        playSound('win');
        alert(`🎉 Player ${player} Wins Ashta Chamma!`);
        return;
    }

    if ([1, 6, 12].includes(throwVal)) {
        renderAshtaState();
    } else {
        switchTurn();
    }
}

function switchTurn() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.waitingForPawn = false;
    gameState.movablePawns = [];
    const resultDisplay = document.getElementById('throw-result-display');
    if (resultDisplay) resultDisplay.textContent = 'Throw: -';
    renderAshtaState();
}
