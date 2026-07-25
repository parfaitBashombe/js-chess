import { isInsideBoard, oppositeColor, findKing } from "./helpers.js";

export const isKingInCheck = (board, color) => {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return true;
  return isSquareUnderAttack(board, kingPosition.row, kingPosition.col, oppositeColor(color));
};

export const isSquareUnderAttack = (board, row, col, byColor) => {
  return (
    isPawnAttackingSquare(board, row, col, byColor) ||
    isKnightAttackingSquare(board, row, col, byColor) ||
    isKingAttackingSquare(board, row, col, byColor) ||
    isRookOrQueenAttackingSquare(board, row, col, byColor) ||
    isBishopOrQueenAttackingSquare(board, row, col, byColor)
  );
};

const isPawnAttackingSquare = (board, row, col, byColor) => {
  const pawnRow = row - (byColor === "white" ? -1 : 1);

  for (const colOffset of [-1, 1]) {
    const pawnCol = col + colOffset;
    if (isInsideBoard(pawnRow, pawnCol)) {
      const piece = board[pawnRow][pawnCol];
      if (piece && piece.color === byColor && piece.type === "pawn") return true;
    }
  }
  return false;
};

const isKnightAttackingSquare = (board, row, col, byColor) => {
  const knightJumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightJumps) {
    const r = row + dr, c = col + dc;
    if (isInsideBoard(r, c)) {
      const piece = board[r][c];
      if (piece && piece.color === byColor && piece.type === "knight") return true;
    }
  }
  return false;
};

const isKingAttackingSquare = (board, row, col, byColor) => {
  const adjacentSquares = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of adjacentSquares) {
    const r = row + dr, c = col + dc;
    if (isInsideBoard(r, c)) {
      const piece = board[r][c];
      if (piece && piece.color === byColor && piece.type === "king") return true;
    }
  }
  return false;
};

const isSliderAttackingSquare = (board, row, col, byColor, directions, attackerTypes) => {
  for (const [dr, dc] of directions) {
    let r = row + dr, c = col + dc;
    while (isInsideBoard(r, c)) {
      const piece = board[r][c];
      if (piece) {
        if (piece.color === byColor && attackerTypes.includes(piece.type)) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return false;
};

const isRookOrQueenAttackingSquare = (board, row, col, byColor) =>
  isSliderAttackingSquare(board, row, col, byColor,
    [[-1,0],[1,0],[0,-1],[0,1]], ["rook","queen"]);

const isBishopOrQueenAttackingSquare = (board, row, col, byColor) =>
  isSliderAttackingSquare(board, row, col, byColor,
    [[-1,-1],[-1,1],[1,-1],[1,1]], ["bishop","queen"]);
