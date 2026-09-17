/**
 * app.js — Main application controller
 * Wires together Board, Sticks, Game modules
 * Handles rendering, UI, turn flow, animations
 */

(function () {
    'use strict';

    // ============== DOM REFERENCES ==============
    const $ = id => document.getElementById(id);
    const boardEl = $('board');
    const pawnLayer = $('pawnLayer');
    const targetLayer = $('targetLayer');
    const throwBtn = $('throwBtn');
    const throwName = $('throwName');
    const throwSub = $('throwSub');
    const msgBox = $('msgBox');
    const stick0 = $('stick0');
    const stick1 = $('stick1');
    const baraFlash = $('baraFlash');
    const captureFlash = $('captureFlash');
    const winOverlay = $('winOverlay');
    const restartBtn = $('restartBtn');
    const playAgainBtn = $('playAgainBtn');
    const rulesBtn = $('rulesBtn');
    const rulesModal = $('rulesModal');
    const closeRules = $('closeRules');
    const onlineBtn = $('onlineBtn');
    const onlineModal = $('onlineModal');
    const closeOnline = $('closeOnline');
    const copyUrlBtn = $('copyUrlBtn');
    const localUrl = $('localUrl');

    // Pawn DOM elements keyed by pawn id
    let pawnEls = {};

    // ============== SLEEP UTILITY ==============
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // ============== SOUND (optional, simple beeps) ==============
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    function beep(freq, dur, vol = 0.12) {
        try {
            if (!audioCtx) audioCtx = new AudioCtx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.value = vol;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            osc.stop(audioCtx.currentTime + dur);
        } catch (e) { /* audio not available */ }
    }

    // ============== INIT ==============
    function startNewGame() {
        Board.buildCells(boardEl);
        const { pawns, state } = Game.init();
        buildPawnElements(pawns);
        buildYards();
        clearTargets();

        throwName.textContent = '—';
        throwSub.textContent = 'Throw the sticks!';
        throwBtn.disabled = false;

        Sticks.renderStick(stick0, 0);
        Sticks.renderStick(stick1, 0);

        winOverlay.classList.remove('show');

        say('Player 1 starts. Throw <b>Dāyam (1)</b>, <b>Āru (6)</b>, or <b>Bārā (12)</b> to enter a pawn.');
        render();
    }

    // ============== BUILD PAWNS ==============
    function buildPawnElements(pawns) {
        pawnLayer.innerHTML = '';
        pawnEls = {};

        pawns.forEach(p => {
            const el = document.createElement('div');
            el.className = `pawn p${p.owner}`;
            el.style.display = 'none';
            el.dataset.pawnId = p.id;
            el.textContent = (p.id % Board.PAWNS_PER_PLAYER) + 1;
            el.addEventListener('click', () => onPawnClick(p));
            pawnLayer.appendChild(el);
            pawnEls[p.id] = el;
        });
    }

    // ============== BUILD YARDS ==============
    function buildYards() {
        [1, 2].forEach(player => {
            const yard = $(`yard${player}`);
            yard.innerHTML = '';
            for (let i = 0; i < Board.PAWNS_PER_PLAYER; i++) {
                const m = document.createElement('div');
                m.className = `yard-pawn p${player}`;
                m.id = `yp${player}_${i}`;
                yard.appendChild(m);
            }
        });
    }

    // ============== RENDER ==============
    function render() {
        const pawns = Game.getPawns();
        const state = Game.getState();
        const groups = Game.getPawnGroups();

        // Render pawns on board
        pawns.forEach(p => {
            const el = pawnEls[p.id];
            if (p.finished || p.pos < 0) {
                el.style.display = 'none';
                el.classList.remove('movable');
                return;
            }

            el.style.display = '';
            const cell = Board.PATHS[p.owner][p.pos];
            const arr = groups.get(cell) || [p];
            const idx = arr.indexOf(p);
            const n = arr.length;

            const offsets = Board.getStackOffsets(n);
            const off = offsets[idx % offsets.length];

            const pos = Board.cellPos(cell);
            el.style.left = (pos.x + off[0] * 0.2) + '%';
            el.style.top = (pos.y + off[1] * 0.2) + '%';

            // Size based on stack count
            const size = n <= 2 ? 12 : n <= 4 ? 9.5 : 7.5;
            el.style.width = size + '%';
            el.style.height = size + '%';
        });

        // Update yards
        [1, 2].forEach(player => {
            const yardCount = Game.yardCount(player);
            const finished = Game.finishedCount(player);

            for (let i = 0; i < Board.PAWNS_PER_PLAYER; i++) {
                const yp = $(`yp${player}_${i}`);
                if (yp) {
                    yp.classList.toggle('active', i < yardCount);
                }
            }

            // Stats
            $(`home${player}`).textContent = `Home: ${finished}/6 · Yard: ${yardCount}`;

            const killEl = $(`kill${player}`);
            if (state.killed[player]) {
                killEl.textContent = '🔓 Inner OPEN';
                killEl.className = 'lock-status unlocked';
            } else {
                killEl.textContent = '🔒 Inner Locked';
                killEl.className = 'lock-status locked';
            }

            // Home counts on board
            const hc = $(`hc${player}`);
            if (hc) hc.textContent = finished;

            // Active bar
            $(`bar${player}`).classList.toggle('active', state.turn === player && !state.over);
        });
    }

    // ============== MESSAGE ==============
    function say(html) {
        msgBox.innerHTML = html;
    }

    // ============== TARGETS ==============
    function clearTargets() {
        targetLayer.innerHTML = '';
        Game.getPawns().forEach(p => {
            pawnEls[p.id].classList.remove('movable');
        });
    }

    function showMoves(moves) {
        clearTargets();
        const state = Game.getState();

        moves.forEach(m => {
            // Highlight the pawn
            pawnEls[m.pawn.id].classList.add('movable');

            // Show target dot at destination
            let destCell;
            if (m.type === 'enter') {
                destCell = Board.PATHS[m.pawn.owner][0];
            } else {
                destCell = Board.PATHS[m.pawn.owner][m.to];
            }

            const pos = Board.cellPos(destCell);
            const dot = document.createElement('div');
            dot.className = 'target-dot';
            dot.style.left = pos.x + '%';
            dot.style.top = pos.y + '%';
            dot.addEventListener('click', () => executeAndAnimate(m));
            targetLayer.appendChild(dot);
        });
    }

    // ============== PAWN CLICK ==============
    function onPawnClick(pawn) {
        const state = Game.getState();
        if (!state.awaiting) return;

        // Find move for this pawn
        const move = state.moves.find(m => m.pawn.id === pawn.id);
        if (move) {
            executeAndAnimate(move);
        }
    }

    // ============== THROW HANDLER ==============
    async function doThrow() {
        const state = Game.getState();
        if (state.busy || state.over || state.awaiting) return;

        state.busy = true;
        throwBtn.disabled = true;

        throwName.textContent = '…';
        throwSub.textContent = 'rolling…';
        beep(300, 0.1);

        // Animate sticks
        const result = await Sticks.animateThrow(stick0, stick1);
        const value = result.value;
        state.throwValue = value;

        throwName.textContent = `${Sticks.getName(value)} — ${value}`;
        throwSub.textContent = Sticks.isEntryThrow(value)
            ? '✅ Brings pawn out · Extra turn!'
            : '❌ No new pawn · No extra turn';

        beep(value === 12 ? 600 : 440, 0.15);

        // BARA flash
        if (value === 12) {
            await showBaraFlash();
        }

        // Generate moves
        const moves = Game.generateMoves(state.turn, value);
        state.moves = moves;

        if (moves.length === 0) {
            const lockedMsg = (!state.killed[state.turn])
                ? ' (inner area locked — capture an enemy first!)'
                : '';
            say(`<b>Player ${state.turn}</b> threw <b>${Sticks.getName(value)} (${value})</b> — no legal move${lockedMsg}.`);
            beep(200, 0.2);

            await sleep(1100);

            if (Sticks.isEntryThrow(value)) {
                say(`<b>Player ${state.turn}</b>: ${Sticks.getName(value)} gives an <b>extra turn</b> — throw again!`);
                state.busy = false;
                throwBtn.disabled = false;
            } else {
                endTurn();
            }
            return;
        }

        // Player must pick a move
        state.awaiting = true;
        state.busy = false;
        showMoves(moves);
        say(`<b>Player ${state.turn}</b> threw <b>${Sticks.getName(value)} (${value})</b>. Tap a glowing pawn or target.`);
    }

    // ============== EXECUTE MOVE WITH ANIMATION ==============
    async function executeAndAnimate(move) {
        const state = Game.getState();
        if (!state.awaiting) return;

        state.awaiting = false;
        state.busy = true;
        clearTargets();

        const pawn = move.pawn;
        const player = pawn.owner;

        if (move.type === 'enter') {
            // Animate entering
            pawn.pos = 0;
            render();
            beep(500, 0.1);
            await sleep(280);
        } else {
            // Animate step by step
            const startPos = pawn.pos;
            for (let i = startPos + 1; i <= move.to; i++) {
                pawn.pos = i;
                render();
                beep(350 + i * 20, 0.05);
                await sleep(160);
            }
        }

        // Now perform capture check via Game
        // Reset pawn position for the formal execute
        pawn.pos = move.from < 0 ? -1 : move.from;
        const result = Game.executeMove(move);

        // Capture animation
        if (result.captured.length > 0) {
            await showCaptureFlash();
            beep(220, 0.3);
            render();
            say(`⚔️ <b>Player ${player}</b> captured ${result.captured.length} pawn${result.captured.length > 1 ? 's' : ''}! Inner area is now <b>OPEN</b>!`);
            await sleep(1000);
        }

        // Home animation
        if (result.reachedHome) {
            render();
            beep(700, 0.2);
            const done = Game.finishedCount(player);
            say(`🏠 <b>Player ${player}</b>'s pawn reached home! (${done}/${Board.PAWNS_PER_PLAYER})`);
            await sleep(800);

            if (Game.checkWin(player)) {
                showWin(player);
                return;
            }
        }

        render();

        // Extra turn for entry throws
        if (Sticks.isEntryThrow(state.throwValue)) {
            say(`<b>${Sticks.getName(state.throwValue)}</b> → <b>Player ${player}</b> gets an <b>extra turn</b>! Throw again.`);
            state.busy = false;
            throwBtn.disabled = false;
        } else {
            endTurn();
        }
    }

    // ============== END TURN ==============
    function endTurn() {
        Game.nextTurn();
        const state = Game.getState();
        state.busy = false;
        throwBtn.disabled = false;
        render();
        say(`Turn: <b>Player ${state.turn}</b> — throw the sticks!`);
    }

    // ============== WIN ==============
    function showWin(player) {
        const state = Game.getState();
        state.over = true;
        state.busy = false;
        throwBtn.disabled = true;
        clearTargets();
        render();

        $('winTitle').textContent = `🏆 Player ${player} Wins!`;
        $('winSub').textContent = `All ${Board.PAWNS_PER_PLAYER} pawns reached the inner home!`;
        $('winStats').textContent = `Total turns: ${state.turnCount}`;
        winOverlay.classList.add('show');
        say(`🏆 <b>Player ${player}</b> wins the match!`);

        beep(523, 0.15);
        setTimeout(() => beep(659, 0.15), 200);
        setTimeout(() => beep(784, 0.2), 400);
        setTimeout(() => beep(1047, 0.3), 600);
    }

    // ============== FLASH ANIMATIONS ==============
    async function showBaraFlash() {
        baraFlash.classList.remove('show');
        void baraFlash.offsetWidth;
        baraFlash.classList.add('show');
        await sleep(400);
    }

    async function showCaptureFlash() {
        captureFlash.classList.remove('show');
        void captureFlash.offsetWidth;
        captureFlash.classList.add('show');
        await sleep(500);
    }

    // ============== MODALS ==============
    function toggleModal(modalEl, show) {
        modalEl.classList.toggle('show', show);
    }

    // ============== URL FOR LOCAL NETWORK ==============
    function showLocalUrl() {
        localUrl.textContent = window.location.href;
    }

    function copyUrl() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            copyUrlBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyUrlBtn.textContent = '📋 Copy URL'; }, 2000);
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = window.location.href;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copyUrlBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyUrlBtn.textContent = '📋 Copy URL'; }, 2000);
        });
    }

    // ============== EVENT LISTENERS ==============
    throwBtn.addEventListener('click', doThrow);
    restartBtn.addEventListener('click', startNewGame);
    playAgainBtn.addEventListener('click', startNewGame);

    rulesBtn.addEventListener('click', () => toggleModal(rulesModal, true));
    closeRules.addEventListener('click', () => toggleModal(rulesModal, false));
    rulesModal.addEventListener('click', e => {
        if (e.target === rulesModal) toggleModal(rulesModal, false);
    });

    onlineBtn.addEventListener('click', () => {
        showLocalUrl();
        toggleModal(onlineModal, true);
    });
    closeOnline.addEventListener('click', () => toggleModal(onlineModal, false));
    onlineModal.addEventListener('click', e => {
        if (e.target === onlineModal) toggleModal(onlineModal, false);
    });

    copyUrlBtn.addEventListener('click', copyUrl);

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            doThrow();
        }
    });

    // Remove bara/capture flash classes after animation
    baraFlash.addEventListener('animationend', () => {
        baraFlash.classList.remove('show');
    });
    captureFlash.addEventListener('animationend', () => {
        captureFlash.classList.remove('show');
    });

    // ============== START ==============
    startNewGame();

})();
