import { pieceIcons } from "../data/icons.js";
import { isKingInCheck } from "../board/check.js";
import { toSquareName } from "../board/helpers.js";

const columnLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const renderBoard = (state, handlers) => {
  const boardEl      = document.getElementById("board");
  const whiteInCheck = isKingInCheck(state.board, "white");
  const blackInCheck = isKingInCheck(state.board, "black");
  const isFlipped    = state.playerColor === "black";

  boardEl.innerHTML = "";

  for (let vRow = 0; vRow < 8; vRow++) {
    for (let vCol = 0; vCol < 8; vCol++) {
      const row = isFlipped ? 7 - vRow : vRow;
      const col = isFlipped ? 7 - vCol : vCol;
      const square = buildSquare(row, col, vRow, vCol, isFlipped, state, whiteInCheck, blackInCheck, handlers);
      boardEl.appendChild(square);
    }
  }
};

const buildSquare = (row, col, vRow, vCol, isFlipped, state, whiteInCheck, blackInCheck, handlers) => {
  const isLightSquare = (row + col) % 2 === 0;
  const piece         = state.board[row][col];
  const legalMove     = state.legalMovesForSelected.find(m => m.row === row && m.col === col);

  const squareEl = document.createElement("div");
  squareEl.className  = `square ${isLightSquare ? "light" : "dark"}`;
  squareEl.dataset.row = row;
  squareEl.dataset.col = col;
  squareEl.tabIndex   = 0;
  squareEl.setAttribute("role", "button");
  squareEl.setAttribute("aria-label", toSquareName(row, col));

  if (isPartOfLastMove(row, col, state.lastMove))       squareEl.classList.add("last-move");
  if (isSelectedSquare(row, col, state.selectedSquare)) squareEl.classList.add("selected");
  if (legalMove) squareEl.classList.add(legalMove.capture ? "capture" : "legal");

  if (piece?.type === "king") {
    if ((piece.color === "white" && whiteInCheck) || (piece.color === "black" && blackInCheck)) {
      squareEl.classList.add("check");
    }
  }

  if (vCol === 0) {
    const rankLabel = document.createElement("span");
    rankLabel.className   = "rank-label";
    rankLabel.textContent = isFlipped ? vRow + 1 : 8 - row;
    squareEl.appendChild(rankLabel);
  }

  if (vRow === 7) {
    const fileLabel = document.createElement("span");
    fileLabel.className   = "file-label";
    fileLabel.textContent = columnLetters[col];
    squareEl.appendChild(fileLabel);
  }

  squareEl.addEventListener("click", () => handlers.onSquareClick(row, col));
  squareEl.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlers.onSquareClick(row, col);
    }
  });

  squareEl.addEventListener("dragover", e => {
    const isLegalDrop = state.legalMovesForSelected.some(m => m.row === row && m.col === col);
    if (state.selectedSquare && isLegalDrop) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  });

  squareEl.addEventListener("drop", e => {
    e.preventDefault();
    const dragData = e.dataTransfer.getData("text/plain");
    const source   = dragData ? JSON.parse(dragData) : state.selectedSquare;
    if (source) handlers.onDrop(row, col, source.row, source.col);
  });

  if (piece) {
    squareEl.appendChild(buildPieceElement(piece, row, col, state, handlers));
  }

  return squareEl;
};

const buildPieceElement = (piece, row, col, state, handlers) => {
  const isBotTurn = state.gameMode === "bot" && state.currentTurn !== state.playerColor;
  const canPlayerMovePiece =
    piece.color === state.currentTurn &&
    !state.gameOver &&
    !state.botThinking &&
    !isBotTurn;

  const pieceEl = document.createElement("div");
  pieceEl.className  = `piece ${piece.color}`;
  pieceEl.draggable  = canPlayerMovePiece;
  pieceEl.setAttribute("aria-label", `${piece.color} ${piece.type}`);

  const img    = document.createElement("img");
  img.src      = pieceIcons[piece.color][piece.type];
  img.alt      = "";
  img.draggable = false;
  img.className = "piece-img";
  pieceEl.appendChild(img);

  pieceEl.addEventListener("dragstart", e => {
    if (!canPlayerMovePiece) { e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ row, col }));
    handlers.onDragStart(row, col);
  });

  pieceEl.addEventListener("dragend", () => handlers.onDragEnd());

  return pieceEl;
};

const isPartOfLastMove = (row, col, lastMove) =>
  lastMove &&
  ((lastMove.from.row === row && lastMove.from.col === col) ||
   (lastMove.to.row   === row && lastMove.to.col   === col));

const isSelectedSquare = (row, col, selectedSquare) =>
  selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
