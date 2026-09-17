/**
 * sticks.js — Dayakattai / Bara stick logic + animations
 * Two sticks, each face: blank(0), 1, 2, or 3 pips
 * Value = sum of faces. Both blank = BARA = 12.
 */

const Sticks = (() => {
    const NAMES = {
        1: 'Dāyam',
        2: 'Rendu',
        3: 'Mūḍu',
        4: 'Nālugu',
        5: 'Ayidu',
        6: 'Āru',
        12: 'BĀRĀ'
    };

    // Throws that allow new pawn entry AND give an extra turn
    const ENTRY_THROWS = new Set([1, 6, 12]);

    /**
     * Roll one stick face: 0 (blank), 1, 2, or 3
     */
    function rollFace() {
        return Math.floor(Math.random() * 4);
    }

    /**
     * Compute throw value from two faces
     */
    function computeValue(face1, face2) {
        if (face1 === 0 && face2 === 0) return 12; // BARA
        return face1 + face2;
    }

    /**
     * Render pips on a stick element
     */
    function renderStick(stickEl, faceValue) {
        stickEl.classList.toggle('blank', faceValue === 0);
        const faceDiv = stickEl.querySelector('.stick-face');
        faceDiv.innerHTML = '';
        for (let i = 0; i < faceValue; i++) {
            const pip = document.createElement('i');
            pip.className = 'pip';
            faceDiv.appendChild(pip);
        }
    }

    /**
     * Animate the throw — returns a Promise that resolves with {face1, face2, value}
     */
    function animateThrow(stick0El, stick1El) {
        return new Promise(resolve => {
            // Start rolling animation
            stick0El.classList.remove('rolling');
            stick1El.classList.remove('rolling');
            void stick0El.offsetWidth; // force reflow
            stick0El.classList.add('rolling');
            stick1El.classList.add('rolling');

            // Flicker faces during roll
            const flickerInterval = setInterval(() => {
                renderStick(stick0El, rollFace());
                renderStick(stick1El, rollFace());
            }, 65);

            // End roll
            setTimeout(() => {
                clearInterval(flickerInterval);
                stick0El.classList.remove('rolling');
                stick1El.classList.remove('rolling');

                const face1 = rollFace();
                const face2 = rollFace();
                renderStick(stick0El, face1);
                renderStick(stick1El, face2);

                const value = computeValue(face1, face2);

                resolve({ face1, face2, value });
            }, 750);
        });
    }

    /**
     * Check if value allows new pawn entry and extra turn
     */
    function isEntryThrow(value) {
        return ENTRY_THROWS.has(value);
    }

    /**
     * Get display name for value
     */
    function getName(value) {
        return NAMES[value] || String(value);
    }

    return {
        NAMES,
        ENTRY_THROWS,
        rollFace,
        computeValue,
        renderStick,
        animateThrow,
        isEntryThrow,
        getName
    };
})();
