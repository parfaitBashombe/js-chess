import { files, icons, values } from "./constants.js";
import {
  capitalize,
  cloneBoard,
  createInitialBoard,
  getAllLegalMoves,
  getLegalMovesFor,
  isInCheck,
  movePieceOnBoard,
  opposite,
  pieceName,
  squareName,
} from "./engine.js";
import { getBotMove } from "./bot.js";

const boardEl = document.getElementById("board");
const statusText = document.getElementById("statusText");
const turnBadge = document.getElementById("turnBadge");
const whitePlayer = document.getElementById("whitePlayer");
const blackPlayer = document.getElementById("blackPlayer");
const blackSub = document.getElementById("blackSub");
const whiteCapturedEl = document.getElementById("whiteCaptured");
const blackCapturedEl = document.getElementById("blackCaptured");
const whiteScoreEl = document.getElementById("whiteScore");
const blackScoreEl = document.getElementById("blackScore");
const moveHistoryEl = document.getElementById("moveHistory");
const resetBtn = document.getElementById("resetBtn");
const endScreen = document.getElementById("endScreen");
const winnerIcon = document.getElementById("winnerIcon");
const winnerTitle = document.getElementById("winnerTitle");
const winnerText = document.getElementById("winnerText");
const playAgainBtn = document.getElementById("playAgainBtn");
const humanModeBtn = document.getElementById("humanModeBtn");
const botModeBtn = document.getElementById("botModeBtn");

let board;
let currentTurn;
let selected;
let legalMoves;
let captured;
let lastMove;
let enPassantTarget;
let moveHistory;
let statusMessage;
let gameOver;
let gameMode = "human";
let botThinking = false;

const startNewGame = () => {
  board = createInitialBoard();
  currentTurn = "white";
  selected = null;
  legalMoves = [];
  captured = {
    white: [],
    black: [],
  };
  lastMove = null;
  enPassantTarget = null;
  moveHistory = [];
  statusMessage = "White to move.";
  gameOver = false;
  botThinking = false;

  endScreen.classList.add("hidden");
  render();
};

const render = () => {
  renderBoard();
  renderPanel();
};

const renderBoard = () => {
  boardEl.innerHTML = "";

  const whiteInCheck = isInCheck(board, "white");
  const blackInCheck = isInCheck(board, "black");

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      const isLight = (row + col) % 2 === 0;
      const move = legalMoves.find(
        (item) => item.row === row && item.col === col,
      );
      const piece = board[row][col];

      square.className = `square ${isLight ? "light" : "dark"}`;
      square.dataset.row = row;
      square.dataset.col = col;
      square.tabIndex = 0;
      square.setAttribute("role", "button");
      square.setAttribute("aria-label", squareName(row, col));

      if (lastMove && lastMove.from.row === row && lastMove.from.col === col) {
        square.classList.add("last-move");
      }

      if (lastMove && lastMove.to.row === row && lastMove.to.col === col) {
        square.classList.add("last-move");
      }

      if (selected && selected.row === row && selected.col === col) {
        square.classList.add("selected");
      }

      if (move) {
        square.classList.add(move.capture ? "capture" : "legal");
      }

      if (piece && piece.type === "king") {
        if (
          (piece.color === "white" && whiteInCheck) ||
          (piece.color === "black" && blackInCheck)
        ) {
          square.classList.add("check");
        }
      }

      if (col === 0) {
        const rank = document.createElement("span");
        rank.className = "rank-label";
        rank.textContent = 8 - row;
        square.appendChild(rank);
      }

      if (row === 7) {
        const file = document.createElement("span");
        file.className = "file-label";
        file.textContent = files[col];
        square.appendChild(file);
      }

      square.addEventListener("click", () => handleSquareClick(row, col));

      square.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSquareClick(row, col);
        }
      });

      square.addEventListener("dragover", (event) => {
        if (
          selected &&
          legalMoves.some((item) => item.row === row && item.col === col)
        ) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      });

      square.addEventListener("drop", (event) => {
        event.preventDefault();

        if (gameOver || botThinking) return;

        const data = event.dataTransfer.getData("text/plain");
        const source = data ? JSON.parse(data) : selected;

        if (!source) return;

        const moves = getLegalMovesFor(
          board,
          source.row,
          source.col,
          currentTurn,
          enPassantTarget,
        );
        const targetMove = moves.find(
          (item) => item.row === row && item.col === col,
        );

        if (targetMove) {
          makeMove(source.row, source.col, targetMove);
        } else {
          clearSelection();
        }
      });

      if (piece) {
        const pieceEl = document.createElement("div");
        const canHumanMove =
          piece.color === currentTurn &&
          !gameOver &&
          !botThinking &&
          !(gameMode === "bot" && currentTurn === "black");

        pieceEl.className = `piece ${piece.color}`;
        pieceEl.textContent = icons[piece.color][piece.type];
        pieceEl.draggable = canHumanMove;
        pieceEl.setAttribute("aria-label", `${piece.color} ${piece.type}`);

        pieceEl.addEventListener("dragstart", (event) => {
          if (!canHumanMove) {
            event.preventDefault();
            return;
          }

          selected = { row, col };
          legalMoves = getLegalMovesFor(
            board,
            row,
            col,
            currentTurn,
            enPassantTarget,
          );

          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({ row, col }),
          );

          setTimeout(renderBoard, 0);
        });

        pieceEl.addEventListener("dragend", () => {
          if (!gameOver && selected) {
            clearSelection();
          }
        });

        square.appendChild(pieceEl);
      }

      boardEl.appendChild(square);
    }
  }
};

const renderPanel = () => {
  statusText.textContent = statusMessage;
  turnBadge.textContent = gameOver
    ? "Game over"
    : `${capitalize(currentTurn)} to move`;

  blackSub.textContent = gameMode === "bot" ? "Bot" : "Player 2";

  humanModeBtn.classList.toggle("active", gameMode === "human");
  botModeBtn.classList.toggle("active", gameMode === "bot");

  whitePlayer.classList.toggle("active", currentTurn === "white" && !gameOver);
  blackPlayer.classList.toggle("active", currentTurn === "black" && !gameOver);

  whitePlayer.querySelector(".player-status").textContent =
    currentTurn === "white" && !gameOver ? "Thinking" : "Waiting";

  blackPlayer.querySelector(".player-status").textContent =
    currentTurn === "black" && !gameOver
      ? gameMode === "bot"
        ? "Bot"
        : "Thinking"
      : "Waiting";

  whiteCapturedEl.innerHTML = renderCaptured(captured.black, "black");
  blackCapturedEl.innerHTML = renderCaptured(captured.white, "white");

  whiteScoreEl.textContent = `${captured.black.reduce((sum, type) => sum + values[type], 0)} pts`;
  blackScoreEl.textContent = `${captured.white.reduce((sum, type) => sum + values[type], 0)} pts`;

  renderMoveHistory();
};

const renderMoveHistory = () => {
  if (!moveHistory.length) {
    moveHistoryEl.innerHTML = `<p class="empty-text">No moves yet.</p>`;
    return;
  }

  moveHistoryEl.innerHTML = moveHistory
    .slice(0, 8)
    .map(
      (move, index) => `
        <div class="history-item">
          <span class="history-number">${String(index + 1).padStart(2, "0")}</span>
          <span>${move}</span>
        </div>
      `,
    )
    .join("");
};

const renderCaptured = (pieces, color) => {
  if (!pieces.length) {
    return `<span class="empty-text">None</span>`;
  }

  return pieces
    .map(
      (type) =>
        `<span class="captured-piece ${color}">${icons[color][type]}</span>`,
    )
    .join("");
};

const handleSquareClick = (row, col) => {
  if (gameOver || botThinking) return;
  if (gameMode === "bot" && currentTurn === "black") return;

  const piece = board[row][col];

  if (selected) {
    const targetMove = legalMoves.find(
      (move) => move.row === row && move.col === col,
    );

    if (targetMove) {
      makeMove(selected.row, selected.col, targetMove);
      return;
    }

    if (piece && piece.color === currentTurn) {
      selectSquare(row, col);
      return;
    }

    clearSelection();
    return;
  }

  if (piece && piece.color === currentTurn) {
    selectSquare(row, col);
  }
};

const selectSquare = (row, col) => {
  selected = { row, col };
  legalMoves = getLegalMovesFor(board, row, col, currentTurn, enPassantTarget);
  render();
};

const clearSelection = () => {
  selected = null;
  legalMoves = [];
  render();
};

const makeMove = (fromRow, fromCol, move) => {
  const movingPiece = board[fromRow][fromCol];
  const oldType = movingPiece.type;
  const oldColor = movingPiece.color;
  const fromName = squareName(fromRow, fromCol);
  const toName = squareName(move.row, move.col);
  const capturedPiece = movePieceOnBoard(board, fromRow, fromCol, move);

  if (capturedPiece) {
    captured[capturedPiece.color].push(capturedPiece.type);
  }

  const movedPiece = board[move.row][move.col];
  let promoted = false;

  if (movedPiece.type === "pawn" && (move.row === 0 || move.row === 7)) {
    movedPiece.type = "queen";
    promoted = true;
  }

  lastMove = {
    from: { row: fromRow, col: fromCol },
    to: { row: move.row, col: move.col },
  };

  enPassantTarget = null;

  if (oldType === "pawn" && Math.abs(move.row - fromRow) === 2) {
    enPassantTarget = {
      row: (fromRow + move.row) / 2,
      col: fromCol,
      capturedRow: move.row,
      capturedCol: fromCol,
    };
  }

  moveHistory.push(
    createMoveText({
      color: oldColor,
      type: oldType,
      from: fromName,
      to: toName,
      capturedPiece,
      promoted,
      special: move.special,
    }),
  );

  currentTurn = opposite(currentTurn);
  selected = null;
  legalMoves = [];

  updateGameStatus(oldColor);
  render();
  runBotIfNeeded();
};

const createMoveText = ({
  color,
  type,
  from,
  to,
  capturedPiece,
  promoted,
  special,
}) => {
  if (special === "castleKing") {
    return `${capitalize(color)} castles kingside.`;
  }

  if (special === "castleQueen") {
    return `${capitalize(color)} castles queenside.`;
  }

  let text = `${capitalize(color)} ${pieceName(type)} ${from} → ${to}`;

  if (capturedPiece) {
    text += ` captures ${pieceName(capturedPiece.type)}`;
  }

  if (promoted) {
    text += " and promotes to Queen";
  }

  return `${text}.`;
};

const updateGameStatus = (lastMover) => {
  const allMoves = getAllLegalMoves(board, currentTurn, enPassantTarget);
  const checked = isInCheck(board, currentTurn);

  if (allMoves.length === 0 && checked) {
    gameOver = true;
    statusMessage = `Checkmate. ${capitalize(lastMover)} wins.`;
    showEndScreen(
      lastMover,
      `${capitalize(lastMover)} wins`,
      `Checkmate. ${capitalize(currentTurn)} has no legal move left.`,
    );
    return;
  }

  if (allMoves.length === 0) {
    gameOver = true;
    statusMessage = "Stalemate. The game is a draw.";
    showEndScreen(
      null,
      "Draw",
      "Stalemate. The player to move has no legal move, but is not in check.",
    );
    return;
  }

  if (checked) {
    statusMessage = `${capitalize(currentTurn)} is in check. ${capitalize(currentTurn)} to move.`;
    return;
  }

  if (gameMode === "bot" && currentTurn === "black") {
    statusMessage = "Bot is thinking.";
    return;
  }

  statusMessage = `${capitalize(currentTurn)} to move.`;
};

const showEndScreen = (winner, title, text) => {
  winnerIcon.className = `winner-icon ${winner || "white"}`;
  winnerIcon.textContent = winner ? icons[winner].king : "½";
  winnerTitle.textContent = title;
  winnerText.textContent = text;
  endScreen.classList.remove("hidden");
};

const runBotIfNeeded = () => {
  if (gameOver) return;
  if (gameMode !== "bot") return;
  if (currentTurn !== "black") return;

  botThinking = true;
  statusMessage = "Bot is thinking.";
  render();

  window.setTimeout(() => {
    const botMove = getBotMove(cloneBoard(board), "black", enPassantTarget);

    botThinking = false;

    if (!botMove) return;

    makeMove(botMove.from.row, botMove.from.col, botMove.to);
  }, 350);
};

const setGameMode = (mode) => {
  gameMode = mode;
  startNewGame();
};

humanModeBtn.addEventListener("click", () => setGameMode("human"));
botModeBtn.addEventListener("click", () => setGameMode("bot"));
resetBtn.addEventListener("click", startNewGame);
playAgainBtn.addEventListener("click", startNewGame);

startNewGame();
