import { startNewGame, setGameMode } from "./game.js";

document.getElementById("humanModeBtn").addEventListener("click", () => setGameMode("human"));
document.getElementById("botModeBtn").addEventListener("click",   () => setGameMode("bot"));
document.getElementById("resetBtn").addEventListener("click",     startNewGame);
document.getElementById("playAgainBtn").addEventListener("click", startNewGame);

document.getElementById("endScreen").addEventListener("click", (e) => {
  if (e.target === document.getElementById("endScreen")) {
    document.getElementById("endScreen").classList.add("hidden");
  }
});

startNewGame();
