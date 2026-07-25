import { piecePoints } from "../data/points.js";
import { isKingInCheck } from "../board/check.js";
import { oppositeColor } from "../board/helpers.js";
import { getNextBoardState } from "./next-state.js";

const getCapturedPiece = (board, move) => {
  if (move.to.special === "enPassant") return board[move.to.capturedRow][move.to.capturedCol];
  return board[move.to.row][move.to.col];
};

const scoreMoveForOrdering = (board, move, color, enPassantTarget) => {
  const movingPiece   = board[move.from.row][move.from.col];
  const capturedPiece = getCapturedPiece(board, move);
  let score = 0;

  if (capturedPiece) {
    score += piecePoints[capturedPiece.type] * 100 - piecePoints[movingPiece.type] * 10;
  }

  if (movingPiece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
    score += 850;
  }

  if (move.to.special === "castleKing" || move.to.special === "castleQueen") {
    score += 35;
  }

  const nextState = getNextBoardState(board, move, enPassantTarget);
  if (isKingInCheck(nextState.board, oppositeColor(color))) score += 60;

  return score;
};

export const sortMovesByPriority = (board, moves, color, enPassantTarget) =>
  [...moves].sort(
    (a, b) =>
      scoreMoveForOrdering(board, b, color, enPassantTarget) -
      scoreMoveForOrdering(board, a, color, enPassantTarget)
  );
