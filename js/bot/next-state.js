import { cloneBoard } from "../board/setup.js";
import { applyMoveToBoard } from "../board/apply-move.js";

export const getNextBoardState = (board, move, enPassantTarget) => {
  const nextBoard   = cloneBoard(board);
  const movingPiece = nextBoard[move.from.row][move.from.col];
  const originalType = movingPiece.type;

  applyMoveToBoard(nextBoard, move.from.row, move.from.col, move.to);

  const landedPiece = nextBoard[move.to.row][move.to.col];
  if (landedPiece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
    landedPiece.type = "queen";
  }

  let nextEnPassantTarget = null;
  if (originalType === "pawn" && Math.abs(move.to.row - move.from.row) === 2) {
    nextEnPassantTarget = {
      row: (move.from.row + move.to.row) / 2,
      col: move.from.col,
      capturedRow: move.to.row,
      capturedCol: move.from.col,
    };
  }

  return { board: nextBoard, enPassantTarget: nextEnPassantTarget };
};
