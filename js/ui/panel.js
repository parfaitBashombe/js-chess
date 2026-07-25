import { pieceIcons } from "../data/icons.js";
import { piecePoints } from "../data/points.js";
import { capitalize } from "../board/helpers.js";

export const renderPanel = (state) => {
  renderStatusCard(state);
  renderPlayerCards(state);
  renderCapturedPieces(state);
  renderMoveHistory(state);
  renderModeButtons(state);
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
  const blackSub  = document.getElementById("blackSub");

  blackSub.textContent = state.gameMode === "bot" ? "Bot" : "Player 2";

  whiteCard.classList.toggle("active", state.currentTurn === "white" && !state.gameOver);
  blackCard.classList.toggle("active", state.currentTurn === "black" && !state.gameOver);

  whiteCard.querySelector(".player-status").textContent =
    state.currentTurn === "white" && !state.gameOver ? "Thinking" : "Waiting";

  blackCard.querySelector(".player-status").textContent =
    state.currentTurn === "black" && !state.gameOver
      ? (state.gameMode === "bot" ? "Calculating" : "Thinking")
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

const renderModeButtons = (state) => {
  document.getElementById("humanModeBtn").classList.toggle("active", state.gameMode === "human");
  document.getElementById("botModeBtn").classList.toggle("active",   state.gameMode === "bot");
};
