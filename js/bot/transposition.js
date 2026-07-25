const rand32 = () => (Math.random() * 0x100000000) >>> 0;

const COLORS = ["white", "black"];
const TYPES  = ["pawn", "knight", "bishop", "rook", "queen", "king"];

const pieceKeys = {};
for (const color of COLORS) {
  pieceKeys[color] = {};
  for (const type of TYPES) {
    pieceKeys[color][type] = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => rand32())
    );
  }
}

const sideKey       = rand32();
const enPassantKeys = Array.from({ length: 8 }, () => rand32());

export const hashBoard = (board, colorToMove, enPassantTarget) => {
  let h = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) h ^= pieceKeys[p.color][p.type][r][c];
    }
  }
  if (colorToMove === "black") h ^= sideKey;
  if (enPassantTarget)         h ^= enPassantKeys[enPassantTarget.col];
  return h >>> 0;
};

// Entries are stored as { depth, score }.
// Replace-if-deeper: only overwrite an existing entry if the new search
// is at least as deep, ensuring we always keep the most-searched result.
const MAX_ENTRIES = 200_000;
const table       = new Map();

export const ttGet = (hash, depth) => {
  const e = table.get(hash);
  return e && e.depth >= depth ? e.score : null;
};

export const ttSet = (hash, depth, score) => {
  const existing = table.get(hash);
  if (existing && existing.depth > depth) return;
  if (table.size >= MAX_ENTRIES && !existing) return;
  table.set(hash, { depth, score });
};
