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

const slidingDirections = {
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
  return row >= 0 && row < 8 && col >= 0 && col < 8;
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
    const row = getRow(i);
    const col = getCol(i);

    square.classList.add("square");
    square.classList.add((row + col) % 2 === 0 ? "beige" : "brown");
    square.dataset.squareId = String(i);

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
  pieceElement.draggable = true;

  return pieceElement;
};

const renderBoard = () => {
  const squares = document.querySelectorAll(".square");

  squares.forEach((square, index) => {
    square.innerHTML = "";
    square.classList.remove("drag-over", "legal-move", "legal-capture");

    const piece = board[index];

    if (piece) {
      square.append(renderPiece(piece));
    }
  });
};

const clearHighlights = () => {
  document.querySelectorAll(".square").forEach((square) => {
    square.classList.remove("drag-over", "legal-move", "legal-capture");
  });
};

const highlightMoves = (from) => {
  clearHighlights();

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

const getStepMoves = (from, currentBoard, steps, onlyAttacks = false) => {
  const moves = [];
  const piece = currentBoard[from];
  const row = getRow(from);
  const col = getCol(from);

  steps.forEach(([rowChange, colChange]) => {
    const targetRow = row + rowChange;
    const targetCol = col + colChange;

    if (!isInsideBoard(targetRow, targetCol)) return;

    const target = getIndex(targetRow, targetCol);
    const targetPiece = currentBoard[target];

    if (onlyAttacks || !targetPiece || targetPiece.color !== piece.color) {
      moves.push({ to: target });
    }
  });

  return moves;
};

const getSlidingMoves = (
  from,
  currentBoard,
  directions,
  onlyAttacks = false,
) => {
  const moves = [];
  const piece = currentBoard[from];
  const startRow = getRow(from);
  const startCol = getCol(from);

  directions.forEach(([rowChange, colChange]) => {
    let row = startRow + rowChange;
    let col = startCol + colChange;

    while (isInsideBoard(row, col)) {
      const target = getIndex(row, col);
      const targetPiece = currentBoard[target];

      if (!targetPiece) {
        moves.push({ to: target });
      } else {
        if (onlyAttacks || targetPiece.color !== piece.color) {
          moves.push({ to: target });
        }

        break;
      }

      row += rowChange;
      col += colChange;
    }
  });

  return moves;
};

const getPawnMoves = (
  from,
  currentBoard,
  onlyAttacks = false,
  targetEnPassant = enPassantTarget,
) => {
  const moves = [];
  const piece = currentBoard[from];
  const row = getRow(from);
  const col = getCol(from);

  const direction = piece.color === "white" ? -1 : 1;
  const startRow = piece.color === "white" ? 6 : 1;

  [-1, 1].forEach((colChange) => {
    const attackRow = row + direction;
    const attackCol = col + colChange;

    if (!isInsideBoard(attackRow, attackCol)) return;

    const attackIndex = getIndex(attackRow, attackCol);
    const targetPiece = currentBoard[attackIndex];

    if (onlyAttacks) {
      moves.push({ to: attackIndex });
      return;
    }

    if (targetPiece && targetPiece.color !== piece.color) {
      moves.push({ to: attackIndex });
    }

    if (targetEnPassant === attackIndex && !targetPiece) {
      const capturedPawnIndex =
        piece.color === "white" ? attackIndex + width : attackIndex - width;

      const capturedPawn = currentBoard[capturedPawnIndex];

      if (
        capturedPawn &&
        capturedPawn.type === "pawn" &&
        capturedPawn.color !== piece.color
      ) {
        moves.push({
          to: attackIndex,
          enPassantCapture: capturedPawnIndex,
        });
      }
    }
  });

  if (onlyAttacks) {
    return moves;
  }

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

  return moves;
};

const getCastlingMoves = (from, currentBoard) => {
  const moves = [];
  const kingPiece = currentBoard[from];

  if (!kingPiece || kingPiece.type !== "king" || kingPiece.hasMoved) {
    return moves;
  }

  if (isKingInCheck(kingPiece.color, currentBoard)) {
    return moves;
  }

  const row = getRow(from);
  const enemyColor = getOppositeColor(kingPiece.color);

  const kingSideRookIndex = getIndex(row, 7);
  const kingSideRook = currentBoard[kingSideRookIndex];

  if (
    kingSideRook &&
    kingSideRook.type === "rook" &&
    kingSideRook.color === kingPiece.color &&
    !kingSideRook.hasMoved &&
    !currentBoard[getIndex(row, 5)] &&
    !currentBoard[getIndex(row, 6)] &&
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

  if (
    queenSideRook &&
    queenSideRook.type === "rook" &&
    queenSideRook.color === kingPiece.color &&
    !queenSideRook.hasMoved &&
    !currentBoard[getIndex(row, 1)] &&
    !currentBoard[getIndex(row, 2)] &&
    !currentBoard[getIndex(row, 3)] &&
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

const getMovesForPiece = (from, currentBoard = board, options = {}) => {
  const piece = currentBoard[from];

  if (!piece) return [];

  const onlyAttacks = options.onlyAttacks || false;
  const includeSpecialMoves = options.includeSpecialMoves ?? true;
  const targetEnPassant = options.targetEnPassant ?? enPassantTarget;

  if (piece.type === "pawn") {
    return getPawnMoves(from, currentBoard, onlyAttacks, targetEnPassant);
  }

  if (piece.type === "knight") {
    return getStepMoves(from, currentBoard, knightJumps, onlyAttacks);
  }

  if (piece.type === "bishop") {
    return getSlidingMoves(
      from,
      currentBoard,
      slidingDirections.bishop,
      onlyAttacks,
    );
  }

  if (piece.type === "rook") {
    return getSlidingMoves(
      from,
      currentBoard,
      slidingDirections.rook,
      onlyAttacks,
    );
  }

  if (piece.type === "queen") {
    return getSlidingMoves(
      from,
      currentBoard,
      slidingDirections.queen,
      onlyAttacks,
    );
  }

  if (piece.type === "king") {
    const normalKingMoves = getStepMoves(
      from,
      currentBoard,
      kingSteps,
      onlyAttacks,
    );

    if (onlyAttacks || !includeSpecialMoves) {
      return normalKingMoves;
    }

    return [...normalKingMoves, ...getCastlingMoves(from, currentBoard)];
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

    const attackingMoves = getMovesForPiece(i, currentBoard, {
      onlyAttacks: true,
      includeSpecialMoves: false,
      targetEnPassant: null,
    });

    if (attackingMoves.some((move) => move.to === squareIndex)) {
      return true;
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

  currentBoard[from] = null;

  if (move.enPassantCapture !== undefined) {
    currentBoard[move.enPassantCapture] = null;
  }

  currentBoard[move.to] = {
    ...piece,
    hasMoved: true,
  };

  if (move.castling === "king-side") {
    const row = getRow(move.to);
    const rookFrom = getIndex(row, 7);
    const rookTo = getIndex(row, 5);

    currentBoard[rookTo] = {
      ...currentBoard[rookFrom],
      hasMoved: true,
    };

    currentBoard[rookFrom] = null;
  }

  if (move.castling === "queen-side") {
    const row = getRow(move.to);
    const rookFrom = getIndex(row, 0);
    const rookTo = getIndex(row, 3);

    currentBoard[rookTo] = {
      ...currentBoard[rookFrom],
      hasMoved: true,
    };

    currentBoard[rookFrom] = null;
  }

  const movedPiece = currentBoard[move.to];
  const endRow = getRow(move.to);

  if (
    movedPiece.type === "pawn" &&
    ((movedPiece.color === "white" && endRow === 0) ||
      (movedPiece.color === "black" && endRow === 7))
  ) {
    currentBoard[move.to] = {
      type: "queen",
      color: movedPiece.color,
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

  const moves = getMovesForPiece(from, currentBoard, {
    onlyAttacks: false,
    includeSpecialMoves: true,
    targetEnPassant,
  });

  return moves.filter((move) => {
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

  const isInCheck = isKingInCheck(currentPlayer);

  if (isInCheck && !playerHasLegalMove(currentPlayer)) {
    infoDisplay.textContent = `Checkmate. ${getOppositeColor(currentPlayer)} wins.`;
    gameOver = true;
    return;
  }

  if (!isInCheck && !playerHasLegalMove(currentPlayer)) {
    infoDisplay.textContent = "Stalemate. Draw.";
    gameOver = true;
    return;
  }

  if (isInCheck) {
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

  clearHighlights();
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

  highlightMoves(from);
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

  const dragData = event.dataTransfer.getData("text/plain");
  const from = dragData === "" ? draggedFrom : Number(dragData);
  const to = Number(targetSquare.dataset.squareId);

  const piece = board[from];

  if (!piece) {
    clearHighlights();
    return;
  }

  if (piece.color !== currentPlayer) {
    infoDisplay.textContent = `It is ${currentPlayer}'s turn.`;
    clearHighlights();
    return;
  }

  const legalMoves = getLegalMoves(from);
  const selectedMove = legalMoves.find((move) => move.to === to);

  if (!selectedMove) {
    infoDisplay.textContent = "Illegal move.";
    clearHighlights();
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
