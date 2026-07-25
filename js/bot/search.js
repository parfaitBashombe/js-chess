import { getAllLegalMovesForColor } from "../board/legal-moves.js";
import { isKingInCheck } from "../board/check.js";
import { oppositeColor } from "../board/helpers.js";
import { scoreBoard } from "./evaluate.js";
import { sortMovesByPriority } from "./order-moves.js";
import { getNextBoardState } from "./next-state.js";

const CHECKMATE_SCORE = 100000;

export const minimax = (board, colorToMove, botColor, depth, alpha, beta, enPassantTarget) => {
  const availableMoves = getAllLegalMovesForColor(board, colorToMove, enPassantTarget);
  const kingIsInCheck  = isKingInCheck(board, colorToMove);

  if (availableMoves.length === 0) {
    if (kingIsInCheck) {
      return colorToMove === botColor ? -CHECKMATE_SCORE - depth : CHECKMATE_SCORE + depth;
    }
    return 0;
  }

  if (depth === 0) {
    return scoreBoard(board, botColor, enPassantTarget);
  }

  const sortedMoves   = sortMovesByPriority(board, availableMoves, colorToMove, enPassantTarget);
  const isMaximizing  = colorToMove === botColor;
  let bestScore       = isMaximizing ? -Infinity : Infinity;

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
      bestScore = Math.max(bestScore, score);
      alpha     = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta      = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break;
  }

  return bestScore;
};
