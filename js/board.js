const Board = {
    // 9 Traditional Safe Spots
    SAFE_SPACES: new Set([3, 8, 12, 21, 24, 27, 36, 40, 45]),
    
    // Player 1 Route: 4 -> 1 -> 43 -> 49 -> 7 -> 5 -> 13 -> 41 -> 37 -> 9 -> 12 -> 33 -> 31 -> 17 -> 18 -> 25
    P1_PATH: [
        // Outer Loop (24 steps)
        3, 2, 1, 0, 7, 14, 21, 28, 35, 42, 43, 44, 45, 46, 47, 48, 41, 34, 27, 20, 13, 6, 5, 4,
        // Middle Loop (16 steps)
        11, 12, 19, 26, 33, 40, 39, 38, 37, 36, 29, 22, 15, 8, 9, 10,
        // Inner Loop (8 steps)
        18, 25, 32, 31, 30, 23, 16, 17,
        // Center Home
        24
    ],
    
    // Player 2 Route: 46 -> 49 -> 7 -> 1 -> 43 -> 45 -> 37 -> 9 -> 13 -> 41 -> 38 -> 17 -> 19 -> 33 -> 32 -> 25
    P2_PATH: [
        // Outer Loop (24 steps)
        45, 46, 47, 48, 41, 34, 27, 20, 13, 6, 5, 4, 3, 2, 1, 0, 7, 14, 21, 28, 35, 42, 43, 44,
        // Middle Loop (16 steps)
        37, 36, 29, 22, 15, 8, 9, 10, 11, 12, 19, 26, 33, 40, 39, 38,
        // Inner Loop (8 steps)
        30, 23, 16, 17, 18, 25, 32, 31,
        // Center Home
        24
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
