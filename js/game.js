import { state } from "./state.js";
import { saveState, loadState } from "./persist.js";
import { createInitialBoard } from "./board/setup.js";
import { oppositeColor, capitalize, toSquareName } from "./board/helpers.js";
import { isKingInCheck } from "./board/check.js";
import { applyMoveToBoard } from "./board/apply-move.js";
import {
  getAllLegalMovesForColor,
  getLegalMovesForPiece,
} from "./board/legal-moves.js";
import { renderBoard } from "./ui/board.js";
import { renderPanel } from "./ui/panel.js";
import { showEndScreen } from "./ui/end-screen.js";

// ── History helpers ───────────────────────────────────────

const deepCopyBoard = (board) => board.map(row => row.map(p => p ? { ...p } : null));

// ── Bot Web Worker ────────────────────────────────────────
const botWorker = new Worker(new URL("./bot/worker.js", import.meta.url), { type: "module" });

botWorker.onmessage = ({ data }) => {
  const { result, jobId } = data;
  if (jobId !== state.botJobId) return;

  const botColor = oppositeColor(state.playerColor);
  if (state.gameOver || state.gameMode !== "bot" || state.currentTurn !== botColor) return;

  if (!result?.move) {
    state.botThinking = false;
    render();
    return;
  }

  const elapsed = performance.now() - botMoveStartTime;
  const remaining = BOT_MIN_DELAY_MS - elapsed;

  const playMove = () => {
    state.botThinking = false;
    executeMove(result.move.from.row, result.move.from.col, result.move.to);
  };

  if (remaining > 0) {
    setTimeout(playMove, remaining);
  } else {
    playMove();
  }
};

botWorker.onerror = () => {
  state.botThinking = false;
  render();
};

// ── Render ────────────────────────────────────────────────

const render = () => {
  renderBoard(state, {
    onSquareClick: handleSquareClick,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDrop: handleDrop,
  });
  renderPanel(state);
  updateBoardOverlay();
  updateGameAreaFlip();
};

const updateBoardOverlay = () => {
  const overlay = document.getElementById("boardOverlay");

  if (state.overlayVisible) {
    overlay.className = "board-overlay board-overlay--setup";
    document
      .getElementById("overlayHumanBtn")
      .classList.toggle("active", state.gameMode === "human");
    document
      .getElementById("overlayBotBtn")
      .classList.toggle("active", state.gameMode === "bot");
    document
      .getElementById("overlayCloseBtn")
      .classList.toggle("hidden", !state.gameStarted);

    document.getElementById("playAsSelector").classList.remove("hidden");
    document.getElementById("playAsWhiteBtn").classList.toggle("active", state.playerColorChoice === "white");
    document.getElementById("playAsRandomBtn").classList.toggle("active", state.playerColorChoice === "random");
    document.getElementById("playAsBlackBtn").classList.toggle("active", state.playerColorChoice === "black");
  } else {
    overlay.className = "board-overlay board-overlay--hidden";
  }
};

const updateGameAreaFlip = () => {
  const gameArea = document.querySelector(".game-area");
  gameArea.classList.toggle("game-area--flipped", state.playerColor === "black");
};

// ── Public actions ────────────────────────────────────────

export const initializeApp = () => {
  const saved = loadState();

  if (saved && saved.gameStarted) {
    Object.assign(state, saved);
    state.selectedSquare      = null;
    state.legalMovesForSelected = [];
    state.botThinking         = false;
    state.botJobId            = 0;
    state.animateMove         = false;
    state.overlayVisible      = false;
    state.reviewIndex         = null;
    if (!state.positionHistory) state.positionHistory = [];
    render();
    runBotIfNeeded();
    return;
  }

  state.board = createInitialBoard();
  state.currentTurn = "white";
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  state.capturedPieces = { white: [], black: [] };
  state.lastMove = null;
  state.enPassantTarget = null;
  state.moveHistory = [];
  state.positionHistory = [];
  state.reviewIndex = null;
  state.statusMessage = "White to move.";
  state.gameOver = false;
  state.winner = null;
  state.botThinking = false;
  state.overlayVisible = true;
  state.gameStarted = false;
  render();
};

export const startNewGame = () => {
  state.botJobId += 1;
  state.board = createInitialBoard();
  state.currentTurn = "white";
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  state.capturedPieces = { white: [], black: [] };
  state.lastMove = null;
  state.enPassantTarget = null;
  state.moveHistory = [];
  state.positionHistory = [];
  state.reviewIndex     = null;
  state.statusMessage = "White to move.";
  state.gameOver = false;
  state.winner = null;
  state.botThinking = false;
  state.overlayVisible = false;
  state.gameStarted = true;

  state.playerColor =
    state.playerColorChoice === "random"
      ? Math.random() < 0.5 ? "white" : "black"
      : state.playerColorChoice;

  clearTimeout(endScreenTimeout);
  document.getElementById("endScreen").classList.add("hidden");
  render();
  saveState(state);
  showStartFlash();
  runBotIfNeeded();
};

let endScreenTimeout = null;

const queueEndScreen = (winner, title, description) => {
  state.winner = winner;
  render();
  endScreenTimeout = window.setTimeout(() => {
    showEndScreen(winner, title, description);
  }, 3000);
};

const showStartFlash = () => {
  const el   = document.getElementById("startFlash");
  const text = el.querySelector(".start-flash-text");

  el.classList.remove("hidden");
  text.style.animation = "none";
  void text.offsetWidth;
  text.style.animation = "";

  text.addEventListener("animationend", () => el.classList.add("hidden"), { once: true });
};

export const showSetupOverlay = () => {
  state.botJobId += 1;
  state.botThinking = false;
  state.overlayVisible = true;
  state.winner = null;
  state.reviewIndex = null;
  clearTimeout(endScreenTimeout);
  render();
};

export const closeSetupOverlay = () => {
  state.overlayVisible = false;
  render();
};

export const selectMode = (mode) => {
  state.gameMode = mode;
  updateBoardOverlay();
};

export const selectPlayerColor = (choice) => {
  state.playerColorChoice = choice;
  updateBoardOverlay();
};

export const resign = () => {
  if (state.gameOver || state.overlayVisible || state.moveHistory.length === 0)
    return;

  state.reviewIndex = null;

  state.botJobId += 1;
  state.botThinking = false;

  const loser = state.gameMode === "bot" ? state.playerColor : state.currentTurn;
  const winner = oppositeColor(loser);

  state.gameOver = true;
  state.winner = winner;
  state.statusMessage = `${capitalize(loser)} resigned.`;

  render();
  saveState(state);
  queueEndScreen(winner, `${capitalize(winner)} wins`, `${capitalize(loser)} resigned.`);
};

// ── Input handlers ────────────────────────────────────────

const handleSquareClick = (row, col) => {
  if (state.reviewIndex !== null) return;
  if (state.gameOver || state.botThinking) return;
  if (state.gameMode === "bot" && state.currentTurn !== state.playerColor) return;

  const piece = state.board[row][col];

  if (state.selectedSquare) {
    const targetMove = state.legalMovesForSelected.find(
      (move) => move.row === row && move.col === col,
    );

    if (targetMove) {
      executeMove(
        state.selectedSquare.row,
        state.selectedSquare.col,
        targetMove,
      );
      return;
    }

    if (piece && piece.color === state.currentTurn) {
      selectPiece(row, col);
      return;
    }

    clearSelection();
    return;
  }

  if (piece && piece.color === state.currentTurn) {
    selectPiece(row, col);
  }
};

const handleDragStart = (row, col) => {
  if (state.reviewIndex !== null) return;
  if (state.gameOver || state.botThinking) return;
  if (state.gameMode === "bot" && state.currentTurn !== state.playerColor) return;
  state.selectedSquare = { row, col };
  state.legalMovesForSelected = getLegalMovesForPiece(
    state.board,
    row,
    col,
    state.currentTurn,
    state.enPassantTarget,
  );
  setTimeout(render, 0);
};

const handleDragEnd = () => {
  if (!state.gameOver && state.selectedSquare) clearSelection();
};

const handleDrop = (row, col, sourceRow, sourceCol) => {
  if (state.reviewIndex !== null) return;
  if (state.gameOver || state.botThinking) return;

  const legalMoves = getLegalMovesForPiece(
    state.board,
    sourceRow,
    sourceCol,
    state.currentTurn,
    state.enPassantTarget,
  );
  const targetMove = legalMoves.find(
    (move) => move.row === row && move.col === col,
  );

  if (targetMove) {
    executeMove(sourceRow, sourceCol, targetMove);
  } else {
    clearSelection();
  }
};

// ── Game logic ────────────────────────────────────────────

const selectPiece = (row, col) => {
  state.selectedSquare = { row, col };
  state.legalMovesForSelected = getLegalMovesForPiece(
    state.board,
    row,
    col,
    state.currentTurn,
    state.enPassantTarget,
  );
  render();
};

const clearSelection = () => {
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  render();
};

const executeMove = (fromRow, fromCol, move) => {
  const movingPiece = state.board[fromRow][fromCol];
  const originalType = movingPiece.type;
  const originalColor = movingPiece.color;
  const fromName = toSquareName(fromRow, fromCol);
  const toName = toSquareName(move.row, move.col);

  const capturedPiece = applyMoveToBoard(state.board, fromRow, fromCol, move);
  if (capturedPiece) {
    state.capturedPieces[capturedPiece.color].push(capturedPiece.type);
  }

  const landedPiece = state.board[move.row][move.col];
  let didPromote = false;
  if (landedPiece.type === "pawn" && (move.row === 0 || move.row === 7)) {
    landedPiece.type = "queen";
    didPromote = true;
  }

  state.lastMove = {
    from: { row: fromRow, col: fromCol },
    to: { row: move.row, col: move.col },
  };

  state.enPassantTarget = null;
  if (originalType === "pawn" && Math.abs(move.row - fromRow) === 2) {
    state.enPassantTarget = {
      row: (fromRow + move.row) / 2,
      col: fromCol,
      capturedRow: move.row,
      capturedCol: fromCol,
    };
  }

  state.moveHistory.push(
    buildMoveDescription({
      color: originalColor,
      type: originalType,
      fromName,
      toName,
      capturedPiece,
      didPromote,
      special: move.special,
    }),
  );

  state.currentTurn = oppositeColor(state.currentTurn);
  state.positionHistory.push({
    board: deepCopyBoard(state.board),
    currentTurn: state.currentTurn,
    enPassantTarget: state.enPassantTarget,
    capturedPieces: { white: [...state.capturedPieces.white], black: [...state.capturedPieces.black] },
    lastMove: state.lastMove,
  });

  state.selectedSquare = null;
  state.legalMovesForSelected = [];

  updateGameStatus(originalColor);
  state.animateMove = true;
  render();
  saveState(state);
  runBotIfNeeded();
};

const buildMoveDescription = ({
  color,
  type,
  fromName,
  toName,
  capturedPiece,
  didPromote,
  special,
}) => {
  if (special === "castleKing") return `${capitalize(color)} castles kingside.`;
  if (special === "castleQueen")
    return `${capitalize(color)} castles queenside.`;

  let text = `${capitalize(color)} ${capitalize(type)} ${fromName} → ${toName}`;
  if (capturedPiece) text += ` captures ${capitalize(capturedPiece.type)}`;
  if (didPromote) text += " and promotes to Queen";

  return `${text}.`;
};

const updateGameStatus = (lastPlayerToMove) => {
  const nextPlayerMoves = getAllLegalMovesForColor(
    state.board,
    state.currentTurn,
    state.enPassantTarget,
  );
  const nextPlayerInCheck = isKingInCheck(state.board, state.currentTurn);

  if (nextPlayerMoves.length === 0 && nextPlayerInCheck) {
    state.gameOver = true;
    state.statusMessage = `Checkmate. ${capitalize(lastPlayerToMove)} wins.`;
    queueEndScreen(
      lastPlayerToMove,
      `${capitalize(lastPlayerToMove)} wins`,
      `Checkmate. ${capitalize(state.currentTurn)} has no legal moves left.`,
    );
    return;
  }

  if (nextPlayerMoves.length === 0) {
    state.gameOver = true;
    state.statusMessage = "Stalemate. The game is a draw.";
    queueEndScreen(
      null,
      "Draw",
      "Stalemate — the player to move has no legal moves but is not in check.",
    );
    return;
  }

  if (nextPlayerInCheck) {
    state.statusMessage = `${capitalize(state.currentTurn)} is in check. ${capitalize(state.currentTurn)} to move.`;
    return;
  }

  const botColor = oppositeColor(state.playerColor);
  if (state.gameMode === "bot" && state.currentTurn === botColor) {
    state.statusMessage = "Bot is thinking.";
    return;
  }

  state.statusMessage = `${capitalize(state.currentTurn)} to move.`;
};

let botMoveStartTime = 0;
const BOT_MIN_DELAY_MS = 500;

const runBotIfNeeded = () => {
  if (state.gameOver) return;
  if (state.gameMode !== "bot") return;

  const botColor = oppositeColor(state.playerColor);
  if (state.currentTurn !== botColor) return;

  state.botThinking = true;
  state.statusMessage = "Bot is thinking.";
  botMoveStartTime = performance.now();
  render();

  const jobId = ++state.botJobId;

  botWorker.postMessage({
    board: state.board,
    color: botColor,
    enPassantTarget: state.enPassantTarget,
    timeLimitMs: 1500,
    jobId,
  });
};

// ── Move history navigation ───────────────────────────────

export const goToMove = (index) => {
  if (index < 0 || index >= state.positionHistory.length) return;
  state.reviewIndex = index;
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  render();
};

export const goToPreviousMove = () => {
  if (state.positionHistory.length === 0) return;
  if (state.reviewIndex === 0) return;
  state.reviewIndex = state.reviewIndex === null
    ? state.positionHistory.length - 1
    : state.reviewIndex - 1;
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  render();
};

export const goToNextMove = () => {
  if (state.reviewIndex === null) return;
  if (state.reviewIndex >= state.positionHistory.length - 1) return;
  state.reviewIndex += 1;
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  render();
};

export const goToLivePosition = () => {
  state.reviewIndex = null;
  state.selectedSquare = null;
  state.legalMovesForSelected = [];
  render();
};
