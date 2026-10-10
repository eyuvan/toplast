[10/9/2026 3:12 PM] €¥uvan_unique _boyz1: // 1. Socket.IO እና Telegram WebApp ግንኙነት
const socket = io();
const tg = window.Telegram?.WebApp;
let currentUserId = "guest_" + Math.floor(Math.random() * 10000);

if (tg) {
  tg.ready();
  tg.expand();
  if (tg.initDataUnsafe?.user) {
    currentUserId = String(tg.initDataUnsafe.user.id);
    const profElement = document.getElementById('prof-id');
    if (profElement) {
      profElement.innerText = @${tg.initDataUnsafe.user.username || currentUserId};
    }
  }
}

// Global Variables
let selectedCartelas = [];
let generatedCardsData = {};

// 2. 1 - 600 Cartela Grid ማመንጨት
const cartelaContainer = document.getElementById('cartela-container');
if (cartelaContainer) {
  for (let i = 1; i <= 600; i++) {
    const btn = document.createElement('button');
    btn.className = 'cartela-btn';
    btn.innerText = i;
    btn.onclick = () => toggleCartela(i, btn);
    cartelaContainer.appendChild(btn);
  }
}

// ካርቴላዎችን መምረጥ (እስከ 3 ድረስ)
function toggleCartela(id, btn) {
  if (selectedCartelas.includes(id)) {
    selectedCartelas = selectedCartelas.filter(item => item !== id);
    btn.classList.remove('selected');
    delete generatedCardsData[id];
  } else {
    if (selectedCartelas.length >= 3) {
      alert("ከ 3 ካርቴላ በላይ መምረጥ አይቻልም!");
      return;
    }
    selectedCartelas.push(id);
    btn.classList.add('selected');
    generatedCardsData[id] = generateMatrix();
  }
  
  const countBadge = document.getElementById('selected-count');
  if (countBadge) countBadge.innerText = selectedCartelas.length;
  renderLobbyCards();
}

// 5x5 Bingo Matrix ማመንጨት (B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75)
function generateMatrix() {
  const getCol = (min, max) => {
    let s = new Set();
    while (s.size < 5) s.add(Math.floor(Math.random() * (max - min + 1)) + min);
    return Array.from(s);
  };
  return {
    B: getCol(1, 15),
    I: getCol(16, 30),
    N: getCol(31, 45),
    G: getCol(46, 60),
    O: getCol(61, 75)
  };
}

// በ Lobby ውስጥ የተመረጡትን ካርቴላዎች ማሳየት
function renderLobbyCards() {
  const container = document.getElementById('active-cards-container');
  if (!container) return;
  container.innerHTML = '';
  selectedCartelas.forEach(id => {
    container.innerHTML += buildCardHTML(id, generatedCardsData[id]);
  });
}

function buildCardHTML(id, matrix) {
  let html = <div class="bingo-card-wrapper"><div class="cartela-header">ካርቴላ #${id}</div><div class="cartela-5x5">;
  const cols = ['B', 'I', 'N', 'G', 'O'];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) {
        html += <div class="cell free">FREE</div>;
      } else {
        const val = matrix[cols[c]][r];
        html += <div class="cell" id="card-${id}-${val}">${val}</div>;
      }
    }
  }
  html += </div></div>;
  return html;
}

// 3. 1 - 75 Master Board ማዘጋጀት
function initMasterBoard() {
  const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
  for (let k in ranges) {
    const col = document.getElementById(col-${k});
    if (col) {
      for (let n = ranges[k][0]; n <= ranges[k][1]; n++) {
        const p = document.createElement('div');
        p.className = 'num-pill';
        p.id = pill-${n};
        p.innerText = n;
        col.appendChild(p);
      }
    }
  }
}
initMasterBoard();

// 4. MULTIPLAYER SOCKET EVENTS (ከሰርቨር ጋር ማመሳሰል)
socket.emit("join_game", { user_id: currentUserId });

// ጨዋታው ሲጀመር ወቅታዊ ሁኔታን ማመሳሰል
socket.on("sync_state", (state) => {
  document.getElementById('countdown').innerText = state.countdown;
  document.getElementById('current-game-id').innerText = #${String(state.game_id).padStart(4, '0')};
  updateWalletUI(state.wallets);

  if (state.phase === "playing") {
    switchToGameView();
    if (state.called) {
      state.called.forEach(num => markNumberEverywhere(num));
    }
  }
});

// የ 49 ሰከንድ ቆጣሪ (ከማዕከላዊ ሰርቨር የሚመጣ)
socket.on("timer_update", (data) => {
  document.getElementById('countdown').innerText = data.countdown;
  document.getElementById('current-game-id').innerText = #${String(data.game_id).padStart(4, '0')};
});
[10/9/2026 3:12 PM] €¥uvan_unique _boyz1: // ጨዋታው ሲጀመር ወደ Gameplay ስክሪን መቀየር
socket.on("game_started", (data) => {
  socket.emit("register_cartelas", { user_id: currentUserId, cards: generatedCardsData });
  switchToGameView();
});

// ቁጥሮች ጥሪ (በየ 3 ሰከንዱ)
socket.on("number_called", (data) => {
  document.getElementById('current-call').innerText = data.full;
  markNumberEverywhere(data.number);
});

// ቁጥሩን በካርቴላዎች እና በ Master Board ላይ Highlight ማድረግ
function markNumberEverywhere(num) {
  const pill = document.getElementById(pill-${num});
  if (pill) pill.classList.add('called');

  selectedCartelas.forEach(id => {
    const cell = document.getElementById(card-${id}-${num});
    if (cell) cell.classList.add('marked');
  });
}

function switchToGameView() {
  document.getElementById('lobby-view').classList.remove('active');
  document.getElementById('game-view').classList.add('active');

  const inGame = document.getElementById('in-game-cards');
  if (inGame) {
    inGame.innerHTML = '';
    selectedCartelas.forEach(id => {
      inGame.innerHTML += buildCardHTML(id, generatedCardsData[id]);
    });
  }
}

// ጨዋታው ሲጠናቀቅ (Winner Announcement)
socket.on("game_over", (data) => {
  alert(data.message);
  setTimeout(() => {
    document.getElementById('game-view').classList.remove('active');
    document.getElementById('lobby-view').classList.add('active');

    // መረጃዎችን ማጽዳት (Reset for next round)
    selectedCartelas = [];
    generatedCardsData = {};
    document.querySelectorAll('.cartela-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('selected-count').innerText = "0";
    document.getElementById('active-cards-container').innerHTML = '';
    document.querySelectorAll('.num-pill').forEach(p => p.classList.remove('called'));
    document.getElementById('current-call').innerText = "--";
  }, 4000);
});

// 5. ዋሌት ማደሻ (Telebirr Approve ሲደረግ በቅጽበት ይቀበላል)
socket.on(wallet_update_${currentUserId}, (w) => {
  updateWalletUI(w);
  alert("የዋሌት ሂሳብዎ ተሞልቷል!");
});

function updateWalletUI(w) {
  if (!w) return;
  document.getElementById('top-main-wallet').innerText = Number(w.main).toFixed(2);
  document.getElementById('top-play-wallet').innerText = Number(w.play).toFixed(2);
  document.getElementById('wallet-main').innerText = ${Number(w.main).toFixed(2)} ETB;
  document.getElementById('wallet-play').innerText = ${Number(w.play).toFixed(2)} ETB;
  
  const profMain = document.getElementById('prof-main');
  const profPlay = document.getElementById('prof-play');
  if (profMain) profMain.innerText = ${Number(w.main).toFixed(2)} ETB;
  if (profPlay) profPlay.innerText = ${Number(w.play).toFixed(2)} ETB;
}

// 6. Navigation Tabs መቀያየሪያ
function switchTab(viewId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');
  if (btn) btn.classList.add('active');
}