const STORAGE_KEY = "chess-arena-state";

// Only these fields survive a page refresh — transient UI state is excluded.
const PERSISTENT_FIELDS = [
  "board",
  "currentTurn",
  "capturedPieces",
  "lastMove",
  "enPassantTarget",
  "moveHistory",
  "positionHistory",
  "statusMessage",
  "gameOver",
  "winner",
  "gameMode",
  "playerColorChoice",
  "playerColor",
  "gameStarted",
  "halfMoveClock",
];

export const saveState = (state) => {
  try {
    const snapshot = {};
    for (const key of PERSISTENT_FIELDS) snapshot[key] = state[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (_) {}
};

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};
