import {
  initializeApp,
  startNewGame,
  showSetupOverlay,
  closeSetupOverlay,
  selectMode,
  selectPlayerColor,
  resign,
  goToPreviousMove,
  goToNextMove,
  goToLivePosition,
  goToMove,
} from "./game.js";

// ── Board overlay ─────────────────────────────────────────

document
  .getElementById("overlayHumanBtn")
  .addEventListener("click", () => selectMode("human"));
document
  .getElementById("overlayBotBtn")
  .addEventListener("click", () => selectMode("bot"));
document
  .getElementById("overlayStartBtn")
  .addEventListener("click", startNewGame);
document
  .getElementById("overlayCloseBtn")
  .addEventListener("click", closeSetupOverlay);

document.getElementById("playAsWhiteBtn").addEventListener("click",  () => selectPlayerColor("white"));
document.getElementById("playAsRandomBtn").addEventListener("click", () => selectPlayerColor("random"));
document.getElementById("playAsBlackBtn").addEventListener("click",  () => selectPlayerColor("black"));

// ── Side panel ────────────────────────────────────────────

document.getElementById("resignBtn").addEventListener("click", resign);
document.getElementById("resetBtn").addEventListener("click", showSetupOverlay);

// ── Move history navigation ───────────────────────────────

document.getElementById("prevMoveBtn").addEventListener("click", goToPreviousMove);
document.getElementById("nextMoveBtn").addEventListener("click", goToNextMove);
document.getElementById("liveMoveBtn").addEventListener("click", goToLivePosition);

document.getElementById("moveHistory").addEventListener("click", (e) => {
  const item = e.target.closest("[data-move-index]");
  if (item) goToMove(Number(item.dataset.moveIndex));
});

// ── End screen ────────────────────────────────────────────

document.getElementById("playAgainBtn").addEventListener("click", startNewGame);
document.getElementById("newGameBtn").addEventListener("click", showSetupOverlay);
document.getElementById("viewBoardBtn").addEventListener("click", () => {
  document.getElementById("endScreen").classList.add("hidden");
});

// ── Boot ──────────────────────────────────────────────────

initializeApp();
