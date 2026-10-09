let countdownTime = 49;
let timerId = null, gameLoopId = null;
let currentGameId = 1;
let selectedCards = [];
let calledNumbers = [];
let cardPool = {};

let mainWallet = 0, playWallet = 10, stakeAmount = 10;
let telegramId = 12345678;
let telegramUsername = "@HabeshaPlayer";
let isStakeLocked = false;
let maxCardsAllowed = 1;
const BACKEND_URL = window.location.origin;

document.addEventListener("DOMContentLoaded", () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const webapp = window.Telegram.WebApp;
        webapp.ready();
        if (webapp.initDataUnsafe && webapp.initDataUnsafe.user) {
            telegramId = webapp.initDataUnsafe.user.id;
            telegramUsername = webapp.initDataUnsafe.user.username ? "@" + webapp.initDataUnsafe.user.username : "@Player";
        }
    }
    fetchUserProfile();
    generateCardSelectionGrid();
    generateScoreboardGrid();
    preGenerateBingoCards();
    
    document.getElementById("main-top-bar").classList.add("hidden");
    document.getElementById("stake-gate-screen").classList.remove("hidden");
});

function fetchUserProfile() {
    fetch(`${BACKEND_URL}/api/user/${telegramId}`)
        .then(res => res.json())
        .then(data => {
            if(!data.error) {
                mainWallet = data.main_wallet; playWallet = data.play_wallet;
                document.getElementById("prof-tg-id").innerText = data.telegram_id;
                document.getElementById("prof-phone").innerText = data.telephone;
                updateWalletUI();
            }
        }).catch(e => console.log("Standalone mode active"));
}

function updateWalletUI() {
    document.getElementById("top-main-wallet-sel").innerText = mainWallet;
    document.getElementById("top-play-wallet-sel").innerText = playWallet;
    document.getElementById("top-main-wallet-game").innerText = mainWallet;
    document.getElementById("top-play-wallet-game").innerText = playWallet;
    document.getElementById("wallet-main-val").innerText = mainWallet;
    document.getElementById("wallet-play-val").innerText = playWallet;
    document.getElementById("prof-main-w").innerText = mainWallet;
    document.getElementById("prof-play-w").innerText = playWallet;
    
    const alertBox = document.getElementById("wallet-status-alert");
    if (playWallet < 10) alertBox.classList.remove("hidden");
    else alertBox.classList.add("hidden");
}

function handleSessionRefresh() {
    selectedCards = [];
    document.querySelectorAll('.card-box').forEach(box => {
        box.className = "card-box";
    });
    console.log("[REFRESH] ካርቴላዎች ብቻ እንዲጸዱ ተደርጓል፤ ታይመሩ በቦታው ይቆያል።");
}

function selectStakeAndStartGame(amount) {
    stakeAmount = amount;
    isStakeLocked = true;
    document.getElementById("top-stake").innerText = amount;
    
    if (stakeAmount === 20) { maxCardsAllowed = 2; } 
    else { maxCardsAllowed = 1; }
    
    document.getElementById("stake-gate-screen").classList.add("hidden");
    document.getElementById("main-top-bar").classList.remove("hidden"); 
    document.getElementById("app-main-content").classList.remove("hidden");
    document.getElementById("app-nav-bar").classList.remove("hidden");
    startCountdown();
}

window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if(element) element.classList.add('active');
};

function generateCardSelectionGrid() {
    const grid = document.getElementById("cards-grid");
    grid.innerHTML = "";
    for (let i = 1; i <= 600; i++) {
        const box = document.createElement("div");
        box.className = "card-box";
        box.innerText = i;
        box.onclick = () => {
            if (playWallet < 10) return;
            
            if (box.classList.contains("selected")) {
                box.className = "card-box";
                selectedCards = selectedCards.filter(id => id !== i);
            } else {
                if (selectedCards.length >= maxCardsAllowed) {
                    if (maxCardsAllowed === 1) {
                        document.querySelectorAll('.card-box').forEach(b => b.className = "card-box");
                        box.className = "card-box selected";
                        selectedCards = [i];
                    } else {
                        let removed = selectedCards.shift();
                        document.querySelectorAll('.card-box').forEach(b => {
                            if(parseInt(b.innerText) === removed) b.className = "card-box";
                        });
                        box.className = "card-box selected";
                        selectedCards.push(i);
                    }
                } else {
                    box.className = "card-box selected";
                    selectedCards.push(i);
                }
            }
        };
        grid.appendChild(box);
    }
}

function generateScoreboardGrid() {
    const bands = [
        { id: "board-b", start: 1, end: 15 }, { id: "board-i", start: 16, end: 30 },
        { id: "board-n", start: 31, end: 45 }, { id: "board-g", start: 46, end: 60 },
        { id: "board-o", start: 61, end: 75 }
    ];
    bands.forEach(band => {
        const col = document.getElementById(band.id);
        col.innerHTML = "";
        for (let i = band.start; i <= band.end; i++) {
            const cell = document.createElement("div");
            cell.className = "board-num-cell";
            cell.id = `score-cell-${i}`;
            cell.innerText = i;
            col.appendChild(cell);
        }
    });
}

function preGenerateBingoCards() {
    for (let c = 1; c <= 600; c++) {
        let b = getRandomNumbers(1, 15), i = getRandomNumbers(16, 30), n = getRandomNumbers(31, 45), g = getRandomNumbers(46, 60), o = getRandomNumbers(61, 75);
        let matrix = [];
        for(let r=0; r<5; r++) matrix[r] = [b[r], i[r], n[r], g[r], o[r]];
        matrix = "FREE";
        cardPool[c] = matrix;
    }
}

function getRandomNumbers(min, max) {
    let list = [];
    while(list.length < 5) {
        let r = Math.floor(Math.random() * (max - min + 1)) + min;
        if(!list.includes(r)) list.push(r);
    }
    return list.sort((x, y) => x - y);
}

function startCountdown() {
    countdownTime = 49;
    document.getElementById("timer-sec").innerText = countdownTime;
    
    const refreshBtnNode = document.getElementById("top-refresh-action-button");
    if (refreshBtnNode) refreshBtnNode.classList.remove("hidden");

    document.getElementById("selection-header-metrics").classList.remove("hidden");
    document.getElementById("timer-box-wrapper").classList.remove("hidden");
    document.getElementById("gameplay-header-metrics").classList.add("hidden");
    document.getElementById("selection-screen").classList.remove("hidden");
    document.getElementById("gameplay-screen").classList.add("hidden");
    document.querySelectorAll('.board-num-cell').forEach(c => c.className = "board-num-cell");
    
    const smallScreen = document.getElementById("called-ball-display");
    if(smallScreen) { smallScreen.className = "called-ball-empty"; smallScreen.innerText = "-"; }

    if(timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        countdownTime--;
        document.getElementById("timer-sec").innerText = countdownTime;
        
        if(countdownTime <= 0) {
            clearInterval(timerId);
            launchMatchPlay();
        }
    }, 1000);
}

function launchMatchPlay() {
    document.getElementById("selection-header-metrics").classList.add("hidden");
    document.getElementById("timer-box-wrapper").classList.add("hidden"); 
    document.getElementById("gameplay-header-metrics").classList.remove("hidden"); 
    document.getElementById("selection-screen").classList.add("hidden");
    document.getElementById("gameplay-screen").classList.remove("hidden");
    
    const refreshBtnNode = document.getElementById("top-refresh-action-button");
    if (refreshBtnNode) refreshBtnNode.classList.add("hidden");

    document.getElementById("metric-game-id").innerText = String(currentGameId).padStart(4, '0');
    document.getElementById("metric-bet").innerText = stakeAmount;
    document.getElementById("metric-players").innerText = selectedCards.length;
    document.getElementById("metric-called").innerText = "0";
    
    let multiplier = stakeAmount === 20 ? 16 : 8;
    let totalDerash = selectedCards.length * multiplier;
    document.getElementById("metric-derash").innerText = totalDerash + " ብር"; 

    renderActivePlayerCards();
    calledNumbers = [];
    startCallingNumbersLoop();
}

function renderActivePlayerCards() {
    const container = document.getElementById("player-cards-list");
    container.innerHTML = "";
    if (selectedCards.length === 0) {
        container.innerHTML = `<div style="text-align:center;width:100%;color:#94a3b8;font-size:13px;padding:20px;">የተመረጠ ካርቴላ የለም (Spectator Mode)</div>`;
        return;
    }
    selectedCards.forEach(id => {
        const matrix = cardPool[id];
        const cardDiv = document.createElement("div");
        cardDiv.className = "mini-card";
        cardDiv.innerHTML = `<div class="card-title-header">ካርቴላ ${id}</div>`;
        const grid = document.createElement("div");
        grid.className = "grid-5x5";
        
        for(let r=0; r<5; r++) {
            for(let c=0; c<5; c++) {
                const cell = document.createElement("div");
                let v = matrix[r][c];
                if(v === "FREE") { cell.className = "cell-5x5 free-space marked"; cell.innerText = "FREE"; }
                else { cell.className = "cell-5x5"; cell.id = `cell-${id}-${v}`; cell.innerText = v; }
                grid.appendChild(cell);
            }
        }
        cardDiv.appendChild(grid);
        container.appendChild(cardDiv);
    });
}

