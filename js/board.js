/**
 * board.js — Board layout, paths, safe squares, cell positions
 * Ashta Chamma 5×5 grid
 */

const Board = (() => {
    // Cell indices (row * 5 + col)
    // 0  1  2  3  4
    // 5  6  7  8  9
    // 10 11 12 13 14
    // 15 16 17 18 19
    // 20 21 22 23 24

    // 8 safe (X) squares — the traditional Ashta Chamma pattern
    const SAFE_CELLS = new Set([2, 10, 14, 22, 7, 11, 13, 17]);

    // Centre home
    const HOME_CELL = 12;

    // FULL paths (25 steps each): 16 outer + 8 inner + 1 home(centre)
    // Player 1 starts at cell 22 (bottom-centre), moves anti-clockwise
    // Player 2 starts at cell 2 (top-centre), moves anti-clockwise
    const PATHS = {
        1: [
            // Outer ring (0-15) — 16 cells anti-clockwise from cell 22
            22, 23, 24, 19, 14, 9, 4, 3, 2, 1, 0, 5, 10, 15, 20, 21,
            // Inner ring (16-23) — 8 cells
            16, 17, 18, 13, 8, 7, 6, 11,
            // Home centre (24)
            12
        ],
        2: [
            // Outer ring (0-15) — 16 cells anti-clockwise from cell 2
            2, 1, 0, 5, 10, 15, 20, 21, 22, 23, 24, 19, 14, 9, 4, 3,
            // Inner ring (16-23) — 8 cells
            8, 7, 6, 11, 16, 17, 18, 13,
            // Home centre (24)
            12
        ]
    };

    // Start cells
    const START_CELLS = { 1: 22, 2: 2 };

    // Path indices
    const OUTER_END = 15;        // last outer ring index
    const INNER_START = 16;      // first inner ring index
    const INNER_END = 23;        // last inner ring index
    const HOME_INDEX = 24;       // index in path array = centre home
    const PATH_LENGTH = 25;

    const PAWNS_PER_PLAYER = 6;

    /**
     * Build the 5×5 grid cells into the board element
     */
    function buildCells(boardEl) {
        // Remove existing cells (not the layers)
        boardEl.querySelectorAll('.cell').forEach(c => c.remove());

        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.cell = i;

            if (SAFE_CELLS.has(i)) cell.classList.add('safe');
            if (i === START_CELLS[1]) cell.classList.add('start-1');
            if (i === START_CELLS[2]) cell.classList.add('start-2');

            if (i === HOME_CELL) {
                cell.classList.add('home-cell');
                cell.innerHTML = `
                    <span class="home-symbol">✺</span>
                    <div class="home-counts">
                        <span class="home-count p1" id="hc1">0</span>
                        <span class="home-count p2" id="hc2">0</span>
                    </div>
                `;
            }

            // Insert before the layers
            const layers = boardEl.querySelector('.pawn-layer');
            boardEl.insertBefore(cell, layers);
        }
    }

    /**
     * Get pixel position (%) for a cell index
     */
    function cellPos(cellIndex) {
        const row = Math.floor(cellIndex / 5);
        const col = cellIndex % 5;
        return {
            x: (col + 0.5) * 20,
            y: (row + 0.5) * 20
        };
    }

    /**
     * Check if a board cell is safe
     */
    function isSafe(cellIndex) {
        return SAFE_CELLS.has(cellIndex);
    }

    /**
     * Offset positions when multiple pawns share a cell
     */
    function getStackOffsets(count) {
        const OFFSETS = [
            [[0, 0]],
            [[-26, 0], [26, 0]],
            [[-28, -18], [28, -18], [0, 22]],
            [[-26, -26], [26, -26], [-26, 26], [26, 26]],
            [[-28, -28], [28, -28], [0, 0], [-28, 28], [28, 28]],
            [[-30, -26], [0, -32], [30, -26], [-30, 26], [0, 32], [30, 26]]
        ];
        return OFFSETS[Math.min(count, 6) - 1] || OFFSETS[5];
    }

    return {
        SAFE_CELLS,
        HOME_CELL,
        PATHS,
        START_CELLS,
        OUTER_END,
        INNER_START,
        INNER_END,
        HOME_INDEX,
        PATH_LENGTH,
        PAWNS_PER_PLAYER,
        buildCells,
        cellPos,
        isSafe,
        getStackOffsets
    };
})();
