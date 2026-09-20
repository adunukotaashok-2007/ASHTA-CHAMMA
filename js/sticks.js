/* ASHTA CHAMMA STICK LOGIC & PROBABILITIES */

const STICK_PROBABILITIES = [
    { value: 1, weight: 22, dots: [1, 0] },
    { value: 2, weight: 20, dots: [1, 1] },
    { value: 3, weight: 18, dots: [2, 1] },
    { value: 4, weight: 15, dots: [2, 2] },
    { value: 5, weight: 12, dots: [3, 2] },
    { value: 6, weight: 8,  dots: [3, 3] },
    { value: 12, weight: 5, dots: [0, 0] }
];

function rollSticks() {
    const totalWeight = STICK_PROBABILITIES.reduce((acc, curr) => acc + curr.weight, 0);
    let random = Math.floor(Math.random() * totalWeight);
    
    for (const option of STICK_PROBABILITIES) {
        if (random < option.weight) {
            return option;
        }
        random -= option.weight;
    }
    return STICK_PROBABILITIES[0];
}

function renderStickFace(stickElement, dotCount) {
    if (!stickElement) return;
    const dotsArea = stickElement.querySelector('.dots-area');
    if (!dotsArea) return;
    dotsArea.innerHTML = '';
    
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotsArea.appendChild(dot);
    }
}

function updateSticksUI(player, stickData) {
    const s0 = document.getElementById(`p${player}-stick-0`);
    const s1 = document.getElementById(`p${player}-stick-1`);
    
    if (s0 && s1 && stickData) {
        renderStickFace(s0, stickData.dots[0]);
        renderStickFace(s1, stickData.dots[1]);
    }
}
