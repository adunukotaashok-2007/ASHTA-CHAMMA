/* =========================================================
   ASHTA CHAMMA - BARA STICKS
========================================================= */

const THROW_NAMES = {
    1: "Dayam", 2: "Rendu", 3: "Mūdu", 4: "Nālugu",
    5: "Ayidu", 6: "Āru", 12: "Bārā"
};

const THROW_VALUES = [1, 2, 3, 4, 5, 6, 12];
const THROW_WEIGHTS = { 1: 22, 2: 20, 3: 18, 4: 15, 5: 12, 6: 8, 12: 5 };
const SPECIAL_THROWS = new Set([1, 6, 12]);

function throwBaraSticks() {
    const pool = [];
    for (const val of THROW_VALUES) {
        const w = THROW_WEIGHTS[val] || 1;
        for (let i = 0; i < w; i++) pool.push(val);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function getThrowName(value) {
    return THROW_NAMES[value] || String(value);
}

function setStickColor(player) {
    const s1 = document.getElementById("stick1");
    const s2 = document.getElementById("stick2");
    const owner = document.getElementById("stickOwner");

    if (s1 && s2) {
        s1.classList.remove("stick-p1", "stick-p2");
        s2.classList.remove("stick-p1", "stick-p2");
        const cls = player === 1 ? "stick-p1" : "stick-p2";
        s1.classList.add(cls);
        s2.classList.add(cls);
    }
    if (owner) {
        owner.textContent = player === 1 ? "🔴 Player 1 Sticks" : "🔵 Player 2 Sticks";
        owner.style.color = player === 1 ? "#ff8b8b" : "#78aaff";
    }
}

function drawStickFace(faceEl, dots) {
    if (!faceEl) return;
    faceEl.innerHTML = "";
    for (let i = 0; i < dots; i++) {
        const pip = document.createElement("div");
        pip.className = "pip";
        faceEl.appendChild(pip);
    }
}

function showStickFaces(value) {
    let a = 0, b = 0;
    if (value === 1)      { a = 1; b = 0; }
    else if (value === 2) { a = 1; b = 1; }
    else if (value === 3) { a = 2; b = 1; }
    else if (value === 4) { a = 2; b = 2; }
    else if (value === 5) { a = 3; b = 2; }
    else if (value === 6) { a = 3; b = 3; }
    else if (value === 12){ a = 3; b = 3; }

    drawStickFace(document.getElementById("face1"), a);
    drawStickFace(document.getElementById("face2"), b);
}

function displayThrow(value) {
    const result = document.getElementById("throwResult");
    if (!result) return;

    const name = getThrowName(value);
    const special = SPECIAL_THROWS.has(value);

    result.innerHTML = `
        <div class="throw-number ${special ? "special" : ""}">${value}</div>
        <div class="throw-name">${name}</div>
        ${special ? '<div class="throw-bonus">✨ Extra Turn!</div>' : ''}
    `;
    result.classList.remove("pop");
    void result.offsetWidth;
    result.classList.add("pop");

    showStickFaces(value);
}

function resetThrowDisplay() {
    const result = document.getElementById("throwResult");
    if (result) result.innerHTML = `<div class="throw-ready">Ready</div>`;
    drawStickFace(document.getElementById("face1"), 0);
    drawStickFace(document.getElementById("face2"), 0);
}

function animateSticks() {
    const s1 = document.getElementById("stick1");
    const s2 = document.getElementById("stick2");
    if (!s1 || !s2) return;
    s1.classList.remove("flip1");
    s2.classList.remove("flip2");
    void s1.offsetWidth;
    void s2.offsetWidth;
    s1.classList.add("flip1");
    s2.classList.add("flip2");
}
