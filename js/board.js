/* =========================================================
   ASHTA CHAMMA - BOARD (7x7 Grid with Path Navigation)
========================================================= */

const BOARD_SIZE = 7;

/*
    Outer 24-cell perimeter path
*/
const OUTER_PATH = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
    [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
    [5, 0], [4, 0], [3, 0], [2, 0], [1, 0]
];

/* Player entry positions on the outer path */
const START_POSITION = {
    1: 3,  // [0, 3] Top-Middle
    2: 15  // [6, 3] Bottom-Middle
};

/* Safe squares where pawns cannot be captured */
const SAFE_POSITIONS = new Set([0, 3, 6, 9, 12, 15, 18, 21]);

/* Center Home */
const HOME_POSITION = { row: 3, col: 3 };

/* Yards for un-entered pawns */
const PLAYER1_YARD = [[1, 1], [1, 2], [2, 1], [2, 2], [1, 3], [2, 3]];
const PLAYER2_YARD = [[4, 3], [4, 4], [5, 3], [5, 4], [5, 5], [4, 5]];

function createBoard() {
    const board = document.getElementById("board");
    if (!board) return;
    board.innerHTML = "";

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            if ((row + col) % 2 === 1) cell.classList.add("dark");

            if (row === HOME_POSITION.row && col === HOME_POSITION.col) {
                cell.classList.add("home");
                cell.dataset.type = "home";
            }

            if (PLAYER1_YARD.some(p => p[0] === row && p[1] === col)) {
                cell.classList.add("yard1");
                cell.dataset.type = "yard1";
            }

            if (PLAYER2_YARD.some(p => p[0] === row && p[1] === col)) {
                cell.classList.add("yard2");
                cell.dataset.type = "yard2";
            }

            const pathIndex = OUTER_PATH.findIndex(p => p[0] === row && p[1] === col);
            if (pathIndex !== -1) {
                cell.dataset.path = pathIndex;
                if (SAFE_POSITIONS.has(pathIndex)) cell.classList.add("safe");
                if (pathIndex === START_POSITION[1]) cell.classList.add("start1");
                if (pathIndex === START_POSITION[2]) cell.classList.add("start2");
            }

            board.appendChild(cell);
        }
    }
}

function getPathCell(pathPosition) {
    const index = ((pathPosition % OUTER_PATH.length) + OUTER_PATH.length) % OUTER_PATH.length;
    const [row, col] = OUTER_PATH[index];
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function clearMovableHighlights() {
    document.querySelectorAll(".pawn.movable").forEach(pawn => pawn.classList.remove("movable"));
}

function highlightPawn(pawnElement) {
    if (pawnElement) pawnElement.classList.add("movable");
}
