/* BUSINESS BOARD GAME ENGINE & DATA */

const BUSINESS_PROPERTIES = [
    { id: 0, name: "START", type: "start", price: 0, rent: 0, icon: "🚩", desc: "Pass or land to collect ₹2000" },
    { id: 1, name: "Mumbai", type: "property", group: "red", price: 1200, rent: 120, houseCost: 500, icon: "🏙️" },
    { id: 2, name: "Income Tax", type: "tax", price: 0, cost: 1000, icon: "💸", desc: "Pay ₹1000 Tax" },
    { id: 3, name: "Water Works", type: "utility", group: "utility", price: 1500, rent: 150, icon: "🚰" },
    { id: 4, name: "Central Railway", type: "transport", group: "transport", price: 2000, rent: 200, icon: "🚂" },
    { id: 5, name: "Pune", type: "property", group: "red", price: 1400, rent: 140, houseCost: 500, icon: "🏢" },
    { id: 6, name: "Chance", type: "chance", price: 0, rent: 0, icon: "❓" },
    { id: 7, name: "Ahmedabad", type: "property", group: "red", price: 1600, rent: 160, houseCost: 500, icon: "🕌" },
    { id: 8, name: "Jaipur", type: "property", group: "yellow", price: 1800, rent: 180, houseCost: 600, icon: "🏰" },
    { id: 9, name: "Jail / Rest", type: "jail", price: 0, rent: 0, icon: "🔒", desc: "Just Visiting / Jail" },
    { id: 10, name: "Indore", type: "property", group: "yellow", price: 2000, rent: 200, houseCost: 600, icon: "🏙️" },
    { id: 11, name: "Electric Co", type: "utility", group: "utility", price: 1500, rent: 150, icon: "⚡" },
    { id: 12, name: "Delhi", type: "property", group: "yellow", price: 2200, rent: 220, houseCost: 600, icon: "🏛️" },
    { id: 13, name: "Air India", type: "transport", group: "transport", price: 2500, rent: 250, icon: "✈️" },
    { id: 14, name: "Chandigarh", type: "property", group: "green", price: 2400, rent: 240, houseCost: 700, icon: "🌲" },
    { id: 15, name: "Community Chest", type: "chest", price: 0, rent: 0, icon: "🧰" },
    { id: 16, name: "Shimla", type: "property", group: "green", price: 2600, rent: 260, houseCost: 700, icon: "🏔️" },
    { id: 17, name: "Amritsar", type: "property", group: "green", price: 2800, rent: 280, houseCost: 700, icon: "🛕" },
    { id: 18, name: "Rest House", type: "rest", price: 0, rent: 0, icon: "🏨", desc: "Enjoy your rest!" },
    { id: 19, name: "Srinagar", type: "property", group: "blue", price: 3000, rent: 300, houseCost: 800, icon: "🏔️" },
    { id: 20, name: "Chance", type: "chance", price: 0, rent: 0, icon: "❓" },
    { id: 21, name: "Agra", type: "property", group: "blue", price: 3200, rent: 320, houseCost: 800, icon: "🕌" },
    { id: 22, name: "Motor Boat", type: "transport", group: "transport", price: 2000, rent: 200, icon: "🛥️" },
    { id: 23, name: "Lucknow", type: "property", group: "blue", price: 3500, rent: 350, houseCost: 800, icon: "🏰" },
    { id: 24, name: "Wealth Tax", type: "tax", price: 0, cost: 1500, icon: "💎", desc: "Pay ₹1500 Wealth Tax" },
    { id: 25, name: "Kanpur", type: "property", group: "purple", price: 3800, rent: 380, houseCost: 900, icon: "🏭" },
    { id: 26, name: "Patna", type: "property", group: "purple", price: 4000, rent: 400, houseCost: 900, icon: "🏛️" },
    { id: 27, name: "Go to Jail", type: "gotojail", price: 0, rent: 0, icon: "👮", desc: "Directly to Jail!" },
    { id: 28, name: "Kolkata", type: "property", group: "purple", price: 4200, rent: 420, houseCost: 900, icon: "🌉" },
    { id: 29, name: "Community Chest", type: "chest", price: 0, rent: 0, icon: "🧰" },
    { id: 30, name: "Hyderabad", type: "property", group: "orange", price: 4500, rent: 450, houseCost: 1000, icon: "🏰" },
    { id: 31, name: "Transport Co", type: "transport", group: "transport", price: 2000, rent: 200, icon: "🚛" },
    { id: 32, name: "Bangalore", type: "property", group: "orange", price: 4800, rent: 480, houseCost: 1000, icon: "💻" },
    { id: 33, name: "Chance", type: "chance", price: 0, rent: 0, icon: "❓" },
    { id: 34, name: "Chennai", type: "property", group: "orange", price: 5000, rent: 500, houseCost: 1000, icon: "🌊" },
    { id: 35, name: "Goa", type: "property", group: "gold", price: 6000, rent: 600, houseCost: 1200, icon: "🏖️" }
];

let bizState = {
    playersCount: 2,
    currentPlayer: 0,
    players: [],
    properties: {},
    hasRolled: false,
    inJail: [false, false, false, false],
    jailTurns: [0, 0, 0, 0],
    gameOver: false
};

function initBusinessGame(playerNames, playerCount = 2) {
    bizState.playersCount = playerCount;
    bizState.currentPlayer = 0;
    bizState.hasRolled = false;
    bizState.gameOver = false;
    bizState.properties = {};
    bizState.inJail = [false, false, false, false];
    bizState.jailTurns = [0, 0, 0, 0];

    const colors = ['token-p1', 'token-p2', 'token-p3', 'token-p4'];
    bizState.players = [];

    for (let i = 0; i < playerCount; i++) {
        bizState.players.push({
            id: i,
            name: playerNames[i] || `Player ${i + 1}`,
            money: 15000,
            position: 0,
            colorClass: colors[i],
            bankrupt: false
        });
    }

    BUSINESS_PROPERTIES.forEach(prop => {
        if (["property", "transport", "utility"].includes(prop.type)) {
            bizState.properties[prop.id] = { owner: null, houses: 0 };
        }
    });

    renderBusinessBoard();
    updateBizUI();
    addBizLog("🎮 Game Started! Each player receives ₹15,000.");
}

function getGridAreaForIndex(index) {
    if (index >= 0 && index <= 9) {
        return { col: 10 - index, row: 10 };
    } else if (index >= 10 && index <= 17) {
        return { col: 1, row: 10 - (index - 9) };
    } else if (index >= 18 && index <= 27) {
        return { col: index - 17, row: 1 };
    } else if (index >= 28 && index <= 35) {
        return { col: 10, row: index - 27 };
    }
}

function renderBusinessBoard() {
    const boardEl = document.getElementById('business-board');
    boardEl.querySelectorAll('.biz-cell').forEach(c => c.remove());

    BUSINESS_PROPERTIES.forEach(prop => {
        const cell = document.createElement('div');
        cell.className = 'biz-cell';
        cell.dataset.id = prop.id;

        const pos = getGridAreaForIndex(prop.id);
        cell.style.gridColumn = pos.col;
        cell.style.gridRow = pos.row;

        if (prop.type === 'property') {
            cell.innerHTML = `
                <div class="color-bar color-${prop.group}"></div>
                <div class="houses-container" id="houses-cell-${prop.id}"></div>
                <div class="cell-name">${prop.name}</div>
                <div class="cell-price">₹${prop.price}</div>
            `;
        } else if (["transport", "utility"].includes(prop.type)) {
            cell.innerHTML = `
                <div class="color-bar color-${prop.group}"></div>
                <div class="cell-icon">${prop.icon}</div>
                <div class="cell-name">${prop.name}</div>
                <div class="cell-price">₹${prop.price}</div>
            `;
        } else {
            cell.classList.add('corner-cell');
            cell.innerHTML = `
                <div class="cell-icon">${prop.icon}</div>
                <div class="cell-name">${prop.name}</div>
            `;
        }

        const tokenLayer = document.createElement('div');
        tokenLayer.className = 'biz-tokens-layer';
        tokenLayer.id = `tokens-cell-${prop.id}`;
        cell.appendChild(tokenLayer);

        boardEl.appendChild(cell);
    });
}

function updateBizUI() {
    // Render Player Summary
    const summaryContainer = document.getElementById('biz-players-summary');
    summaryContainer.innerHTML = '';

    bizState.players.forEach((p, idx) => {
        const pCard = document.createElement('div');
        pCard.className = `biz-player-card ${idx === bizState.currentPlayer ? 'active-turn' : ''}`;
        pCard.innerHTML = `
            <div class="p-name">${p.name} ${p.bankrupt ? '(Bankrupt)' : ''}</div>
            <div class="p-money">₹${p.money}</div>
        `;
        summaryContainer.appendChild(pCard);
    });

    // Render Tokens & Owners
    BUSINESS_PROPERTIES.forEach(prop => {
        const tokenLayer = document.getElementById(`tokens-cell-${prop.id}`);
        if (tokenLayer) {
            tokenLayer.innerHTML = '';
            bizState.players.forEach(p => {
                if (!p.bankrupt && p.position === prop.id) {
                    const token = document.createElement('div');
                    token.className = `biz-token ${p.colorClass}`;
                    tokenLayer.appendChild(token);
                }
            });
        }

        // Owner indicators & houses
        const propState = bizState.properties[prop.id];
        if (propState && propState.owner !== null) {
            const cell = document.querySelector(`.biz-cell[data-id="${prop.id}"]`);
            if (cell) {
                let tag = cell.querySelector('.owner-tag');
                if (!tag) {
                    tag = document.createElement('div');
                    tag.className = 'owner-tag';
                    cell.appendChild(tag);
                }
                const ownerPlayer = bizState.players[propState.owner];
                tag.style.background = ownerPlayer ? (ownerPlayer.id === 0 ? '#ef4444' : '#3b82f6') : '#999';
            }
        }
    });

    // Turn Text & Controls
    const curr = bizState.players[bizState.currentPlayer];
    document.getElementById('biz-turn-text').textContent = `${curr.name}'s Turn`;

    const rollBtn = document.getElementById('biz-roll-btn');
    const buyBtn = document.getElementById('biz-buy-btn');
    const passBtn = document.getElementById('biz-pass-btn');
    const jailPayBtn = document.getElementById('biz-jail-pay-btn');
    const endTurnBtn = document.getElementById('biz-end-turn-btn');

    if (!bizState.hasRolled) {
        rollBtn.classList.remove('hidden');
        buyBtn.classList.add('hidden');
        passBtn.classList.add('hidden');
        endTurnBtn.classList.add('hidden');

        if (bizState.inJail[curr.id]) {
            jailPayBtn.classList.remove('hidden');
        } else {
            jailPayBtn.classList.add('hidden');
        }
    }
}

function handleBizRoll() {
    if (bizState.hasRolled || bizState.gameOver) return;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;

    document.getElementById('biz-die-1').textContent = die1;
    document.getElementById('biz-die-2').textContent = die2;

    const curr = bizState.players[bizState.currentPlayer];

    if (bizState.inJail[curr.id]) {
        if (die1 === die2) {
            bizState.inJail[curr.id] = false;
            addBizLog(`🔓 ${curr.name} rolled doubles (${die1}-${die2}) and escaped Jail!`);
        } else {
            addBizLog(`🔒 ${curr.name} rolled ${total} and remains in Jail.`);
            bizState.hasRolled = true;
            document.getElementById('biz-roll-btn').classList.add('hidden');
            document.getElementById('biz-end-turn-btn').classList.remove('hidden');
            return;
        }
    }

    bizState.hasRolled = true;
    document.getElementById('biz-roll-btn').classList.add('hidden');

    // Move player
    let newPos = curr.position + total;
    if (newPos >= 36) {
        newPos -= 36;
        curr.money += 2000;
        addBizLog(`🚩 ${curr.name} passed START and collected ₹2,000!`);
    }
    curr.position = newPos;

    updateBizUI();
    handleBizLanding(curr, newPos);
}

function handleBizLanding(player, pos) {
    const prop = BUSINESS_PROPERTIES[pos];
    const promptMsg = document.getElementById('biz-prompt-msg');
    const buyBtn = document.getElementById('biz-buy-btn');
    const passBtn = document.getElementById('biz-pass-btn');
    const endTurnBtn = document.getElementById('biz-end-turn-btn');

    if (["property", "transport", "utility"].includes(prop.type)) {
        const state = bizState.properties[prop.id];

        if (state.owner === null) {
            promptMsg.textContent = `Landed on unowned ${prop.name}. Buy for ₹${prop.price}?`;
            buyBtn.classList.remove('hidden');
            passBtn.classList.remove('hidden');
        } else if (state.owner === player.id) {
            promptMsg.textContent = `Welcome back to your property, ${prop.name}!`;
            endTurnBtn.classList.remove('hidden');
        } else {
            // Rent Payment
            const owner = bizState.players[state.owner];
            let rentCost = prop.rent;

            player.money -= rentCost;
            owner.money += rentCost;
            addBizLog(`💸 ${player.name} landed on ${prop.name} and paid ₹${rentCost} rent to ${owner.name}.`);
            promptMsg.textContent = `Paid ₹${rentCost} rent to ${owner.name}.`;
            checkBankruptcy(player);
            endTurnBtn.classList.remove('hidden');
        }
    } else if (prop.type === 'tax') {
        player.money -= prop.cost;
        addBizLog(`💸 ${player.name} paid ₹${prop.cost} ${prop.name}.`);
        promptMsg.textContent = `Paid ₹${prop.cost} ${prop.name}.`;
        checkBankruptcy(player);
        endTurnBtn.classList.remove('hidden');
    } else if (prop.type === 'gotojail') {
        player.position = 9; // Jail
        bizState.inJail[player.id] = true;
        addBizLog(`👮 ${player.name} went directly to JAIL!`);
        promptMsg.textContent = `You are sent to Jail!`;
        endTurnBtn.classList.remove('hidden');
    } else if (['chance', 'chest'].includes(prop.type)) {
        handleChanceCard(player);
        endTurnBtn.classList.remove('hidden');
    } else {
        promptMsg.textContent = prop.desc || `Landed on ${prop.name}.`;
        endTurnBtn.classList.remove('hidden');
    }

    updateBizUI();
}

function handleChanceCard(player) {
    const cards = [
        { text: "Bank Dividend! Collect ₹1,500", amount: 1500 },
        { text: "Speeding Fine! Pay ₹500", amount: -500 },
        { text: "Stock Market Bonus! Collect ₹2,000", amount: 2000 },
        { text: "Property Repair! Pay ₹1,000", amount: -1000 }
    ];
    const card = cards[Math.floor(Math.random() * cards.length)];
    player.money += card.amount;
    addBizLog(`❓ Chance: ${card.text}`);
    document.getElementById('biz-prompt-msg').textContent = card.text;
    checkBankruptcy(player);
}

function handleBizBuy() {
    const curr = bizState.players[bizState.currentPlayer];
    const prop = BUSINESS_PROPERTIES[curr.position];
    const state = bizState.properties[prop.id];

    if (curr.money >= prop.price) {
        curr.money -= prop.price;
        state.owner = curr.id;
        addBizLog(`🏢 ${curr.name} bought ${prop.name} for ₹${prop.price}!`);
    } else {
        addBizLog(`⚠️ ${curr.name} does not have enough money to buy ${prop.name}.`);
    }

    document.getElementById('biz-buy-btn').classList.add('hidden');
    document.getElementById('biz-pass-btn').classList.add('hidden');
    document.getElementById('biz-end-turn-btn').classList.remove('hidden');
    updateBizUI();
}

function handleBizJailPay() {
    const curr = bizState.players[bizState.currentPlayer];
    if (curr.money >= 500) {
        curr.money -= 500;
        bizState.inJail[curr.id] = false;
        addBizLog(`🔑 ${curr.name} paid ₹500 bail and is out of Jail!`);
        document.getElementById('biz-jail-pay-btn').classList.add('hidden');
        updateBizUI();
    }
}

function checkBankruptcy(player) {
    if (player.money < 0) {
        player.bankrupt = true;
        addBizLog(`🚨 ${player.name} is bankrupt!`);
        
        const activePlayers = bizState.players.filter(p => !p.bankrupt);
        if (activePlayers.length === 1) {
            bizState.gameOver = true;
            addBizLog(`🏆 ${activePlayers[0].name} WINS THE BUSINESS GAME!`);
            alert(`🎉 ${activePlayers[0].name} Wins Business Game!`);
        }
    }
}

function handleBizEndTurn() {
    do {
        bizState.currentPlayer = (bizState.currentPlayer + 1) % bizState.playersCount;
    } while (bizState.players[bizState.currentPlayer].bankrupt);

    bizState.hasRolled = false;
    document.getElementById('biz-prompt-msg').textContent = "Roll dice to start turn!";
    updateBizUI();
}

function addBizLog(msg) {
    const logEl = document.getElementById('biz-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = msg;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
}
