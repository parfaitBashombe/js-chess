import { pieceIcons } from "../data/icons.js";

const PIECES = ["queen", "rook", "bishop", "knight"];

export const showPromotionPicker = (color) => {
  const overlay = document.getElementById("promotionOverlay");
  const options = document.getElementById("promotionOptions");

  options.innerHTML = PIECES.map(type => `
    <button class="promotion-btn" data-piece="${type}" type="button" aria-label="Promote to ${type}">
      <img src="${pieceIcons[color][type]}" alt="${type}" draggable="false" />
    </button>
  `).join("");

  overlay.classList.remove("hidden");
};

export const hidePromotionPicker = () => {
  document.getElementById("promotionOverlay")?.classList.add("hidden");
};
