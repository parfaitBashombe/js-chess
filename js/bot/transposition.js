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

// Flag types for proper alpha-beta bounds storage.
export const TT_EXACT = 0; // exact minimax value
export const TT_LOWER = 1; // fail-high: true score >= stored score
export const TT_UPPER = 2; // fail-low:  true score <= stored score

const MAX_SIZE = 1_000_000;
const table    = new Map();

export const ttGet = (hash, depth, alpha, beta) => {
  const e = table.get(hash);
  if (!e || e.depth < depth) return null;
  if (e.flag === TT_EXACT)                     return e.score;
  if (e.flag === TT_LOWER && e.score >= beta)  return e.score;
  if (e.flag === TT_UPPER && e.score <= alpha) return e.score;
  return null;
};

// Returns the best move stored for this position regardless of depth.
// Used to seed move ordering in iterative deepening.
export const ttGetMove = (hash) => {
  const e = table.get(hash);
  return e?.move ?? null;
};

export const ttSet = (hash, depth, score, flag, move = null) => {
  const e = table.get(hash);
  if (e && e.depth > depth) return;
  if (table.size >= MAX_SIZE && !e) table.clear();
  table.set(hash, { depth, score, flag, move });
};
