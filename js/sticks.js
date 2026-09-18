/* =========================================================
   ASHTA CHAMMA - BARA STICKS WITH VISUAL DISPLAY
========================================================= */

const THROW_NAMES = {
    1: "Dayam",
    2: "Rendu",
    3: "Mūdu",
    4: "Nālugu",
    5: "Ayidu",
    6: "Āru",
    12: "Bārā"
};

const THROW_VALUES = [1, 2, 3, 4, 5, 6, 12];
const THROW_WEIGHTS = { 1: 22, 2: 20, 3: 18, 4: 15, 5: 12, 6: 8, 12: 5 };

/* Special throws that grant extra turn */
const SPECIAL_THROWS = new Set([1, 6, 12]);

function throwBaraSticks() {
    const pool = [];
    for (const val of THROW_VALUES) {
        const weight = THROW_WEIGHTS[val] || 1;
        for (let i = 0; i < weight; i++) pool.push(val);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function getThrowName(value) {
    return THROW_NAMES[value] || String(value);
}

/* ---------------------------------------------------------
   DISPLAY THROW - BIG VISUAL NUMBER
--------------------------------------------------------- */
function displayThrow(value) {
    const result = document.getElementById("throwResult");
    if (!result) return;

    const name = getThrowName(value);
    const isSpecial = SPECIAL_THROWS.has(value);

    // Big number with Telugu name below
    result.innerHTML = `
        <div class="throw-number ${isSpecial ? 'special' : ''}">${value}</div>
        <div class="throw-name">${name}</div>
        ${isSpecial ? '<div class="throw-bonus">✨ Extra Turn!</div>' : ''}
    `;

    // Trigger pop animation
    result.classList.remove("pop");
    void result.offsetWidth;
    result.classList.add("pop");
}

/* ---------------------------------------------------------
   RESET DISPLAY (for new game)
--------------------------------------------------------- */
function resetThrowDisplay() {
    const result = document.getElementById("throwResult");
    if (result) {
        result.innerHTML = `<div class="throw-ready">Ready to throw</div>`;
    }
}

/* ---------------------------------------------------------
   ANIMATE STICKS - WITH NUMBER OVERLAY
--------------------------------------------------------- */
function animateSticks() {
    const stick1 = document.getElementById("stick1");
    const stick2 = document.getElementById("stick2");
    if (!stick1 || !stick2) return;

    stick1.classList.remove("flip1");
    stick2.classList.remove("flip2");
    void stick1.offsetWidth;
    void stick2.offsetWidth;
    stick1.classList.add("flip1");
    stick2.classList.add("flip2");
}
