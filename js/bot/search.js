import {
  getAllLegalMovesForColor,
  getLegalCapturesForColor,
} from "../board/legal-moves.js";
import { isKingInCheck } from "../board/check.js";
import { oppositeColor } from "../board/helpers.js";
import { scoreBoard, isEndgame } from "./evaluate.js";
import { sortMovesByPriority } from "./order-moves.js";
import { getNextBoardState } from "./next-state.js";
import {
  hashBoard,
  ttGet,
  ttGetMove,
  ttSet,
  TT_EXACT,
  TT_LOWER,
  TT_UPPER,
} from "./transposition.js";
import { storeKiller, addHistory } from "./search-state.js";

const CHECKMATE_SCORE = 100_000;
const MAX_QUIESCE_PLY = 8;

// ── Time control ──────────────────────────────────────────────────────────────

let deadline = Infinity;
let nodeCount = 0;
let timedOut = false;

export const setDeadline = (t) => {
  deadline = t;
  nodeCount = 0;
  timedOut = false;
};
export const isTimedOut = () => {
  if (timedOut) return true;
  if ((++nodeCount & 255) === 0 && performance.now() > deadline) {
    timedOut = true;
    return true;
  }
  return false;
};

// ── Null-move helper ──────────────────────────────────────────────────────────

const hasNonPawnMaterial = (board, color) => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type !== "pawn" && p.type !== "king")
        return true;
    }
  return false;
};

// ── Quiescence search ─────────────────────────────────────────────────────────

const quiesce = (
  board,
  colorToMove,
  botColor,
  alpha,
  beta,
  enPassantTarget,
  ply = 0,
) => {
  const standPat = scoreBoard(board, botColor, enPassantTarget);
  const isMax = colorToMove === botColor;

  if (isMax) {
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return standPat;
    if (standPat < beta) beta = standPat;
  }

  if (ply >= MAX_QUIESCE_PLY) return standPat;

  const captures = getLegalCapturesForColor(
    board,
    colorToMove,
    enPassantTarget,
  );
  if (!captures.length) return standPat;

  const sorted = sortMovesByPriority(
    board,
    captures,
    colorToMove,
    enPassantTarget,
  );
  let best = standPat;

  for (const move of sorted) {
    if (isTimedOut()) return best;
    const next = getNextBoardState(board, move, enPassantTarget);
    const score = quiesce(
      next.board,
      oppositeColor(colorToMove),
      botColor,
      alpha,
      beta,
      next.enPassantTarget,
      ply + 1,
    );

    if (isMax) {
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    } else {
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
  }

  return best;
};

// ── Minimax with alpha-beta ───────────────────────────────────────────────────

export const minimax = (
  board,
  colorToMove,
  botColor,
  depth,
  alpha,
  beta,
  enPassantTarget,
  isNullMove = false,
) => {
  if (isTimedOut()) return 0;

  const hash = hashBoard(board, colorToMove, enPassantTarget);
  const cached = ttGet(hash, depth, alpha, beta);
  if (cached !== null) return cached;

  const allMoves = getAllLegalMovesForColor(
    board,
    colorToMove,
    enPassantTarget,
  );
  const kingInCheck = isKingInCheck(board, colorToMove);

  if (allMoves.length === 0) {
    const score = kingInCheck
      ? colorToMove === botColor
        ? -CHECKMATE_SCORE - depth
        : CHECKMATE_SCORE + depth
      : 0;
    ttSet(hash, depth, score, TT_EXACT);
    return score;
  }

  if (depth === 0)
    return quiesce(board, colorToMove, botColor, alpha, beta, enPassantTarget);

  const isMax = colorToMove === botColor;

  // Null move pruning — skip the current player's turn and check if position is still great.
  // Only at MAX nodes, not in check, not in endgame, not inside another null move.
  if (
    isMax &&
    !isNullMove &&
    !kingInCheck &&
    depth >= 3 &&
    hasNonPawnMaterial(board, colorToMove) &&
    !isEndgame(board)
  ) {
    const R = depth >= 6 ? 3 : 2;
    const nullScore = minimax(
      board,
      oppositeColor(colorToMove),
      botColor,
      depth - R - 1,
      alpha,
      beta,
      null,
      true,
    );
    if (nullScore >= beta) return beta;
  }

  const ttMove = ttGetMove(hash);
  const sorted = sortMovesByPriority(
    board,
    allMoves,
    colorToMove,
    enPassantTarget,
    depth,
    ttMove,
  );
  const alphaOrig = alpha;
  const betaOrig = beta;
  let bestScore = isMax ? -Infinity : Infinity;
  let bestMove = sorted[0];

  for (const move of sorted) {
    if (isTimedOut()) break;

    const next = getNextBoardState(board, move, enPassantTarget);
    const score = minimax(
      next.board,
      oppositeColor(colorToMove),
      botColor,
      depth - 1,
      alpha,
      beta,
      next.enPassantTarget,
    );

    if (isMax) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (bestScore > alpha) alpha = bestScore;
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (bestScore < beta) beta = bestScore;
    }

    if (beta <= alpha) {
      storeKiller(depth, move);
      if (!move.to.capture && move.to.special !== "enPassant")
        addHistory(move, depth);
      break;
    }
  }

  // Assign proper TT flag based on whether search was bounded by alpha or beta.
  let flag;
  if (isMax) {
    flag =
      bestScore <= alphaOrig
        ? TT_UPPER
        : bestScore >= betaOrig
          ? TT_LOWER
          : TT_EXACT;
  } else {
    flag =
      bestScore >= betaOrig
        ? TT_LOWER
        : bestScore <= alphaOrig
          ? TT_UPPER
          : TT_EXACT;
  }

  ttSet(hash, depth, bestScore, flag, bestMove);
  return bestScore;
};
