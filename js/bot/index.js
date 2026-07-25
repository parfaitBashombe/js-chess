import { getAllLegalMovesForColor } from "../board/legal-moves.js";
import { oppositeColor } from "../board/helpers.js";
import { sortMovesByPriority } from "./order-moves.js";
import { getNextBoardState } from "./next-state.js";
import { minimax } from "./search.js";

const pickSearchDepth = (numberOfAvailableMoves) => {
  if (numberOfAvailableMoves <= 8)  return 5;
  if (numberOfAvailableMoves <= 16) return 4;
  return 3;
};

export const findBestMove = (board, color, enPassantTarget) => {
  const availableMoves = getAllLegalMovesForColor(board, color, enPassantTarget);
  if (!availableMoves.length) return null;

  const depth       = pickSearchDepth(availableMoves.length);
  const sortedMoves = sortMovesByPriority(board, availableMoves, color, enPassantTarget);

  let bestMove  = sortedMoves[0];
  let bestScore = -Infinity;

  for (const move of sortedMoves) {
    const nextState = getNextBoardState(board, move, enPassantTarget);
    const score = minimax(
      nextState.board,
      oppositeColor(color),
      color,
      depth - 1,
      -Infinity,
      Infinity,
      nextState.enPassantTarget
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove  = move;
    }
  }

  return { move: bestMove, depth, score: bestScore };
};
