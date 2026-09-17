/* =========================================================
   ASHTA CHAMMA - BOARD
   7 x 7 visual board with movement path
========================================================= */

const BOARD_SIZE = 7;

/*
    Outer path cells traveled by pawns.
    24 total cells around the perimeter.
*/
const OUTER_PATH = [
    // Top row (left to right)
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    // Right side (top to bottom)
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
    // Bottom row (right to left)
    [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
    // Left side (bottom to top)
    [5, 0], [4, 0], [3, 0], [2, 0], [1, 0]
];

/*
    Player 1 starts at top-middle (index 3).
    Player 2 starts at bottom-middle (index 15).
*/
const START_POSITION = {
    1: 3,
    2: 15
};

/*
    Safe squares - pawns cannot be captured here.
*/
const SAFE_POSITIONS = new Set([
    0, 3, 6, 9, 12, 15, 18, 21
]);

/*
    Center home cell.
*/
const HOME_POSITION = {
    row: 3,
    col: 3
};

/*
    Player yards (starting area for un-entered pawns).
*/
const PLAYER1_YARD = [
    [1, 1], [1, 2], [2, 1], [2, 2], [1, 3], [2, 3]
];

const PLAYER2_YARD = [
    [4, 3], [4, 4], [5, 3], [5, 4], [5, 5], [4, 5]
];

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function boardIndex(row, col) {
    return row * BOARD_SIZE + col;
}

/* ---------------------------------------------------------
   CREATE BOARD
--------------------------------------------------------- */
function createBoard() {
    const board = document.getElementById("board");
    if (!board) {
        console.error("Board element not found.");
        return;
    }

    board.innerHTML = "";

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.index = boardIndex(row, col);

            // Alternating pattern
            if ((row + col) % 2 === 1) {
                cell.classList.add("dark");
            }

            // Center home
            if (row === HOME_POSITION.row && col === HOME_POSITION.col) {
                cell.classList.add("home");
                cell.dataset.type = "home";
            }

            // Player 1 yard
            if (PLAYER1_YARD.some(p => p[0] === row && p[1] === col)) {
                cell.classList.add("yard1");
                cell.dataset.type = "yard1";
            }

            // Player 2 yard
            if (PLAYER2_YARD.some(p => p[0] === row && p[1] === col)) {
                cell.classList.add("yard2");
                cell.dataset.type = "yard2";
            }

            // Path cells
            const pathIndex = OUTER_PATH.findIndex(
                p => p[0] === row && p[1] === col
            );

            if (pathIndex !== -1) {
                cell.dataset.path = pathIndex;

                if (SAFE_POSITIONS.has(pathIndex)) {
                    cell.classList.add("safe");
                }

                if (pathIndex === START_POSITION[1]) {
                    cell.classList.add("start1");
                }

                if (pathIndex === START_POSITION[2]) {
                    cell.classList.add("start2");
                }
            }

            board.appendChild(cell);
        }
    }
}

/* ---------------------------------------------------------
   FIND CELL BY PATH POSITION
--------------------------------------------------------- */
function getPathCell(pathPosition) {
    const index = ((pathPosition % OUTER_PATH.length) + OUTER_PATH.length) % OUTER_PATH.length;
    const [row, col] = OUTER_PATH[index];
    return document.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`
    );
}

/* ---------------------------------------------------------
   GET CELL BY COORDINATES
--------------------------------------------------------- */
function getCell(row, col) {
    return document.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`
    );
}

/* ---------------------------------------------------------
   CLEAR MOVABLE HIGHLIGHTS
--------------------------------------------------------- */
function clearMovableHighlights() {
    document.querySelectorAll(".pawn.movable").forEach(pawn => {
        pawn.classList.remove("movable");
    });
}

/* ---------------------------------------------------------
   HIGHLIGHT PAWN
--------------------------------------------------------- */
function highlightPawn(pawnElement) {
    if (pawnElement) {
        pawnElement.classList.add("movable");
    }
}
