document.addEventListener('DOMContentLoaded', () => {
    
    // Unlock Audio via user gesture
    const unlockAudio = () => {
        Sound.init();
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('click', unlockAudio);

    const soundToggleBtn = document.getElementById('soundToggleBtn');
    soundToggleBtn.addEventListener('click', () => {
        Sound.enabled = !Sound.enabled;
        soundToggleBtn.textContent = Sound.enabled ? "🔊" : "🔇";
    });

    const homeScreen = document.getElementById('homeScreen');
    const gameScreen = document.getElementById('gameScreen');

    function showGame() {
        homeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
    }

    function showHome() {
        gameScreen.classList.add('hidden');
        homeScreen.classList.remove('hidden');
    }

    document.getElementById('playLocalBtn').addEventListener('click', () => {
        Multiplayer.role = 'local';
        showGame();
        window.Game.initGame();
    });

    document.getElementById('backBtn').addEventListener('click', () => {
        if (confirm("Quit game and return to menu?")) {
            showHome();
        }
    });

    document.getElementById('throwBtn').addEventListener('click', () => {
        if (Multiplayer.role === 'guest') {
            Multiplayer.sendAction('throw', {});
        } else {
            window.Game.handleThrow();
        }
    });

    document.getElementById('newGameBtn').addEventListener('click', () => {
        if (confirm("Reset current game?")) {
            window.Game.initGame();
            if (Multiplayer.role === 'host') Multiplayer.sendState();
        }
    });

    window.showGame = showGame;
});
