import { cloneBoard } from "./setup.js";
import { isKingInCheck } from "./check.js";
import { applyMoveToBoard } from "./apply-move.js";
import { generateMovesForPiece } from "./move-generate.js";

// Like getAllLegalMovesForColor but only generates and legality-checks
// capture moves — used by quiescence search to avoid checking quiet moves.
export const getLegalCapturesForColor = (board, color, enPassantTarget) => {
  const captures = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      for (const move of generateMovesForPiece(board, row, col, enPassantTarget)) {
        if (!move.capture && move.special !== "enPassant") continue;
        const boardCopy = cloneBoard(board);
        applyMoveToBoard(boardCopy, row, col, move);
        if (!isKingInCheck(boardCopy, color)) {
          captures.push({ from: { row, col }, to: move });
        }
      }
    }
  }
  return captures;
};

export const getLegalMovesForPiece = (board, row, col, currentTurn, enPassantTarget) => {
  const piece = board[row][col];
  if (!piece || piece.color !== currentTurn) return [];

  return generateMovesForPiece(board, row, col, enPassantTarget).filter(move => {
    const boardCopy = cloneBoard(board);
    applyMoveToBoard(boardCopy, row, col, move);
    return !isKingInCheck(boardCopy, piece.color);
  });
};

export const getAllLegalMovesForColor = (board, color, enPassantTarget) => {
  const allMoves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const pieceMoves = getLegalMovesForPiece(board, row, col, color, enPassantTarget);
        pieceMoves.forEach(move => allMoves.push({ from: { row, col }, to: move }));
      }
    }
  }

  return allMoves;
};
