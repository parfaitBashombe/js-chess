import { getAllLegalMovesForColor } from "../board/legal-moves.js";
import { oppositeColor } from "../board/helpers.js";
import { sortMovesByPriority } from "./order-moves.js";
import { getNextBoardState } from "./next-state.js";
import { minimax, setDeadline, isTimedOut } from "./search.js";
import { resetKillers, resetHistory } from "./search-state.js";
import { getBookMove } from "./opening-book.js";
import { setEvalFlags } from "./evaluate.js";

const DIFFICULTY_CONFIGS = {
  beginner:     { timeLimitMs: 150,  openingBook: false, randomChance: 0.4, evalFlags: { pawnStructure: false, kingSafety: false } },
  casual:       { timeLimitMs: 400,  openingBook: false, randomChance: 0,   evalFlags: { pawnStructure: false, kingSafety: false } },
  intermediate: { timeLimitMs: 900,  openingBook: false, randomChance: 0,   evalFlags: { pawnStructure: true,  kingSafety: true  } },
  hard:         { timeLimitMs: 1500, openingBook: true,  randomChance: 0,   evalFlags: { pawnStructure: true,  kingSafety: true  } },
};

export const findBestMove = (board, color, enPassantTarget, difficulty = "hard") => {
  const cfg = DIFFICULTY_CONFIGS[difficulty] ?? DIFFICULTY_CONFIGS.hard;
  setEvalFlags(cfg.evalFlags);

  if (cfg.openingBook) {
    const bookMove = getBookMove(board, color, enPassantTarget);
    if (bookMove) return { move: bookMove, depth: 0, score: 0 };
  }

  const allMoves = getAllLegalMovesForColor(board, color, enPassantTarget);
  if (!allMoves.length) return null;

  if (cfg.randomChance > 0 && Math.random() < cfg.randomChance) {
    const move = allMoves[Math.floor(Math.random() * allMoves.length)];
    return { move, depth: 0, score: 0 };
  }

  resetKillers();
  resetHistory();
  setDeadline(performance.now() + cfg.timeLimitMs);

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
