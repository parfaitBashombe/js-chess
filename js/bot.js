import { values } from "./constants.js";
import {
  cloneBoard,
  getAllLegalMoves,
  isInCheck,
  movePieceOnBoard,
  opposite,
} from "./engine.js";

const getCapturedPiece = (board, move) => {
  if (move.to.special === "enPassant") {
    return board[move.to.capturedRow][move.to.capturedCol];
  }

  return board[move.to.row][move.to.col];
};

const isPromotion = (piece, move) => {
  if (!piece || piece.type !== "pawn") return false;

  return move.to.row === 0 || move.to.row === 7;
};

const scoreMove = (board, move, color, enPassantTarget) => {
  const piece = board[move.from.row][move.from.col];
  const capturedPiece = getCapturedPiece(board, move);
  const nextBoard = cloneBoard(board);

  movePieceOnBoard(nextBoard, move.from.row, move.from.col, move.to);

  let score = Math.random() * 0.3;

  if (capturedPiece) {
    score += values[capturedPiece.type] * 10;
    score -= values[piece.type] * 0.5;
  }

  if (isPromotion(piece, move)) {
    score += 80;
  }

  if (isInCheck(nextBoard, opposite(color))) {
    score += 15;
  }

  const opponentReplies = getAllLegalMoves(
    nextBoard,
    opposite(color),
    enPassantTarget,
  );

  if (opponentReplies.length === 0 && isInCheck(nextBoard, opposite(color))) {
    score += 1000;
  }

  return score;
};

export const getBotMove = (board, color, enPassantTarget) => {
  const moves = getAllLegalMoves(board, color, enPassantTarget);

  if (!moves.length) return null;

  return moves
    .map((move) => ({
      ...move,
      score: scoreMove(board, move, color, enPassantTarget),
    }))
    .sort((a, b) => b.score - a.score)[0];
};
