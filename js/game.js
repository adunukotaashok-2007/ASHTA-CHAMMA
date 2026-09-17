/**
 * game.js — Core game state and logic
 * Handles pawn state, move generation, captures, win detection
 */

const Game = (() => {
    let pawns = [];
    let state = {};

    /**
     * Initialize a new game
     */
    function init() {
        pawns = [];
        let id = 0;
        for (let player = 1; player <= 2; player++) {
            for (let i = 0; i < Board.PAWNS_PER_PLAYER; i++) {
                pawns.push({
                    id: id++,
                    owner: player,
                    pos: -1,          // -1 = in yard
                    finished: false   // true = reached centre home
                });
            }
        }

        state = {
            turn: 1,
            throwValue: null,
            moves: [],
            awaiting: false,     // waiting for player to pick a move
            busy: false,         // animation in progress
            over: false,
            killed: { 1: false, 2: false },  // has this player captured an enemy?
            turnCount: 0
        };

        return { pawns, state };
    }

    /**
     * Get all pawns
     */
    function getPawns() {
        return pawns;
    }

    /**
     * Get game state
     */
    function getState() {
        return state;
    }

    /**
     * Get pawns belonging to a player
     */
    function playerPawns(player) {
        return pawns.filter(p => p.owner === player);
    }

    /**
     * Count pawns in yard
     */
    function yardCount(player) {
        return pawns.filter(p => p.owner === player && p.pos < 0 && !p.finished).length;
    }

    /**
     * Count finished pawns
     */
    function finishedCount(player) {
        return pawns.filter(p => p.owner === player && p.finished).length;
    }

    /**
     * Generate legal moves for current player given throw value
     */
    function generateMoves(player, value) {
        const moves = [];

        // Entry: bring new pawn from yard to position 0 (start cell)
        if (Sticks.isEntryThrow(value)) {
            const yardPawn = pawns.find(
                p => p.owner === player && p.pos < 0 && !p.finished
            );
            if (yardPawn) {
                // Check if entering is blocked by own pawn on start
                // In Ashta Chamma, you can stack on safe squares
                moves.push({
                    pawn: yardPawn,
                    from: -1,
                    to: 0,
                    type: 'enter'
                });
            }
        }

        // Move existing pawns on the board
        pawns.forEach(p => {
            if (p.owner !== player || p.finished || p.pos < 0) return;

            const newPos = p.pos + value;

            // Can't go beyond home
            if (newPos > Board.HOME_INDEX) return;

            // Check inner-area lock: can't enter inner ring unless player has killed
            if (newPos > Board.OUTER_END && !state.killed[player]) return;

            // Check if destination has own pawn (non-safe, non-home)
            const destCell = Board.PATHS[player][newPos];
            if (destCell !== Board.HOME_CELL && !Board.isSafe(destCell)) {
                // Can't land on own pawn on non-safe square
                const ownOnDest = pawns.find(q =>
                    q.owner === player && !q.finished && q.pos >= 0 &&
                    q.id !== p.id &&
                    Board.PATHS[player][q.pos] === destCell
                );
                if (ownOnDest) return;
            }

            // Safe squares can hold multiple pawns of same or different players? 
            // In Ashta Chamma, safe squares allow sharing, non-safe don't allow own stacking
            // Actually in traditional game, you CAN share on safe squares

            moves.push({
                pawn: p,
                from: p.pos,
                to: newPos,
                type: newPos === Board.HOME_INDEX ? 'home' : 'move'
            });
        });

        return moves;
    }

    /**
     * Execute a move — returns capture info
     */
    function executeMove(move) {
        const result = {
            captured: [],
            reachedHome: false,
            move: move
        };

        const pawn = move.pawn;
        const player = pawn.owner;

        // Set new position
        pawn.pos = move.to;

        // Check for capture
        if (move.to >= 0 && move.to <= Board.INNER_END) {
            const destCell = Board.PATHS[player][move.to];

            if (destCell !== Board.HOME_CELL && !Board.isSafe(destCell)) {
                pawns.forEach(q => {
                    if (q.owner !== player && !q.finished && q.pos >= 0) {
                        const qCell = Board.PATHS[q.owner][q.pos];
                        if (qCell === destCell) {
                            q.pos = -1;
                            result.captured.push(q);
                        }
                    }
                });
            }
        }

        // Mark kills
        if (result.captured.length > 0) {
            state.killed[player] = true;
        }

        // Check home
        if (move.to === Board.HOME_INDEX) {
            pawn.finished = true;
            result.reachedHome = true;
        }

        return result;
    }

    /**
     * Check if a player has won
     */
    function checkWin(player) {
        return finishedCount(player) >= Board.PAWNS_PER_PLAYER;
    }

    /**
     * Switch to next player's turn
     */
    function nextTurn() {
        state.turn = state.turn === 1 ? 2 : 1;
        state.throwValue = null;
        state.moves = [];
        state.awaiting = false;
        state.turnCount++;
    }

    /**
     * Group pawns by their board cell for stacking
     */
    function getPawnGroups() {
        const groups = new Map();
        pawns.forEach(p => {
            if (p.finished || p.pos < 0) return;
            const cell = Board.PATHS[p.owner][p.pos];
            if (!groups.has(cell)) groups.set(cell, []);
            groups.get(cell).push(p);
        });
        return groups;
    }

    return {
        init,
        getPawns,
        getState,
        playerPawns,
        yardCount,
        finishedCount,
        generateMoves,
        executeMove,
        checkWin,
        nextTurn,
        getPawnGroups
    };
})();
