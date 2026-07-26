import { piecePoints } from "../data/points.js";
import { isKiller, getHistory } from "./search-state.js";

const getCapturedPiece = (board, move) => {
  if (move.to.special === "enPassant") return board[move.to.capturedRow][move.to.capturedCol];
  return board[move.to.row][move.to.col];
};

const scoreMove = (board, move, color, enPassantTarget, depth, ttMove) => {
  // TT best move from previous iteration — search it first.
  if (ttMove &&
      move.from.row === ttMove.from.row && move.from.col === ttMove.from.col &&
      move.to.row   === ttMove.to.row   && move.to.col   === ttMove.to.col) return 1_000_000;

  const moving   = board[move.from.row][move.from.col];
  const captured = getCapturedPiece(board, move);
  let score = 0;

  // Captures: MVV-LVA (Most Valuable Victim — Least Valuable Attacker)
  if (captured) score += 100_000 + piecePoints[captured.type] * 100 - piecePoints[moving.type];

  // Pawn promotions
  if (moving.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) score += 90_000;

  // Killer moves (quiet moves that caused cutoffs at this depth)
  if (!captured && isKiller(depth, move)) score += 80_000;

  // Castling
  if (move.to.special === "castleKing" || move.to.special === "castleQueen") score += 50;

  // History heuristic (accumulated score for good quiet moves)
  score += getHistory(move);

  return score;
};

export const sortMovesByPriority = (board, moves, color, enPassantTarget, depth = 0, ttMove = null) =>
  [...moves].sort((a, b) =>
    scoreMove(board, b, color, enPassantTarget, depth, ttMove) -
    scoreMove(board, a, color, enPassantTarget, depth, ttMove)
  );
