import { isInsideBoard } from "./helpers.js";
import { canCastle } from "./castling.js";

export const generateMovesForPiece = (board, row, col, enPassantTarget) => {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];

  switch (piece.type) {
    case "pawn":
      addPawnMoves(board, row, col, piece, moves, enPassantTarget);
      break;
    case "knight":
      addKnightMoves(board, row, col, piece, moves);
      break;
    case "bishop":
      addSlidingMoves(board, row, col, piece, moves, [[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;
    case "rook":
      addSlidingMoves(board, row, col, piece, moves, [[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case "queen":
      addSlidingMoves(board, row, col, piece, moves, [
        [-1,-1],[-1,1],[1,-1],[1,1],
        [-1, 0],[ 1,0],[0,-1],[0,1],
      ]);
      break;
    case "king":
      addKingMoves(board, row, col, piece, moves);
      break;
  }

  return moves;
};

const addPawnMoves = (board, row, col, piece, moves, enPassantTarget) => {
  const moveDirection = piece.color === "white" ? -1 : 1;
  const homeRow       = piece.color === "white" ? 6 : 1;

  const oneStepRow = row + moveDirection;
  const twoStepRow = row + moveDirection * 2;

  if (isInsideBoard(oneStepRow, col) && !board[oneStepRow][col]) {
    moves.push({ row: oneStepRow, col, capture: false });

    if (row === homeRow && isInsideBoard(twoStepRow, col) && !board[twoStepRow][col]) {
      moves.push({ row: twoStepRow, col, capture: false });
    }
  }

  for (const colOffset of [-1, 1]) {
    const targetRow = row + moveDirection;
    const targetCol = col + colOffset;

    if (!isInsideBoard(targetRow, targetCol)) continue;

    const targetSquare = board[targetRow][targetCol];

    if (targetSquare && targetSquare.color !== piece.color && targetSquare.type !== "king") {
      moves.push({ row: targetRow, col: targetCol, capture: true });
    }

    if (
      enPassantTarget &&
      enPassantTarget.row === targetRow &&
      enPassantTarget.col === targetCol
    ) {
      const pawnToCapture = board[enPassantTarget.capturedRow][enPassantTarget.capturedCol];
      if (pawnToCapture && pawnToCapture.type === "pawn" && pawnToCapture.color !== piece.color) {
        moves.push({
          row: targetRow,
          col: targetCol,
          capture: true,
          special: "enPassant",
          capturedRow: enPassantTarget.capturedRow,
          capturedCol: enPassantTarget.capturedCol,
        });
      }
    }
  }
};

const addKnightMoves = (board, row, col, piece, moves) => {
  const knightJumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightJumps) {
    addMoveIfReachable(board, row + dr, col + dc, piece, moves);
  }
};

const addKingMoves = (board, row, col, piece, moves) => {
  const adjacentSquares = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of adjacentSquares) {
    addMoveIfReachable(board, row + dr, col + dc, piece, moves);
  }

  if (canCastle(board, piece.color, "king")) {
    moves.push({ row, col: 6, capture: false, special: "castleKing" });
  }

  if (canCastle(board, piece.color, "queen")) {
    moves.push({ row, col: 2, capture: false, special: "castleQueen" });
  }
};

const addSlidingMoves = (board, row, col, piece, moves, directions) => {
  for (const [dr, dc] of directions) {
    let r = row + dr, c = col + dc;

    while (isInsideBoard(r, c)) {
      const targetSquare = board[r][c];

      if (!targetSquare) {
        moves.push({ row: r, col: c, capture: false });
      } else {
        if (targetSquare.color !== piece.color && targetSquare.type !== "king") {
          moves.push({ row: r, col: c, capture: true });
        }
        break;
      }

      r += dr;
      c += dc;
    }
  }
};

const addMoveIfReachable = (board, row, col, piece, moves) => {
  if (!isInsideBoard(row, col)) return;

  const targetSquare = board[row][col];

  if (!targetSquare) {
    moves.push({ row, col, capture: false });
  } else if (targetSquare.color !== piece.color && targetSquare.type !== "king") {
    moves.push({ row, col, capture: true });
  }
};
