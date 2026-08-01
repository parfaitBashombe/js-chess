import { pieceIcons } from "../data/icons.js";
import { piecePoints } from "../data/points.js";
import { oppositeColor, capitalize } from "../board/helpers.js";

export const renderPanel = (state) => {
  renderStatusCard(state);
  renderPlayerCards(state);
  renderCapturedPieces(state);
  renderMoveHistory(state);
  updateActionButtons(state);
};

const renderStatusCard = (state) => {
  const statusText = document.getElementById("statusText");
  const turnBadge  = document.getElementById("turnBadge");
  const botLoader  = document.getElementById("botLoader");

  if (state.reviewIndex !== null) {
    const total = state.positionHistory.length;
    statusText.textContent = `Reviewing move ${state.reviewIndex + 1} of ${total}`;
    turnBadge.textContent  = "Review";
    botLoader.classList.add("hidden");
    return;
  }

  statusText.textContent = state.statusMessage;

  if (state.gameOver)       turnBadge.textContent = "Game over";
  else if (state.botThinking) turnBadge.textContent = "Bot thinking";
  else                      turnBadge.textContent = `${capitalize(state.currentTurn)} to move`;

  botLoader.classList.toggle("hidden", !state.botThinking);
};

const renderPlayerCards = (state) => {
  const whiteCard = document.getElementById("whitePlayer");
  const blackCard = document.getElementById("blackPlayer");

  const botColor = state.gameMode === "bot" ? oppositeColor(state.playerColor) : null;

  const botLabel = `Bot · ${capitalize(state.botDifficulty)}`;
  whiteCard.querySelector(".player-sub").textContent = botColor === "white" ? botLabel : "Player 1";
  document.getElementById("blackSub").textContent    = botColor === "black" ? botLabel : "Player 2";

  whiteCard.classList.toggle("active",   state.currentTurn === "white" && !state.gameOver && state.reviewIndex === null);
  blackCard.classList.toggle("active",   state.currentTurn === "black" && !state.gameOver && state.reviewIndex === null);
  whiteCard.classList.toggle("thinking", state.botThinking && botColor === "white");
  blackCard.classList.toggle("thinking", state.botThinking && botColor === "black");
  whiteCard.classList.toggle("loser",    state.gameOver && state.winner === "black");
  blackCard.classList.toggle("loser",    state.gameOver && state.winner === "white");

  whiteCard.querySelector(".player-status").textContent =
    state.currentTurn === "white" && !state.gameOver
      ? (botColor === "white" ? "Calculating" : "Thinking")
      : "Waiting";

  blackCard.querySelector(".player-status").textContent =
    state.currentTurn === "black" && !state.gameOver
      ? (botColor === "black" ? "Calculating" : "Thinking")
      : "Waiting";
};

const renderCapturedPieces = (state) => {
  const snap = state.reviewIndex !== null ? state.positionHistory[state.reviewIndex] : null;
  const cp   = snap ? snap.capturedPieces : state.capturedPieces;

  const whiteCapturedEl = document.getElementById("whiteCaptured");
  const blackCapturedEl = document.getElementById("blackCaptured");
  const whiteScoreEl    = document.getElementById("whiteScore");
  const blackScoreEl    = document.getElementById("blackScore");

  whiteCapturedEl.innerHTML = buildCapturedHtml(cp.black, "black");
  blackCapturedEl.innerHTML = buildCapturedHtml(cp.white, "white");

  whiteScoreEl.textContent = `${sumPoints(cp.black)} pts`;
  blackScoreEl.textContent = `${sumPoints(cp.white)} pts`;
};

const buildCapturedHtml = (capturedTypes, color) => {
  if (!capturedTypes.length) return `<span class="empty-text">None</span>`;

  return capturedTypes
    .map(type => `<img class="captured-piece" src="${pieceIcons[color][type]}" alt="${color} ${type}" draggable="false"/>`)
    .join("");
};

const sumPoints = (capturedTypes) =>
  capturedTypes.reduce((total, type) => total + piecePoints[type], 0);

const renderMoveHistory = (state) => {
  const moveHistoryEl = document.getElementById("moveHistory");

  if (!state.moveHistory.length) {
    moveHistoryEl.innerHTML = `<p class="empty-text">No moves yet.</p>`;
    return;
  }

  const pairs = [];
  for (let i = 0; i < state.moveHistory.length; i += 2) {
    pairs.push([i, i + 1]);
  }

  moveHistoryEl.innerHTML = pairs
    .map(([wi, bi], pairIndex) => {
      const whiteMove = state.moveHistory[wi];
      const blackMove = state.moveHistory[bi];
      const whiteActive = state.reviewIndex === wi;
      const blackActive = state.reviewIndex === bi;

      const blackCell = blackMove !== undefined
        ? `<span class="history-move${blackActive ? " history-move--active" : ""}" data-move-index="${bi}">${blackMove}</span>`
        : `<span></span>`;

      return `<div class="history-pair">
        <span class="history-number">${pairIndex + 1}.</span>
        <span class="history-move${whiteActive ? " history-move--active" : ""}" data-move-index="${wi}">${whiteMove}</span>
        ${blackCell}
      </div>`;
    })
    .join("");

  if (state.reviewIndex !== null) {
    const activeEl = moveHistoryEl.querySelector(".history-move--active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  } else {
    moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
  }
};

const updateActionButtons = (state) => {
  const canResign = !state.gameOver && !state.overlayVisible && state.moveHistory.length > 0;
  document.getElementById("resignBtn").disabled = !canResign;

  const hasMoves = state.positionHistory.length > 0;
  const atStart  = state.reviewIndex === 0;
  const atEnd    = state.reviewIndex !== null && state.reviewIndex >= state.positionHistory.length - 1;
  const isLive   = state.reviewIndex === null;

  document.getElementById("prevMoveBtn").disabled = !hasMoves || atStart;
  document.getElementById("nextMoveBtn").disabled = isLive || atEnd;
  document.getElementById("liveMoveBtn").disabled = isLive;
};
