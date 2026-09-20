/* APPLICATION ROUTER & UI EVENT LISTENERS */

document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        select: document.getElementById('game-select-screen'),
        ashtaSetup: document.getElementById('ashta-setup-screen'),
        bizSetup: document.getElementById('business-setup-screen'),
        ashtaGame: document.getElementById('game-screen'),
        bizGame: document.getElementById('business-screen')
    };

    function showScreen(targetScreen) {
        Object.values(screens).forEach(s => s && s.classList.remove('active'));
        if (targetScreen) targetScreen.classList.add('active');
    }

    // MAIN MENU BUTTONS
    document.getElementById('select-ashta-btn').onclick = () => showScreen(screens.ashtaSetup);
    document.getElementById('select-business-btn').onclick = () => showScreen(screens.bizSetup);

    document.querySelectorAll('.back-to-menu-btn').forEach(btn => {
        btn.onclick = () => showScreen(screens.select);
    });

    // ASHTA SETUP LOGIC
    window.isHotseat = true;
    document.getElementById('ashta-mode-local').onclick = () => {
        window.isHotseat = true;
        document.getElementById('ashta-mode-local').classList.add('active');
        document.getElementById('ashta-mode-online').classList.remove('active');
        document.getElementById('ashta-local-form').classList.remove('hidden');
        document.getElementById('ashta-online-form').classList.add('hidden');
    };

    document.getElementById('ashta-mode-online').onclick = () => {
        window.isHotseat = false;
        document.getElementById('ashta-mode-online').classList.add('active');
        document.getElementById('ashta-mode-local').classList.remove('active');
        document.getElementById('ashta-online-form').classList.remove('hidden');
        document.getElementById('ashta-local-form').classList.add('hidden');
    };

    document.getElementById('start-ashta-local-btn').onclick = () => {
        showScreen(screens.ashtaGame);
        initAshtaBoardUI();
    };

    document.getElementById('roll-sticks-btn').onclick = handleAshtaRoll;

    // BUSINESS SETUP LOGIC
    const countSelect = document.getElementById('biz-player-count');
    countSelect.onchange = (e) => {
        const val = parseInt(e.target.value);
        document.querySelector('.biz-p3-field').classList.toggle('hidden', val < 3);
        document.querySelector('.biz-p4-field').classList.toggle('hidden', val < 4);
    };

    document.getElementById('start-biz-local-btn').onclick = () => {
        const pCount = parseInt(countSelect.value);
        const names = [
            document.getElementById('biz-p1-name').value,
            document.getElementById('biz-p2-name').value,
            document.getElementById('biz-p3-name').value,
            document.getElementById('biz-p4-name').value
        ];
        showScreen(screens.bizGame);
        initBusinessGame(names, pCount);
    };

    document.getElementById('biz-roll-btn').onclick = handleBizRoll;
    document.getElementById('biz-buy-btn').onclick = handleBizBuy;
    document.getElementById('biz-pass-btn').onclick = () => {
        document.getElementById('biz-buy-btn').classList.add('hidden');
        document.getElementById('biz-pass-btn').classList.add('hidden');
        document.getElementById('biz-end-turn-btn').classList.remove('hidden');
    };
    document.getElementById('biz-jail-pay-btn').onclick = handleBizJailPay;
    document.getElementById('biz-end-turn-btn').onclick = handleBizEndTurn;

    // AUDIO TOGGLES
    document.getElementById('ashta-audio-toggle').onclick = (e) => {
        gameState.soundMuted = !gameState.soundMuted;
        e.target.textContent = gameState.soundMuted ? '🔇' : '🔊';
    };
});
