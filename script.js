const chessBoard = document.querySelector("#chessboard");
const playerDisplay = document.querySelector("#player");
const infoDisplay = document.querySelector("#info-display");
const restartButton = document.querySelector("#restart-btn");

const width = 8;

const pieceTemplates = {
  king,
  queen,
  rook,
  bishop,
  knight,
  pawn,
};

let currentPlayer = "white";
let draggedFrom = null;
let gameOver = false;
let enPassantTarget = null;

const createPiece = (type, color) => ({
  type,
  color,
  hasMoved: false,
});

const createStartBoard = () => [
  createPiece("rook", "black"),
  createPiece("knight", "black"),
  createPiece("bishop", "black"),
  createPiece("queen", "black"),
  createPiece("king", "black"),
  createPiece("bishop", "black"),
  createPiece("knight", "black"),
  createPiece("rook", "black"),

  createPiece("pawn", "black"),
  createPiece("pawn", "black"),
  createPiece("pawn", "black"),
  createPiece("pawn", "black"),
  createPiece("pawn", "black"),
  createPiece("pawn", "black"),
  createPiece("pawn", "black"),
  createPiece("pawn", "black"),

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  createPiece("pawn", "white"),
  createPiece("pawn", "white"),
  createPiece("pawn", "white"),
  createPiece("pawn", "white"),
  createPiece("pawn", "white"),
  createPiece("pawn", "white"),
  createPiece("pawn", "white"),
  createPiece("pawn", "white"),

  createPiece("rook", "white"),
  createPiece("knight", "white"),
  createPiece("bishop", "white"),
  createPiece("queen", "white"),
  createPiece("king", "white"),
  createPiece("bishop", "white"),
  createPiece("knight", "white"),
  createPiece("rook", "white"),
];

let board = createStartBoard();

const getRow = (index) => Math.floor(index / width);
const getCol = (index) => index % width;
const getIndex = (row, col) => row * width + col;

const isInsideBoard = (row, col) => {
  return row >= 0 && row < width && col >= 0 && col < width;
};

const getOppositeColor = (color) => {
  return color === "white" ? "black" : "white";
};

const cloneBoard = (currentBoard) => {
  return currentBoard.map((piece) => {
    if (!piece) return null;
    return { ...piece };
  });
};

const createBoardSquares = () => {
  chessBoard.innerHTML = "";

  for (let i = 0; i < 64; i++) {
    const square = document.createElement("div");

    square.classList.add("square");
    square.dataset.squareId = String(i);

    const row = getRow(i);
    const col = getCol(i);

    if ((row + col) % 2 === 0) {
      square.classList.add("beige");
    } else {
      square.classList.add("brown");
    }

    chessBoard.append(square);
  }
};

const renderPiece = (piece) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = pieceTemplates[piece.type].trim();

  const pieceElement = wrapper.firstElementChild;

  pieceElement.removeAttribute("id");
  pieceElement.classList.add(piece.color);
  pieceElement.dataset.piece = piece.type;
  pieceElement.dataset.color = piece.color;
  pieceElement.setAttribute("draggable", true);

  return pieceElement;
};

const renderBoard = () => {
  const squares = document.querySelectorAll(".square");

  squares.forEach((square, index) => {
    square.innerHTML = "";
    square.classList.remove("legal-move", "legal-capture", "drag-over");

    const piece = board[index];

    if (piece) {
      square.append(renderPiece(piece));
    }
  });
};

const clearMoveHighlights = () => {
  document.querySelectorAll(".square").forEach((square) => {
    square.classList.remove("legal-move", "legal-capture");
  });
};

const showMoveHighlights = (from) => {
  clearMoveHighlights();

  const moves = getLegalMoves(from);

  moves.forEach((move) => {
    const square = document.querySelector(`[data-square-id="${move.to}"]`);

    if (!square) return;

    if (board[move.to] || move.enPassantCapture !== undefined) {
      square.classList.add("legal-capture");
    } else {
      square.classList.add("legal-move");
    }
  });
};

const getSlidingMoves = (from, currentBoard, directions) => {
  const moves = [];
  const piece = currentBoard[from];

  const startRow = getRow(from);
  const startCol = getCol(from);

  directions.forEach(([rowDirection, colDirection]) => {
    let row = startRow + rowDirection;
    let col = startCol + colDirection;

    while (isInsideBoard(row, col)) {
      const target = getIndex(row, col);
      const targetPiece = currentBoard[target];

      if (!targetPiece) {
        moves.push({ to: target });
      } else {
        if (targetPiece.color !== piece.color) {
          moves.push({ to: target });
        }

        break;
      }

      row += rowDirection;
      col += colDirection;
    }
  });

  return moves;
};

const getPawnMoves = (from, currentBoard, targetEnPassant) => {
  const moves = [];
  const piece = currentBoard[from];

  const row = getRow(from);
  const col = getCol(from);

  const direction = piece.color === "white" ? -1 : 1;
  const startRow = piece.color === "white" ? 6 : 1;

  const oneStepRow = row + direction;
  const oneStepIndex = getIndex(oneStepRow, col);

  if (isInsideBoard(oneStepRow, col) && !currentBoard[oneStepIndex]) {
    moves.push({ to: oneStepIndex });

    const twoStepRow = row + direction * 2;
    const twoStepIndex = getIndex(twoStepRow, col);

    if (
      row === startRow &&
      isInsideBoard(twoStepRow, col) &&
      !currentBoard[twoStepIndex]
    ) {
      moves.push({
        to: twoStepIndex,
        doublePawnPush: true,
      });
    }
  }

  [-1, 1].forEach((colDirection) => {
    const captureRow = row + direction;
    const captureCol = col + colDirection;

    if (!isInsideBoard(captureRow, captureCol)) return;

    const captureIndex = getIndex(captureRow, captureCol);
    const targetPiece = currentBoard[captureIndex];

    if (targetPiece && targetPiece.color !== piece.color) {
      moves.push({ to: captureIndex });
    }

    if (targetEnPassant === captureIndex && !targetPiece) {
      const capturedPawnIndex =
        piece.color === "white" ? captureIndex + width : captureIndex - width;

      const capturedPawn = currentBoard[capturedPawnIndex];

      if (
        capturedPawn &&
        capturedPawn.type === "pawn" &&
        capturedPawn.color !== piece.color
      ) {
        moves.push({
          to: captureIndex,
          enPassantCapture: capturedPawnIndex,
        });
      }
    }
  });

  return moves;
};

const getKnightMoves = (from, currentBoard) => {
  const moves = [];
  const piece = currentBoard[from];

  const row = getRow(from);
  const col = getCol(from);

  const jumps = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  jumps.forEach(([rowDirection, colDirection]) => {
    const targetRow = row + rowDirection;
    const targetCol = col + colDirection;

    if (!isInsideBoard(targetRow, targetCol)) return;

    const target = getIndex(targetRow, targetCol);
    const targetPiece = currentBoard[target];

    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({ to: target });
    }
  });

  return moves;
};

const getKingMoves = (from, currentBoard, includeSpecialMoves = true) => {
  const moves = [];
  const piece = currentBoard[from];

  const row = getRow(from);
  const col = getCol(from);

  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  directions.forEach(([rowDirection, colDirection]) => {
    const targetRow = row + rowDirection;
    const targetCol = col + colDirection;

    if (!isInsideBoard(targetRow, targetCol)) return;

    const target = getIndex(targetRow, targetCol);
    const targetPiece = currentBoard[target];

    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({ to: target });
    }
  });

  if (!includeSpecialMoves || piece.hasMoved) {
    return moves;
  }

  if (isKingInCheck(piece.color, currentBoard)) {
    return moves;
  }

  const enemyColor = getOppositeColor(piece.color);

  const kingSideRookIndex = getIndex(row, 7);
  const kingSideRook = currentBoard[kingSideRookIndex];

  const kingSideSquaresAreEmpty =
    !currentBoard[getIndex(row, 5)] && !currentBoard[getIndex(row, 6)];

  if (
    kingSideRook &&
    kingSideRook.type === "rook" &&
    kingSideRook.color === piece.color &&
    !kingSideRook.hasMoved &&
    kingSideSquaresAreEmpty &&
    !isSquareAttacked(getIndex(row, 5), enemyColor, currentBoard) &&
    !isSquareAttacked(getIndex(row, 6), enemyColor, currentBoard)
  ) {
    moves.push({
      to: getIndex(row, 6),
      castling: "king-side",
    });
  }

  const queenSideRookIndex = getIndex(row, 0);
  const queenSideRook = currentBoard[queenSideRookIndex];

  const queenSideSquaresAreEmpty =
    !currentBoard[getIndex(row, 1)] &&
    !currentBoard[getIndex(row, 2)] &&
    !currentBoard[getIndex(row, 3)];

  if (
    queenSideRook &&
    queenSideRook.type === "rook" &&
    queenSideRook.color === piece.color &&
    !queenSideRook.hasMoved &&
    queenSideSquaresAreEmpty &&
    !isSquareAttacked(getIndex(row, 3), enemyColor, currentBoard) &&
    !isSquareAttacked(getIndex(row, 2), enemyColor, currentBoard)
  ) {
    moves.push({
      to: getIndex(row, 2),
      castling: "queen-side",
    });
  }

  return moves;
};

const getPseudoMoves = (
  from,
  currentBoard = board,
  options = {
    includeSpecialMoves: true,
    targetEnPassant: enPassantTarget,
  },
) => {
  const piece = currentBoard[from];

  if (!piece) return [];

  if (piece.type === "pawn") {
    return getPawnMoves(from, currentBoard, options.targetEnPassant);
  }

  if (piece.type === "knight") {
    return getKnightMoves(from, currentBoard);
  }

  if (piece.type === "bishop") {
    return getSlidingMoves(from, currentBoard, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  }

  if (piece.type === "rook") {
    return getSlidingMoves(from, currentBoard, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  if (piece.type === "queen") {
    return getSlidingMoves(from, currentBoard, [
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
    return getKingMoves(from, currentBoard, options.includeSpecialMoves);
  }

  return [];
};

const isSquareAttacked = (
  squareIndex,
  attackingColor,
  currentBoard = board,
) => {
  for (let i = 0; i < currentBoard.length; i++) {
    const piece = currentBoard[i];

    if (!piece || piece.color !== attackingColor) continue;

    const row = getRow(i);
    const col = getCol(i);

    if (piece.type === "pawn") {
      const direction = piece.color === "white" ? -1 : 1;

      const attackSquares = [
        [row + direction, col - 1],
        [row + direction, col + 1],
      ];

      for (const [attackRow, attackCol] of attackSquares) {
        if (
          isInsideBoard(attackRow, attackCol) &&
          getIndex(attackRow, attackCol) === squareIndex
        ) {
          return true;
        }
      }
    }

    if (piece.type === "knight") {
      const knightMoves = getKnightMoves(i, currentBoard);

      if (knightMoves.some((move) => move.to === squareIndex)) {
        return true;
      }
    }

    if (piece.type === "king") {
      const kingMoves = getKingMoves(i, currentBoard, false);

      if (kingMoves.some((move) => move.to === squareIndex)) {
        return true;
      }
    }

    if (["bishop", "rook", "queen"].includes(piece.type)) {
      const directionsByPiece = {
        bishop: [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ],
        rook: [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ],
        queen: [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ],
      };

      const directions = directionsByPiece[piece.type];

      for (const [rowDirection, colDirection] of directions) {
        let targetRow = row + rowDirection;
        let targetCol = col + colDirection;

        while (isInsideBoard(targetRow, targetCol)) {
          const target = getIndex(targetRow, targetCol);

          if (target === squareIndex) {
            return true;
          }

          if (currentBoard[target]) {
            break;
          }

          targetRow += rowDirection;
          targetCol += colDirection;
        }
      }
    }
  }

  return false;
};

const findKingIndex = (color, currentBoard = board) => {
  return currentBoard.findIndex((piece) => {
    return piece && piece.type === "king" && piece.color === color;
  });
};

const isKingInCheck = (color, currentBoard = board) => {
  const kingIndex = findKingIndex(color, currentBoard);

  if (kingIndex === -1) return false;

  return isSquareAttacked(kingIndex, getOppositeColor(color), currentBoard);
};

const makeMoveOnBoard = (currentBoard, from, move) => {
  const piece = currentBoard[from];

  if (!piece) return;

  const movingPiece = {
    ...piece,
    hasMoved: true,
  };

  currentBoard[from] = null;

  if (move.enPassantCapture !== undefined) {
    currentBoard[move.enPassantCapture] = null;
  }

  currentBoard[move.to] = movingPiece;

  if (move.castling) {
    const row = getRow(move.to);

    if (move.castling === "king-side") {
      const rookFrom = getIndex(row, 7);
      const rookTo = getIndex(row, 5);

      currentBoard[rookTo] = {
        ...currentBoard[rookFrom],
        hasMoved: true,
      };

      currentBoard[rookFrom] = null;
    }

    if (move.castling === "queen-side") {
      const rookFrom = getIndex(row, 0);
      const rookTo = getIndex(row, 3);

      currentBoard[rookTo] = {
        ...currentBoard[rookFrom],
        hasMoved: true,
      };

      currentBoard[rookFrom] = null;
    }
  }

  const endRow = getRow(move.to);

  if (
    movingPiece.type === "pawn" &&
    ((movingPiece.color === "white" && endRow === 0) ||
      (movingPiece.color === "black" && endRow === 7))
  ) {
    currentBoard[move.to] = {
      type: "queen",
      color: movingPiece.color,
      hasMoved: true,
    };
  }
};

const getLegalMoves = (
  from,
  currentBoard = board,
  targetEnPassant = enPassantTarget,
) => {
  const piece = currentBoard[from];

  if (!piece) return [];

  const pseudoMoves = getPseudoMoves(from, currentBoard, {
    includeSpecialMoves: true,
    targetEnPassant,
  });

  return pseudoMoves.filter((move) => {
    const testBoard = cloneBoard(currentBoard);

    makeMoveOnBoard(testBoard, from, move);

    return !isKingInCheck(piece.color, testBoard);
  });
};

const playerHasLegalMove = (color) => {
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];

    if (!piece || piece.color !== color) continue;

    if (getLegalMoves(i).length > 0) {
      return true;
    }
  }

  return false;
};

const updateGameStatus = () => {
  playerDisplay.textContent = currentPlayer;

  const playerIsInCheck = isKingInCheck(currentPlayer);

  if (playerIsInCheck && !playerHasLegalMove(currentPlayer)) {
    infoDisplay.textContent = `Checkmate. ${getOppositeColor(currentPlayer)} wins.`;
    gameOver = true;
    return;
  }

  if (!playerIsInCheck && !playerHasLegalMove(currentPlayer)) {
    infoDisplay.textContent = "Stalemate. The game is a draw.";
    gameOver = true;
    return;
  }

  if (playerIsInCheck) {
    infoDisplay.textContent = `${currentPlayer} is in check.`;
    return;
  }

  infoDisplay.textContent = "";
};

const movePiece = (from, move) => {
  const piece = board[from];

  enPassantTarget = null;

  if (piece.type === "pawn" && Math.abs(move.to - from) === 16) {
    enPassantTarget = (from + move.to) / 2;
  }

  makeMoveOnBoard(board, from, move);

  currentPlayer = getOppositeColor(currentPlayer);

  clearMoveHighlights();
  renderBoard();
  updateGameStatus();
};

const dragStart = (event) => {
  if (gameOver) {
    event.preventDefault();
    return;
  }

  const pieceElement = event.target.closest(".piece");

  if (!pieceElement) return;

  const square = pieceElement.closest(".square");
  const from = Number(square.dataset.squareId);
  const piece = board[from];

  if (!piece || piece.color !== currentPlayer) {
    event.preventDefault();
    infoDisplay.textContent = `It is ${currentPlayer}'s turn.`;
    return;
  }

  draggedFrom = from;

  pieceElement.classList.add("dragging");

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(from));

  showMoveHighlights(from);
};

const dragEnd = (event) => {
  const pieceElement = event.target.closest(".piece");

  if (pieceElement) {
    pieceElement.classList.remove("dragging");
  }

  document.querySelectorAll(".square").forEach((square) => {
    square.classList.remove("drag-over");
  });
};

const dragOver = (event) => {
  event.preventDefault();
};

const dragEnter = (event) => {
  const square = event.target.closest(".square");

  if (square) {
    square.classList.add("drag-over");
  }
};

const dragLeave = (event) => {
  const square = event.target.closest(".square");

  if (square) {
    square.classList.remove("drag-over");
  }
};

const dragDrop = (event) => {
  event.preventDefault();

  if (gameOver) return;

  const targetSquare = event.target.closest(".square");

  if (!targetSquare) return;

  targetSquare.classList.remove("drag-over");

  const to = Number(targetSquare.dataset.squareId);
  const from =
    Number(event.dataTransfer.getData("text/plain")) || Number(draggedFrom);

  const piece = board[from];

  if (!piece) {
    clearMoveHighlights();
    return;
  }

  if (piece.color !== currentPlayer) {
    infoDisplay.textContent = `It is ${currentPlayer}'s turn.`;
    clearMoveHighlights();
    return;
  }

  const legalMoves = getLegalMoves(from);
  const selectedMove = legalMoves.find((move) => move.to === to);

  if (!selectedMove) {
    infoDisplay.textContent = "Illegal move.";
    clearMoveHighlights();
    renderBoard();
    return;
  }

  movePiece(from, selectedMove);
};

const restartGame = () => {
  board = createStartBoard();
  currentPlayer = "white";
  draggedFrom = null;
  gameOver = false;
  enPassantTarget = null;

  renderBoard();
  updateGameStatus();
};

chessBoard.addEventListener("dragstart", dragStart);
chessBoard.addEventListener("dragend", dragEnd);
chessBoard.addEventListener("dragover", dragOver);
chessBoard.addEventListener("dragenter", dragEnter);
chessBoard.addEventListener("dragleave", dragLeave);
chessBoard.addEventListener("drop", dragDrop);

restartButton.addEventListener("click", restartGame);

createBoardSquares();
renderBoard();
updateGameStatus();
