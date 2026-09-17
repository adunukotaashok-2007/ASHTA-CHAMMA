/* =========================================================
   ASHTA CHAMMA - BARA / DAYAKATTAI STICKS
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

/*
    Required throw values in traditional Ashta Chamma.
*/
const THROW_VALUES = [1, 2, 3, 4, 5, 6, 12];

/*
    Weighted probabilities to simulate realistic
    stick throws (higher values are rarer).
*/
const THROW_WEIGHTS = {
    1: 20,   // Dayam - common
    2: 20,   // Rendu - common
    3: 18,   // Mūdu - common
    4: 15,   // Nālugu
    5: 12,   // Ayidu
    6: 10,   // Āru
    12: 5    // Bārā - rare, powerful
};

/* ---------------------------------------------------------
   THROW BARA STICKS
--------------------------------------------------------- */
function throwBaraSticks() {
    // Build a weighted pool
    const pool = [];
    for (const value of THROW_VALUES) {
        const weight = THROW_WEIGHTS[value] || 1;
        for (let i = 0; i < weight; i++) {
            pool.push(value);
        }
    }

    // Random selection from weighted pool
    const value = pool[Math.floor(Math.random() * pool.length)];
    return value;
}

/* ---------------------------------------------------------
   GET THROW NAME
--------------------------------------------------------- */
function getThrowName(value) {
    return THROW_NAMES[value] || String(value);
}

/* ---------------------------------------------------------
   DISPLAY THROW RESULT
--------------------------------------------------------- */
function displayThrow(value) {
    const result = document.getElementById("throwResult");
    if (!result) return;
    result.textContent = `${getThrowName(value)} (${value})`;
}

/* ---------------------------------------------------------
   ANIMATE STICKS
--------------------------------------------------------- */
function animateSticks() {
    const stick1 = document.getElementById("stick1");
    const stick2 = document.getElementById("stick2");

    if (!stick1 || !stick2) return;

    // Remove previous animation
    stick1.classList.remove("flip1");
    stick2.classList.remove("flip2");

    // Force reflow so the animation restarts
    void stick1.offsetWidth;
    void stick2.offsetWidth;

    // Re-add animation classes
    stick1.classList.add("flip1");
    stick2.classList.add("flip2");
}
