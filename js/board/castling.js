import { isKingInCheck, isSquareUnderAttack } from "./check.js";
import { oppositeColor } from "./helpers.js";

export const canCastle = (board, color, side) => {
  const row = color === "white" ? 7 : 0;

  const king = board[row][4];
  if (!king || king.type !== "king" || king.color !== color || king.hasMoved) return false;
  if (isKingInCheck(board, color)) return false;

  const rookCol = side === "king" ? 7 : 0;
  const rook = board[row][rookCol];
  if (!rook || rook.type !== "rook" || rook.color !== color || rook.hasMoved) return false;

  const squaresBetweenKingAndRook = side === "king" ? [5, 6] : [1, 2, 3];
  const squaresKingPassesThrough  = side === "king" ? [5, 6] : [3, 2];

  if (squaresBetweenKingAndRook.some(col => board[row][col])) return false;

  return squaresKingPassesThrough.every(
    col => !isSquareUnderAttack(board, row, col, oppositeColor(color))
  );
};
