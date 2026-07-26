// Killer moves and history heuristic tables.
// Kept in a separate module to avoid circular imports between search.js and order-moves.js.

const MAX_DEPTH = 30;
const killers = Array.from({ length: MAX_DEPTH }, () => [null, null]);

export const resetKillers = () =>
  killers.forEach((k) => {
    k[0] = k[1] = null;
  });

export const storeKiller = (depth, move) => {
  if (depth >= MAX_DEPTH || move.to.capture || move.to.special === "enPassant")
    return;
  const [k0] = killers[depth];
  if (!movesEqual(k0, move)) {
    killers[depth][1] = killers[depth][0];
    killers[depth][0] = move;
  }
};

export const isKiller = (depth, move) => {
  if (depth >= MAX_DEPTH || move.to.capture) return false;
  const [k0, k1] = killers[depth];
  return movesEqual(k0, move) || movesEqual(k1, move);
};

const movesEqual = (a, b) =>
  a &&
  b &&
  a.from.row === b.from.row &&
  a.from.col === b.from.col &&
  a.to.row === b.to.row &&
  a.to.col === b.to.col;

// History heuristic: quiet moves that cause cutoffs accumulate score over the search.
const histMap = new Map();
export const resetHistory = () => histMap.clear();

const histKey = (m) =>
  (m.from.row << 9) | (m.from.col << 6) | (m.to.row << 3) | m.to.col;
export const getHistory = (m) => histMap.get(histKey(m)) ?? 0;
export const addHistory = (m, depth) =>
  histMap.set(histKey(m), getHistory(m) + depth * depth);
