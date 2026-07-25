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

  whiteCard.querySelector(".player-sub").textContent = botColor === "white" ? "Bot" : "Player 1";
  document.getElementById("blackSub").textContent    = botColor === "black" ? "Bot" : "Player 2";

  whiteCard.classList.toggle("active",   state.currentTurn === "white" && !state.gameOver);
  blackCard.classList.toggle("active",   state.currentTurn === "black" && !state.gameOver);
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
  const whiteCapturedEl = document.getElementById("whiteCaptured");
  const blackCapturedEl = document.getElementById("blackCaptured");
  const whiteScoreEl    = document.getElementById("whiteScore");
  const blackScoreEl    = document.getElementById("blackScore");

  whiteCapturedEl.innerHTML = buildCapturedHtml(state.capturedPieces.black, "black");
  blackCapturedEl.innerHTML = buildCapturedHtml(state.capturedPieces.white, "white");

  whiteScoreEl.textContent = `${sumPoints(state.capturedPieces.black)} pts`;
  blackScoreEl.textContent = `${sumPoints(state.capturedPieces.white)} pts`;
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

  moveHistoryEl.innerHTML = state.moveHistory
    .map((moveText, index) => `
      <div class="history-item">
        <span class="history-number">${String(index + 1).padStart(2, "0")}</span>
        <span>${moveText}</span>
      </div>
    `)
    .join("");

  moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
};

const updateActionButtons = (state) => {
  const canResign = !state.gameOver && !state.overlayVisible && state.moveHistory.length > 0;
  const resignBtn = document.getElementById("resignBtn");
  resignBtn.disabled = !canResign;
};
