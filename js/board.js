/* =========================================================
   ASHTA CHAMMA BOARD PATHS & SAFE ZONES
   7 × 7 BOARD
   Board positions: 1–49
   JavaScript grid indices: 0–48
   Center Home = 24
   ========================================================= */

const SAFE_SPACES = new Set([
    3, 8, 12, 21, 24, 27, 36, 40, 45
]);

/* =========================================================
   PLAYER 1 (RED / TOP YARD) ROUTE
   Starts at Top Mid (3).
   Outer Loop skips bottom corners to land perfectly on 12 (X).
   ========================================================= */
const P1_PATH = [
    // Outer Loop (21 steps)
    3, 2, 1, 0, 7, 14, 21, 28, 35, 42, 43, 44, 45, 46, 47, 48, 41, 34, 27, 20, 13,
    // Middle Loop (16 steps - enters exactly at X block 12)
    12, 19, 26, 33, 40, 39, 38, 37, 36, 29, 22, 15, 8, 9, 10, 11,
    // Inner Loop (8 steps)
    18, 17, 16, 23, 30, 31, 32, 25,
    // Center Home
    24
];

/* =========================================================
   PLAYER 2 (YELLOW / BOTTOM YARD) ROUTE
   Starts at Bottom Mid (45).
   Outer Loop skips top corners to land perfectly on 36 (X).
   ========================================================= */
const P2_PATH = [
    // Outer Loop (21 steps)
    45, 46, 47, 48, 41, 34, 27, 20, 13, 6, 5, 4, 3, 2, 1, 0, 7, 14, 21, 28, 35,
    // Middle Loop (16 steps - enters exactly at X block 36)
    36, 29, 22, 15, 8, 9, 10, 11, 12, 19, 26, 33, 40, 39, 38, 37,
    // Inner Loop (8 steps)
    30, 31, 32, 25, 18, 17, 16, 23,
    // Center Home
    24
];

function getPlayerPath(player) {
    return player === 1 ? P1_PATH : P2_PATH;
}
