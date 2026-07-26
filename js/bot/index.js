import { getAllLegalMovesForColor } from "../board/legal-moves.js";
import { oppositeColor } from "../board/helpers.js";
import { sortMovesByPriority } from "./order-moves.js";
import { getNextBoardState } from "./next-state.js";
import { minimax, setDeadline, isTimedOut } from "./search.js";
import { resetKillers, resetHistory } from "./search-state.js";
import { getBookMove } from "./opening-book.js";

export const findBestMove = (board, color, enPassantTarget, timeLimitMs = 1500) => {
  const bookMove = getBookMove(board, color, enPassantTarget);
  if (bookMove) return { move: bookMove, depth: 0, score: 0 };

  const allMoves = getAllLegalMovesForColor(board, color, enPassantTarget);
  if (!allMoves.length) return null;

  resetKillers();
  resetHistory();
  setDeadline(performance.now() + timeLimitMs);

  // Fallback: first move from initial priority sort (in case depth 1 times out immediately)
  let bestMove = sortMovesByPriority(board, allMoves, color, enPassantTarget)[0];
  let bestScore = -Infinity;
  let completedDepth = 0;

  for (let depth = 1; depth <= 30; depth++) {
    const sorted = sortMovesByPriority(board, allMoves, color, enPassantTarget, depth);
    let iterBest = null;
    let iterScore = -Infinity;
    let timedOut = false;

    for (const move of sorted) {
      if (isTimedOut()) { timedOut = true; break; }
      const next = getNextBoardState(board, move, enPassantTarget);
      const score = minimax(
        next.board, oppositeColor(color), color,
        depth - 1, -Infinity, Infinity, next.enPassantTarget,
      );
      if (score > iterScore) {
        iterScore = score;
        iterBest  = move;
      }
    }

    if (!timedOut && iterBest) {
      bestMove       = iterBest;
      bestScore      = iterScore;
      completedDepth = depth;
    }

    if (timedOut) break;
    if (bestScore > 90_000) break; // forced checkmate found — no need to search deeper
  }

  return { move: bestMove, depth: completedDepth, score: bestScore };
};
