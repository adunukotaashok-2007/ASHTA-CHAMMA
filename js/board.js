const Board = {
    // 9 Traditional Safe Spots (4 Mid-sides, 4 Inner Corners, 1 Center)
    SAFE_SPACES: new Set([3, 8, 12, 21, 24, 27, 36, 40, 45]),
    
    // 49 Path Steps mapped to grid index:
    // Outer Loop = Steps 0 to 23 (24 squares)
    // Middle Loop = Steps 24 to 39
    // Inner Loop = Steps 40 to 47
    // Center Home = Step 48
    P1_PATH: [
        45, 46, 47, 48, 41, 34, 27, 20, 13, 6, 5, 4, 3, 2, 1, 0, 7, 14, 21, 28, 35, 42, 43, 44, // Outer (0-23)
        37, 36, 29, 22, 15, 8, 9, 10, 11, 12, 19, 26, 33, 40, 39, 38, // Middle (24-39)
        31, 32, 25, 18, 17, 16, 23, 30, // Inner (40-47)
        24 // Center Home (48)
    ],
    
    P2_PATH: [
        3, 2, 1, 0, 7, 14, 21, 28, 35, 42, 43, 44, 45, 46, 47, 48, 41, 34, 27, 20, 13, 6, 5, 4, // Outer (0-23)
        11, 12, 19, 26, 33, 40, 39, 38, 37, 36, 29, 22, 15, 8, 9, 10, // Middle (24-39)
        17, 16, 23, 30, 31, 32, 25, 18, // Inner (40-47)
        24 // Center Home (48)
    ],

    getPathIndex(player, step) {
        if (step < 0 || step > 48) return -1;
        return player === 1 ? this.P1_PATH[step] : this.P2_PATH[step];
    },

    init() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        for (let i = 0; i < 49; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            if (this.SAFE_SPACES.has(i)) {
                cell.classList.add('safe');
            }
            boardEl.appendChild(cell);
        }
    }
};

Board.init();
