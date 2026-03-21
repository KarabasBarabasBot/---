// ── GAME STATE ──────────────────────────────────────────────
let board = Array(9).fill(null);
let playerMark = null;
let aiMark = null;
let gameActive = false;
let scores = { player: 0, ai: 0, draws: 0 };
let gameCount = 0;       // сколько партий сыграно
let botShouldLose = false; // каждая вторая партия — бот проигрывает

const statusEl      = document.getElementById('status');
const cells         = document.querySelectorAll('.cell');
const chooseScreen  = document.getElementById('choose-screen');
const gameScreen    = document.getElementById('game-screen');
const btnRestart    = document.getElementById('btn-restart');
const loseOverlay   = document.getElementById('lose-overlay');
const winOverlay    = document.getElementById('win-overlay');
const drawOverlay   = document.getElementById('draw-overlay');
const loseImg       = document.getElementById('lose-img');
const scorePlayerEl = document.getElementById('score-player');
const scoreAiEl     = document.getElementById('score-ai');
const scoreDrawEl   = document.getElementById('score-draw');

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ── CHOOSE SIDE ──────────────────────────────────────────────
document.querySelectorAll('.btn-choose').forEach(btn => {
  btn.addEventListener('click', () => {
    playerMark = btn.dataset.mark;
    aiMark = playerMark === 'X' ? 'O' : 'X';
    if (typeof startMusic === 'function') startMusic();
    startGame();
  });
});

function startGame() {
  gameCount++;
  botShouldLose = (gameCount % 2 === 0); // чётные партии — бот сдаётся

  board = Array(9).fill(null);
  gameActive = true;
  chooseScreen.style.display = 'none';
  gameScreen.style.display = 'flex';
  btnRestart.style.display = 'inline-block';
  loseOverlay.classList.remove('show');
  winOverlay.classList.remove('show');
  drawOverlay.classList.remove('show');

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });

  setStatus('СИСТЕМА ОНЛАЙН. ВАШ ХОД.');

  if (playerMark === 'O') {
    setStatus('ИНИЦИИРУЮ ВЗЛОМ...', true);
    setTimeout(aiMove, 600);
  }
}

// ── CELL CLICK ───────────────────────────────────────────────
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    if (!gameActive) return;
    const idx = parseInt(cell.dataset.index);
    if (board[idx]) return;

    placeMove(idx, playerMark);
    const result = checkResult();
    if (result) { handleResult(result); return; }

    gameActive = false;
    setStatus('ОБРАБОТКА...', true);
    setTimeout(() => {
      gameActive = true;
      aiMove();
    }, 400 + Math.random() * 400);
  });
});

// ── AI MOVE ──────────────────────────────────────────────────
function aiMove() {
  setStatus('ВЗЛАМЫВАЮ ВАШУ ЗАЩИТУ...', true);
  const idx = botShouldLose ? getWorstMove() : getBestMove();
  placeMove(idx, aiMark);
  const result = checkResult();
  if (result) { handleResult(result); return; }
  setStatus('СИСТЕМА ОНЛАЙН. ВАШ ХОД.');
}

// Лучший ход (непобедимый минимакс)
function getBestMove() {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = aiMark;
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = null;
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}

// Худший ход (бот специально проигрывает)
function getWorstMove() {
  let worst = Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = aiMark;
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = null;
      if (score < worst) { worst = score; move = i; }
    }
  }
  return move;
}

function minimax(b, depth, isMax, alpha, beta) {
  const winner = getWinner(b);
  if (winner === aiMark)     return 10 - depth;
  if (winner === playerMark) return depth - 10;
  if (b.every(c => c))       return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = aiMark;
        best = Math.max(best, minimax(b, depth + 1, false, alpha, beta));
        b[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = playerMark;
        best = Math.min(best, minimax(b, depth + 1, true, alpha, beta));
        b[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

// ── HELPERS ──────────────────────────────────────────────────
function placeMove(idx, mark) {
  board[idx] = mark;
  const cell = cells[idx];
  cell.textContent = mark;
  cell.classList.add('taken', mark === 'X' ? 'x-cell' : 'o-cell');
}

function getWinner(b) {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function checkResult() {
  const winner = getWinner(board);
  if (winner) return { type: 'win', mark: winner };
  if (board.every(c => c)) return { type: 'draw' };
  return null;
}

function handleResult(result) {
  gameActive = false;
  if (result.type === 'draw') {
    scores.draws++;
    updateScoreboard();
    setStatus('НИЧЬЯ. ПОЧТИ ПОЛУЧИЛОСЬ.');
    setTimeout(() => drawOverlay.classList.add('show'), 500);
  } else if (result.mark === playerMark) {
    scores.player++;
    updateScoreboard();
    highlightWin(result.mark);
    setStatus('ИГРОК ПОБЕДИЛ! НЕВЕРОЯТНО.');
    setTimeout(() => showWinScreen(), 700);
  } else {
    scores.ai++;
    updateScoreboard();
    highlightWin(result.mark);
    setStatus('ДОСТУП ПОЛУЧЕН. ВЫ ПРОИГРАЛИ.');
    setTimeout(() => showLoseScreen(), 700);
  }
}

function highlightWin(mark) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] === mark && board[b] === mark && board[c] === mark) {
      [a, b, c].forEach(i => cells[i].classList.add('win-cell'));
      break;
    }
  }
}

function setStatus(text, blinking = false) {
  statusEl.textContent = '> ' + text;
  statusEl.classList.toggle('blink', blinking);
}

function updateScoreboard() {
  scorePlayerEl.textContent = scores.player;
  scoreAiEl.textContent = scores.ai;
  scoreDrawEl.textContent = scores.draws;
}

// ── LOSE SCREEN ───────────────────────────────────────────────
function showLoseScreen() {
  loseOverlay.classList.add('show');
  loseImg.onerror = () => loseOverlay.classList.add('no-image');
  loseImg.src = loseImg.src;
  playLoseSound();
}

// ── WIN SCREEN ────────────────────────────────────────────────
function showWinScreen() {
  winOverlay.classList.add('show');
  if (typeof playWinSound === 'function') playWinSound();
}

// ── WEB AUDIO "ВА-ВА-ВА" (проигрыш) ─────────────────────────
function playLoseSound() {
  try {
    const ctx = window.sharedAudioCtx ||
      new (window.AudioContext || window.webkitAudioContext)();
    window.sharedAudioCtx = ctx;

    const play = () => {
      const notes = [470, 394, 330];
      let time = ctx.currentTime + 0.05;
      notes.forEach((freq) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const dist = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let j = 0; j < 256; j++) {
          const x = (j * 2) / 256 - 1;
          curve[j] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x));
        }
        dist.curve = curve;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, time + 0.35);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35, time + 0.05);
        gain.gain.linearRampToValueAtTime(0.28, time + 0.3);
        gain.gain.linearRampToValueAtTime(0, time + 0.45);
        osc.connect(dist); dist.connect(gain); gain.connect(ctx.destination);
        osc.start(time); osc.stop(time + 0.45);
        time += 0.42;
      });
    };
    ctx.state === 'suspended' ? ctx.resume().then(play) : play();
  } catch (e) {}
}

// ── RESTART BUTTONS ───────────────────────────────────────────
btnRestart.addEventListener('click', () => {
  loseOverlay.classList.remove('show');
  winOverlay.classList.remove('show');
  drawOverlay.classList.remove('show');
  startGame();
});

document.getElementById('btn-try-again').addEventListener('click', () => {
  loseOverlay.classList.remove('show');
  startGame();
});

document.getElementById('btn-win-again').addEventListener('click', () => {
  winOverlay.classList.remove('show');
  startGame();
});

document.getElementById('btn-draw-again').addEventListener('click', () => {
  drawOverlay.classList.remove('show');
  startGame();
});
