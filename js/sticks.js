const Sticks = {
    THROW_NAMES: { 1: "Dayam", 2: "Rendu", 3: "Mūdu", 4: "Nālugu", 5: "Ayidu", 6: "Āru", 12: "Bārā" },
    
    roll(callback) {
        const values = [1, 2, 3, 4, 5, 6, 12];
        const weights = [22, 20, 18, 15, 12, 8, 5];
        
        let totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let result = 1;

        for (let i = 0; i < values.length; i++) {
            if (random < weights[i]) {
                result = values[i];
                break;
            }
            random -= weights[i];
        }

        Sound.playThrowSound();
        this.animateSticks(result, callback);
    },

    animateSticks(value, callback) {
        const sticks = document.querySelectorAll('.stick');
        const resultVal = document.getElementById('resultValue');
        const resultName = document.getElementById('resultName');
        const display = document.querySelector('.throw-result-display');

        display.classList.remove('extra-glow');
        resultVal.textContent = "?";
        resultName.textContent = "Rolling...";

        sticks.forEach(s => s.classList.add('rolling'));

        setTimeout(() => {
            sticks.forEach(s => {
                s.classList.remove('rolling');
                const pips = s.querySelector('.stick-pips');
                pips.innerHTML = '';
                
                // PIP DOT MAPPING FOR 2 STICKS:
                // 1 = 1,0 | 2 = 1,1 | 3 = 2,1 | 4 = 2,2 | 5 = 3,2 | 6 = 3,3 | 12 = 0,0 (Bārā!)
                let dotsCount = 0;
                if (value === 1) dotsCount = s.dataset.stick === "1" ? 1 : 0;
                else if (value === 2) dotsCount = 1;
                else if (value === 3) dotsCount = s.dataset.stick === "1" ? 2 : 1;
                else if (value === 4) dotsCount = 2;
                else if (value === 5) dotsCount = s.dataset.stick === "1" ? 3 : 2;
                else if (value === 6) dotsCount = 3; // Āru = 3 + 3
                else if (value === 12) dotsCount = 0; // Bārā = 0 + 0

                for (let i = 0; i < dotsCount; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'pip';
                    pips.appendChild(dot);
                }
            });

            resultVal.textContent = value;
            resultName.textContent = this.THROW_NAMES[value];
            
            if ([1, 6, 12].includes(value)) {
                display.classList.add('extra-glow');
            }

            callback(value);
        }, 600);
    }
};
