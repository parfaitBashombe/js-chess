import { pieceIcons } from "../data/icons.js";
import { oppositeColor } from "../board/helpers.js";

export const showEndScreen = (winner, title, description) => {
  const endScreen   = document.getElementById("endScreen");
  const winnerIcon  = document.getElementById("winnerIcon");
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerText  = document.getElementById("winnerText");

  winnerTitle.textContent = title;
  winnerText.textContent  = description;

  if (!winner) {
    winnerIcon.innerHTML = `<span class="draw-symbol">½</span>`;
  } else {
    const loser = oppositeColor(winner);
    winnerIcon.innerHTML = `
      <img class="loser-king" src="${pieceIcons[loser].king}" alt="${loser} king" draggable="false"/>
    `;
  }

  endScreen.classList.remove("hidden");
};
