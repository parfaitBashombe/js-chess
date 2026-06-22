import { values } from "./constants.js";
import {
  cloneBoard,
  getAllLegalMoves,
  isInCheck,
  movePieceOnBoard,
  opposite,
} from "./engine.js";

const CHECKMATE_SCORE = 100000;

const material = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

const pieceSquareTables = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 35, 35, 20, 10, 10],
    [5, 5, 10, 30, 30, 10, 5, 5],
    [0, 0, 0, 25, 25, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -25, -25, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  knight: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 20, 30, 30, 20, 0, -30],
    [-30, 5, 20, 30, 30, 20, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  bishop: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 0, 10, 15, 15, 10, 0, -10],
    [-10, 5, 5, 15, 15, 5, 5, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  rook: [
    [0, 0, 5, 10, 10, 5, 0, 0],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  queen: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [0, 0, 5, 8, 8, 5, 0, -5],
    [-5, 0, 5, 8, 8, 5, 0, -5],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  king: [
    [20, 30, 10, 0, 0, 10, 30, 20],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
  ],
};

const getCapturedPiece = (board, move) => {
  if (move.to.special === "enPassant") {
    return board[move.to.capturedRow][move.to.capturedCol];
  }

  return board[move.to.row][move.to.col];
};

const getPieceSquareValue = (piece, row, col) => {
  const table = pieceSquareTables[piece.type];
  const tableRow = piece.color === "white" ? row : 7 - row;

  return table[tableRow][col];
};

const createNextState = (board, move, enPassantTarget) => {
  const nextBoard = cloneBoard(board);
  const movingPiece = nextBoard[move.from.row][move.from.col];
  const oldType = movingPiece.type;

  movePieceOnBoard(nextBoard, move.from.row, move.from.col, move.to);

  const movedPiece = nextBoard[move.to.row][move.to.col];

  if (movedPiece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
    movedPiece.type = "queen";
  }

  let nextEnPassantTarget = null;

  if (oldType === "pawn" && Math.abs(move.to.row - move.from.row) === 2) {
    nextEnPassantTarget = {
      row: (move.from.row + move.to.row) / 2,
      col: move.from.col,
      capturedRow: move.to.row,
      capturedCol: move.from.col,
    };
  }

  return {
    board: nextBoard,
    enPassantTarget: nextEnPassantTarget,
  };
};

const evaluateBoard = (board, botColor, enPassantTarget) => {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (!piece) continue;

      const sign = piece.color === botColor ? 1 : -1;
      const pieceScore =
        material[piece.type] + getPieceSquareValue(piece, row, col);

      score += sign * pieceScore;
    }
  }

  const botMoves = getAllLegalMoves(board, botColor, enPassantTarget).length;
  const opponentMoves = getAllLegalMoves(
    board,
    opposite(botColor),
    enPassantTarget,
  ).length;

  score += (botMoves - opponentMoves) * 4;

  if (isInCheck(board, opposite(botColor))) {
    score += 35;
  }

  if (isInCheck(board, botColor)) {
    score -= 45;
  }

  return score;
};

const getMoveOrderingScore = (board, move, color, enPassantTarget) => {
  const movingPiece = board[move.from.row][move.from.col];
  const capturedPiece = getCapturedPiece(board, move);
  let score = 0;

  if (capturedPiece) {
    score += values[capturedPiece.type] * 100 - values[movingPiece.type] * 10;
  }

  if (movingPiece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
    score += 850;
  }

  if (move.to.special === "castleKing" || move.to.special === "castleQueen") {
    score += 35;
  }

  const nextState = createNextState(board, move, enPassantTarget);

  if (isInCheck(nextState.board, opposite(color))) {
    score += 60;
  }

  return score;
};

const orderMoves = (board, moves, color, enPassantTarget) =>
  [...moves].sort(
    (a, b) =>
      getMoveOrderingScore(board, b, color, enPassantTarget) -
      getMoveOrderingScore(board, a, color, enPassantTarget),
  );

const minimax = (
  board,
  colorToMove,
  botColor,
  depth,
  alpha,
  beta,
  enPassantTarget,
) => {
  const legalMoves = getAllLegalMoves(board, colorToMove, enPassantTarget);
  const inCheck = isInCheck(board, colorToMove);

  if (legalMoves.length === 0) {
    if (inCheck) {
      return colorToMove === botColor
        ? -CHECKMATE_SCORE - depth
        : CHECKMATE_SCORE + depth;
    }

    return 0;
  }

  if (depth === 0) {
    return evaluateBoard(board, botColor, enPassantTarget);
  }

  const sortedMoves = orderMoves(
    board,
    legalMoves,
    colorToMove,
    enPassantTarget,
  );

  if (colorToMove === botColor) {
    let bestScore = -Infinity;

    for (const move of sortedMoves) {
      const nextState = createNextState(board, move, enPassantTarget);
      const score = minimax(
        nextState.board,
        opposite(colorToMove),
        botColor,
        depth - 1,
        alpha,
        beta,
        nextState.enPassantTarget,
      );

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);

      if (beta <= alpha) break;
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of sortedMoves) {
    const nextState = createNextState(board, move, enPassantTarget);
    const score = minimax(
      nextState.board,
      opposite(colorToMove),
      botColor,
      depth - 1,
      alpha,
      beta,
      nextState.enPassantTarget,
    );

    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);

    if (beta <= alpha) break;
  }

  return bestScore;
};

const chooseSearchDepth = (movesCount) => {
  if (movesCount <= 8) return 5;
  if (movesCount <= 16) return 4;

  return 3;
};

export const getBotMove = (board, color, enPassantTarget) => {
  const legalMoves = getAllLegalMoves(board, color, enPassantTarget);

  if (!legalMoves.length) return null;

  const depth = chooseSearchDepth(legalMoves.length);
  const sortedMoves = orderMoves(board, legalMoves, color, enPassantTarget);

  let bestMove = sortedMoves[0];
  let bestScore = -Infinity;

  for (const move of sortedMoves) {
    const nextState = createNextState(board, move, enPassantTarget);
    const score = minimax(
      nextState.board,
      opposite(color),
      color,
      depth - 1,
      -Infinity,
      Infinity,
      nextState.enPassantTarget,
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    move: bestMove,
    depth,
    score: bestScore,
  };
};
