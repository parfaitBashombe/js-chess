import { files } from "./constants.js";

export const createPiece = (type, color) => ({
  type,
  color,
  hasMoved: false,
});

export const createInitialBoard = () => {
  const backRank = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  return [
    backRank.map((type) => createPiece(type, "black")),
    Array.from({ length: 8 }, () => createPiece("pawn", "black")),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array.from({ length: 8 }, () => createPiece("pawn", "white")),
    backRank.map((type) => createPiece(type, "white")),
  ];
};

export const cloneBoard = (boardState) =>
  boardState.map((row) => row.map((piece) => (piece ? { ...piece } : null)));

export const inside = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

export const opposite = (color) => (color === "white" ? "black" : "white");

export const capitalize = (word) =>
  word.charAt(0).toUpperCase() + word.slice(1);

export const pieceName = (type) => type.charAt(0).toUpperCase() + type.slice(1);

export const squareName = (row, col) => `${files[col]}${8 - row}`;

export const findKing = (boardState, color) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];

      if (piece && piece.type === "king" && piece.color === color) {
        return { row, col };
      }
    }
  }

  return null;
};

export const isInCheck = (boardState, color) => {
  const kingSquare = findKing(boardState, color);

  if (!kingSquare) return true;

  return isSquareAttacked(
    boardState,
    kingSquare.row,
    kingSquare.col,
    opposite(color),
  );
};

export const isSquareAttacked = (boardState, row, col, byColor) => {
  const pawnDirection = byColor === "white" ? -1 : 1;
  const pawnRow = row - pawnDirection;

  for (const dc of [-1, 1]) {
    const pawnCol = col + dc;

    if (inside(pawnRow, pawnCol)) {
      const piece = boardState[pawnRow][pawnCol];

      if (piece && piece.color === byColor && piece.type === "pawn") {
        return true;
      }
    }
  }

  const knightJumps = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  for (const [dr, dc] of knightJumps) {
    const nextRow = row + dr;
    const nextCol = col + dc;

    if (inside(nextRow, nextCol)) {
      const piece = boardState[nextRow][nextCol];

      if (piece && piece.color === byColor && piece.type === "knight") {
        return true;
      }
    }
  }

  const kingSteps = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of kingSteps) {
    const nextRow = row + dr;
    const nextCol = col + dc;

    if (inside(nextRow, nextCol)) {
      const piece = boardState[nextRow][nextCol];

      if (piece && piece.color === byColor && piece.type === "king") {
        return true;
      }
    }
  }

  const rookDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const bishopDirections = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  if (
    isAttackedBySlider(boardState, row, col, byColor, rookDirections, [
      "rook",
      "queen",
    ])
  ) {
    return true;
  }

  if (
    isAttackedBySlider(boardState, row, col, byColor, bishopDirections, [
      "bishop",
      "queen",
    ])
  ) {
    return true;
  }

  return false;
};

export const isAttackedBySlider = (
  boardState,
  row,
  col,
  byColor,
  directions,
  attackers,
) => {
  for (const [dr, dc] of directions) {
    let nextRow = row + dr;
    let nextCol = col + dc;

    while (inside(nextRow, nextCol)) {
      const piece = boardState[nextRow][nextCol];

      if (piece) {
        if (piece.color === byColor && attackers.includes(piece.type)) {
          return true;
        }

        break;
      }

      nextRow += dr;
      nextCol += dc;
    }
  }

  return false;
};

export const movePieceOnBoard = (boardState, fromRow, fromCol, move) => {
  const piece = boardState[fromRow][fromCol];
  let capturedPiece = null;

  if (move.special === "enPassant") {
    capturedPiece = boardState[move.capturedRow][move.capturedCol];
    boardState[move.capturedRow][move.capturedCol] = null;
  } else {
    capturedPiece = boardState[move.row][move.col];
  }

  boardState[move.row][move.col] = {
    ...piece,
    hasMoved: true,
  };

  boardState[fromRow][fromCol] = null;

  if (move.special === "castleKing") {
    const rook = boardState[move.row][7];

    boardState[move.row][5] = {
      ...rook,
      hasMoved: true,
    };

    boardState[move.row][7] = null;
  }

  if (move.special === "castleQueen") {
    const rook = boardState[move.row][0];

    boardState[move.row][3] = {
      ...rook,
      hasMoved: true,
    };

    boardState[move.row][0] = null;
  }

  return capturedPiece;
};

export const getLegalMovesFor = (
  boardState,
  row,
  col,
  turn,
  enPassantTarget,
) => {
  const piece = boardState[row][col];

  if (!piece) return [];
  if (piece.color !== turn) return [];

  return getPseudoMoves(boardState, row, col, enPassantTarget).filter(
    (move) => {
      const nextBoard = cloneBoard(boardState);

      movePieceOnBoard(nextBoard, row, col, move);

      return !isInCheck(nextBoard, piece.color);
    },
  );
};

export const getAllLegalMoves = (boardState, color, enPassantTarget) => {
  const moves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];

      if (piece && piece.color === color) {
        getLegalMovesFor(boardState, row, col, color, enPassantTarget).forEach(
          (move) => {
            moves.push({
              from: { row, col },
              to: move,
            });
          },
        );
      }
    }
  }

  return moves;
};

export const getPseudoMoves = (boardState, row, col, enPassantTarget) => {
  const piece = boardState[row][col];
  const moves = [];

  if (!piece) return moves;

  if (piece.type === "pawn") {
    addPawnMoves(boardState, row, col, piece, moves, enPassantTarget);
  }

  if (piece.type === "knight") {
    addKnightMoves(boardState, row, col, piece, moves);
  }

  if (piece.type === "bishop") {
    addSlidingMoves(boardState, row, col, piece, moves, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  }

  if (piece.type === "rook") {
    addSlidingMoves(boardState, row, col, piece, moves, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  if (piece.type === "queen") {
    addSlidingMoves(boardState, row, col, piece, moves, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  if (piece.type === "king") {
    addKingMoves(boardState, row, col, piece, moves);
  }

  return moves;
};

export const addPawnMoves = (
  boardState,
  row,
  col,
  piece,
  moves,
  enPassantTarget,
) => {
  const direction = piece.color === "white" ? -1 : 1;
  const startRow = piece.color === "white" ? 6 : 1;
  const oneStep = row + direction;
  const twoStep = row + direction * 2;

  if (inside(oneStep, col) && !boardState[oneStep][col]) {
    moves.push({ row: oneStep, col, capture: false });

    if (row === startRow && inside(twoStep, col) && !boardState[twoStep][col]) {
      moves.push({ row: twoStep, col, capture: false });
    }
  }

  [-1, 1].forEach((dc) => {
    const targetRow = row + direction;
    const targetCol = col + dc;

    if (!inside(targetRow, targetCol)) return;

    const target = boardState[targetRow][targetCol];

    if (target && target.color !== piece.color && target.type !== "king") {
      moves.push({
        row: targetRow,
        col: targetCol,
        capture: true,
      });
    }

    if (
      enPassantTarget &&
      enPassantTarget.row === targetRow &&
      enPassantTarget.col === targetCol
    ) {
      const capturedPawn =
        boardState[enPassantTarget.capturedRow][enPassantTarget.capturedCol];

      if (
        capturedPawn &&
        capturedPawn.type === "pawn" &&
        capturedPawn.color !== piece.color
      ) {
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
  });
};

export const addKnightMoves = (boardState, row, col, piece, moves) => {
  [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ].forEach(([dr, dc]) => {
    addTargetMove(boardState, row + dr, col + dc, piece, moves);
  });
};

export const addKingMoves = (boardState, row, col, piece, moves) => {
  [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ].forEach(([dr, dc]) => {
    addTargetMove(boardState, row + dr, col + dc, piece, moves);
  });

  if (canCastle(boardState, piece.color, "king")) {
    moves.push({
      row,
      col: 6,
      capture: false,
      special: "castleKing",
    });
  }

  if (canCastle(boardState, piece.color, "queen")) {
    moves.push({
      row,
      col: 2,
      capture: false,
      special: "castleQueen",
    });
  }
};

export const addSlidingMoves = (
  boardState,
  row,
  col,
  piece,
  moves,
  directions,
) => {
  directions.forEach(([dr, dc]) => {
    let nextRow = row + dr;
    let nextCol = col + dc;

    while (inside(nextRow, nextCol)) {
      const target = boardState[nextRow][nextCol];

      if (!target) {
        moves.push({
          row: nextRow,
          col: nextCol,
          capture: false,
        });
      } else {
        if (target.color !== piece.color && target.type !== "king") {
          moves.push({
            row: nextRow,
            col: nextCol,
            capture: true,
          });
        }

        break;
      }

      nextRow += dr;
      nextCol += dc;
    }
  });
};

export const addTargetMove = (boardState, row, col, piece, moves) => {
  if (!inside(row, col)) return;

  const target = boardState[row][col];

  if (!target) {
    moves.push({
      row,
      col,
      capture: false,
    });
    return;
  }

  if (target.color !== piece.color && target.type !== "king") {
    moves.push({
      row,
      col,
      capture: true,
    });
  }
};

export const canCastle = (boardState, color, side) => {
  const row = color === "white" ? 7 : 0;
  const king = boardState[row][4];

  if (!king || king.type !== "king" || king.color !== color || king.hasMoved) {
    return false;
  }

  if (isInCheck(boardState, color)) {
    return false;
  }

  const rookCol = side === "king" ? 7 : 0;
  const rook = boardState[row][rookCol];

  if (!rook || rook.type !== "rook" || rook.color !== color || rook.hasMoved) {
    return false;
  }

  const emptyCols = side === "king" ? [5, 6] : [1, 2, 3];
  const safeCols = side === "king" ? [5, 6] : [3, 2];

  if (emptyCols.some((col) => boardState[row][col])) {
    return false;
  }

  return safeCols.every(
    (col) => !isSquareAttacked(boardState, row, col, opposite(color)),
  );
};
