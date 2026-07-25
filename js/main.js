import {
  initializeApp,
  startNewGame,
  showSetupOverlay,
  closeSetupOverlay,
  selectMode,
  selectPlayerColor,
  resign,
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

// ── End screen ────────────────────────────────────────────

document.getElementById("playAgainBtn").addEventListener("click", startNewGame);
document
  .getElementById("newGameBtn")
  .addEventListener("click", showSetupOverlay);

document.getElementById("endScreen").addEventListener("click", (e) => {
  if (e.target === document.getElementById("endScreen")) {
    document.getElementById("endScreen").classList.add("hidden");
  }
});

// ── Boot ──────────────────────────────────────────────────

initializeApp();
