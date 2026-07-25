const createPiece = (type, color) => ({ type, color, hasMoved: false });

export const createInitialBoard = () => {
  const backRankOrder = [
    "rook", "knight", "bishop", "queen",
    "king", "bishop", "knight", "rook",
  ];

  return [
    backRankOrder.map(type => createPiece(type, "black")),
    Array.from({ length: 8 }, () => createPiece("pawn", "black")),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array.from({ length: 8 }, () => createPiece("pawn", "white")),
    backRankOrder.map(type => createPiece(type, "white")),
  ];
};

export const cloneBoard = (board) =>
  board.map(row => row.map(square => (square ? { ...square } : null)));
