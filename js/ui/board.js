import { pieceIcons } from "../data/icons.js";
import { isKingInCheck } from "../board/check.js";
import { toSquareName } from "../board/helpers.js";

const columnLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const renderBoard = (state, handlers) => {
  const reviewing      = state.reviewIndex !== null;
  const snap           = reviewing ? state.positionHistory[state.reviewIndex] : null;
  const displayBoard   = snap ? snap.board    : state.board;
  const displayLastMove = snap ? snap.lastMove : state.lastMove;

  const boardEl      = document.getElementById("board");
  const whiteInCheck = isKingInCheck(displayBoard, "white");
  const blackInCheck = isKingInCheck(displayBoard, "black");
  const isFlipped    = state.playerColor === "black";

  boardEl.innerHTML = "";

  for (let vRow = 0; vRow < 8; vRow++) {
    for (let vCol = 0; vCol < 8; vCol++) {
      const row = isFlipped ? 7 - vRow : vRow;
      const col = isFlipped ? 7 - vCol : vCol;
      const square = buildSquare(
        row, col, vRow, vCol, isFlipped,
        state, displayBoard, displayLastMove,
        whiteInCheck, blackInCheck, handlers, reviewing
      );
      boardEl.appendChild(square);
    }
  }

  if (state.animateMove && !reviewing) {
    state.animateMove = false;
    animateLastMove(displayLastMove, isFlipped, boardEl);
  }
};

// FLIP technique: the piece is already at its destination after the re-render.
// Offset it back to the source square (no transition), then release (with transition)
// so CSS slides it smoothly into its natural position.
const animatePiece = (boardEl, from, to, squareSize, isFlipped) => {
  const toSquare = boardEl.querySelector(`[data-row="${to.row}"][data-col="${to.col}"]`);
  if (!toSquare) return;
  const pieceEl = toSquare.querySelector(".piece");
  if (!pieceEl) return;

  const deltaRow = from.row - to.row;
  const deltaCol = from.col - to.col;
  const dx = (isFlipped ? -deltaCol : deltaCol) * squareSize;
  const dy = (isFlipped ? -deltaRow : deltaRow) * squareSize;

  pieceEl.style.transition = "none";
  pieceEl.style.transform  = `translate(${dx}px, ${dy}px)`;
  pieceEl.offsetHeight; // force reflow so the browser registers the start position
  pieceEl.style.transition = "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)";
  pieceEl.style.transform  = "";
};

const animateLastMove = (lastMove, isFlipped, boardEl) => {
  if (!lastMove) return;
  const squareSize = boardEl.clientWidth / 8;
  if (!squareSize) return;

  animatePiece(boardEl, lastMove.from, lastMove.to, squareSize, isFlipped);

  // Castling: king moved 2 squares — also slide the rook from its corner
  if (Math.abs(lastMove.from.col - lastMove.to.col) === 2) {
    const row        = lastMove.to.row;
    const isKingside = lastMove.to.col === 6;
    animatePiece(
      boardEl,
      { row, col: isKingside ? 7 : 0 },
      { row, col: isKingside ? 5 : 3 },
      squareSize,
      isFlipped
    );
  }
};

const buildSquare = (row, col, vRow, vCol, isFlipped, state, displayBoard, displayLastMove, whiteInCheck, blackInCheck, handlers, reviewing) => {
  const isLightSquare = (row + col) % 2 === 0;
  const piece         = displayBoard[row][col];
  const legalMove     = reviewing ? null : state.legalMovesForSelected.find(m => m.row === row && m.col === col);

  const squareEl = document.createElement("div");
  squareEl.className  = `square ${isLightSquare ? "light" : "dark"}`;
  squareEl.dataset.row = row;
  squareEl.dataset.col = col;
  squareEl.tabIndex   = 0;
  squareEl.setAttribute("role", "button");
  squareEl.setAttribute("aria-label", toSquareName(row, col));

  if (isPartOfLastMove(row, col, displayLastMove))            squareEl.classList.add("last-move");
  if (!reviewing && isSelectedSquare(row, col, state.selectedSquare)) squareEl.classList.add("selected");
  if (legalMove) squareEl.classList.add(legalMove.capture ? "capture" : "legal");

  if (piece?.type === "king" && !state.gameOver) {
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
    squareEl.appendChild(buildPieceElement(piece, row, col, state, handlers, reviewing));
  }

  return squareEl;
};

const buildPieceElement = (piece, row, col, state, handlers, reviewing) => {
  const isBotTurn = state.gameMode === "bot" && state.currentTurn !== state.playerColor;
  const canPlayerMovePiece =
    !reviewing &&
    piece.color === state.currentTurn &&
    !state.gameOver &&
    !state.botThinking &&
    !isBotTurn;

  const isLoserKing = state.winner && piece.type === "king" && piece.color !== state.winner;

  const pieceEl = document.createElement("div");
  pieceEl.className  = `piece ${piece.color}${isLoserKing ? " loser-king" : ""}`;
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

