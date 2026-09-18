const BOARD_SIZE = 7;

const OUTER_PATH = [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
    [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
    [5,0],[4,0],[3,0],[2,0],[1,0]
];

const START_POSITION = { 1: 3, 2: 15 };
const SAFE_POSITIONS = new Set([0, 3, 6, 9, 12, 15, 18, 21]);
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

    // Build external yard slots
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
