import { getAllLegalMovesForColor, getLegalCapturesForColor } from "../board/legal-moves.js";
import { isKingInCheck } from "../board/check.js";
import { oppositeColor } from "../board/helpers.js";
import { scoreBoard } from "./evaluate.js";
import { sortMovesByPriority } from "./order-moves.js";
import { getNextBoardState } from "./next-state.js";
import { hashBoard, ttGet, ttSet } from "./transposition.js";

const CHECKMATE_SCORE = 100_000;
const MAX_QUIESCE_PLY = 6;

// Extends the search at leaf nodes by chasing capture chains until the
// position is "quiet". Prevents the bot from missing obvious tactics
// that happen one ply beyond the regular search depth.
const quiesce = (board, colorToMove, botColor, alpha, beta, enPassantTarget, ply = 0) => {
  const standPat     = scoreBoard(board, botColor, enPassantTarget);
  const isMaximizing = colorToMove === botColor;

  // Stand-pat: assume the side to move can always choose to stop capturing.
  if (isMaximizing) {
    if (standPat >= beta)  return standPat;
    if (standPat > alpha)  alpha = standPat;
  } else {
    if (standPat <= alpha) return standPat;
    if (standPat < beta)   beta = standPat;
  }

  if (ply >= MAX_QUIESCE_PLY) return standPat;

  const captures = getLegalCapturesForColor(board, colorToMove, enPassantTarget);
  if (!captures.length) return standPat;

  const sorted = sortMovesByPriority(board, captures, colorToMove, enPassantTarget);
  let best = standPat;

  for (const move of sorted) {
    const next  = getNextBoardState(board, move, enPassantTarget);
    const score = quiesce(
      next.board,
      oppositeColor(colorToMove),
      botColor,
      alpha,
      beta,
      next.enPassantTarget,
      ply + 1
    );

    if (isMaximizing) {
      if (score > best)  best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    } else {
      if (score < best)  best = score;
      if (score < beta)  beta = score;
      if (beta <= alpha) break;
    }
  }

  return best;
};

export const minimax = (board, colorToMove, botColor, depth, alpha, beta, enPassantTarget) => {
  const hash   = hashBoard(board, colorToMove, enPassantTarget);
  const cached = ttGet(hash, depth);
  if (cached !== null) return cached;

  const availableMoves = getAllLegalMovesForColor(board, colorToMove, enPassantTarget);
  const kingIsInCheck  = isKingInCheck(board, colorToMove);

  if (availableMoves.length === 0) {
    const score = kingIsInCheck
      ? (colorToMove === botColor ? -CHECKMATE_SCORE - depth : CHECKMATE_SCORE + depth)
      : 0;
    ttSet(hash, depth, score);
    return score;
  }

  if (depth === 0) {
    return quiesce(board, colorToMove, botColor, alpha, beta, enPassantTarget);
  }

  const sortedMoves  = sortMovesByPriority(board, availableMoves, colorToMove, enPassantTarget);
  const isMaximizing = colorToMove === botColor;
  let bestScore      = isMaximizing ? -Infinity : Infinity;

  for (const move of sortedMoves) {
    const nextState = getNextBoardState(board, move, enPassantTarget);
    const score = minimax(
      nextState.board,
      oppositeColor(colorToMove),
      botColor,
      depth - 1,
      alpha,
      beta,
      nextState.enPassantTarget
    );

    if (isMaximizing) {
      if (score > bestScore) bestScore = score;
      if (bestScore > alpha) alpha = bestScore;
    } else {
      if (score < bestScore) bestScore = score;
      if (bestScore < beta)  beta = bestScore;
    }

    if (beta <= alpha) break;
  }

  ttSet(hash, depth, bestScore);
  return bestScore;
};
