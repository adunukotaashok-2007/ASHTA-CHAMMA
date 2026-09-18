/* =========================================================
   ASHTA CHAMMA - BOARD
   Counter-clockwise movement + traditional X safe zones
========================================================= */

const BOARD_SIZE = 7;

/*
    OUTER PATH - Counter-clockwise direction
    Starts at top-left, goes DOWN left side first.
*/
const OUTER_PATH = [
    // Left column (top → bottom)
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
    // Bottom row (left → right)
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
    // Right column (bottom → top)
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    // Top row (right → left)
    [0, 5], [0, 4], [0, 3], [0, 2], [0, 1]
];

/*
    Player start positions on the new path
    Player 1 → top middle [0, 3] → path index 21
    Player 2 → bottom middle [6, 3] → path index 9
*/
const START_POSITION = {
    1: 21,
    2: 9
};

/*
    Traditional safe zones - corners + mid-sides
*/
const SAFE_POSITIONS = new Set([
    0,   // top-left corner
    3,   // left mid
    6,   // bottom-left corner
    9,   // bottom mid (P2 start)
    12,  // bottom-right corner
    15,  // right mid
    18,  // top-right corner
    21   // top mid (P1 start)
]);

const HOME_POSITION = { row: 3, col: 3 };

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

    buildYardSlots(1);
    buildYardSlots(2);
}

function buildYardSlots(player) {
    const container = document.getElementById(player === 1 ? "yard1Slots" : "yard2Slots");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement("div");
        slot.className = "yard-slot";
        slot.dataset.player = player;
        slot.dataset.slot = i;
        container.appendChild(slot);
    }
}

function getPathCell(pathPosition) {
    const index = ((pathPosition % OUTER_PATH.length) + OUTER_PATH.length) % OUTER_PATH.length;
    const [row, col] = OUTER_PATH[index];
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function getYardSlot(player, pawnIndex) {
    const container = document.getElementById(player === 1 ? "yard1Slots" : "yard2Slots");
    if (!container) return null;
    return container.children[pawnIndex] || null;
}

function clearMovableHighlights() {
    document.querySelectorAll(".pawn.movable").forEach(p => p.classList.remove("movable"));
}

function highlightPawn(el) {
    if (el) el.classList.add("movable");
}
