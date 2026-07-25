export const applyMoveToBoard = (board, fromRow, fromCol, move) => {
  const movingPiece = board[fromRow][fromCol];
  let capturedPiece = null;

  if (move.special === "enPassant") {
    capturedPiece = board[move.capturedRow][move.capturedCol];
    board[move.capturedRow][move.capturedCol] = null;
  } else {
    capturedPiece = board[move.row][move.col];
  }

  board[move.row][move.col] = { ...movingPiece, hasMoved: true };
  board[fromRow][fromCol] = null;

  if (move.special === "castleKing") {
    const rook = board[move.row][7];
    board[move.row][5] = { ...rook, hasMoved: true };
    board[move.row][7] = null;
  }

  if (move.special === "castleQueen") {
    const rook = board[move.row][0];
    board[move.row][3] = { ...rook, hasMoved: true };
    board[move.row][0] = null;
  }

  return capturedPiece;
};
