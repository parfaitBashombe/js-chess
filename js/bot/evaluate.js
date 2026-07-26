import { materialScore, positionBonus, kingEndgameBonus } from "./tables.js";
import { isKingInCheck, isSquareUnderAttack } from "../board/check.js";
import { generateMovesForPiece } from "../board/move-generate.js";
import { oppositeColor, findKing } from "../board/helpers.js";

// ── Endgame detection ──────────────────────────────────────────────────────────

export const isEndgame = (board) => {
  let queens = 0, heavyAndMinor = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.type === "king" || p.type === "pawn") continue;
      if (p.type === "queen") queens++;
      else heavyAndMinor++;
    }
  }
  return queens === 0 || (queens <= 2 && heavyAndMinor <= 2);
};

// ── Piece-square positioning ───────────────────────────────────────────────────

const getPositionBonus = (piece, row, col, endgame) => {
  const tableRow = piece.color === "white" ? row : 7 - row;
  if (piece.type === "king" && endgame) return kingEndgameBonus[tableRow][col];
  return positionBonus[piece.type][tableRow][col];
};

// ── Pawn structure ─────────────────────────────────────────────────────────────

const evalPawnStructure = (board, botColor, oppColor) => {
  let score = 0;

  // Build per-file pawn lists for each side.
  const botPawns = {};
  const oppPawns = {};

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.type !== "pawn") continue;
      const map = p.color === botColor ? botPawns : oppPawns;
      if (!map[c]) map[c] = [];
      map[c].push(r);
    }
  }

  const evalSide = (pawns, opp, color, sign) => {
    for (const col of Object.keys(pawns).map(Number)) {
      const rows = pawns[col];

      // Doubled pawns
      if (rows.length > 1) score += sign * -20 * (rows.length - 1);

      // Isolated pawns (no friendly pawn on adjacent files)
      if (!pawns[col - 1] && !pawns[col + 1]) score += sign * -15;

      // Passed pawns (no enemy pawn blocking on same/adjacent file ahead)
      for (const r of rows) {
        let passed = true;
        for (const dc of [-1, 0, 1]) {
          const adjRows = opp[col + dc];
          if (!adjRows) continue;
          for (const oppR of adjRows) {
            if (color === "white" ? oppR < r : oppR > r) { passed = false; break; }
          }
          if (!passed) break;
        }
        if (passed) {
          const advance = color === "white" ? 7 - r : r;
          score += sign * (25 + advance * 15);
        }
      }
    }
  };

  evalSide(botPawns, oppPawns, botColor,  1);
  evalSide(oppPawns, botPawns, oppColor, -1);

  return score;
};

// ── King safety ────────────────────────────────────────────────────────────────

const evalKingSafety = (board, botColor, oppColor) => {
  let score = 0;

  const evalKing = (color, sign) => {
    const king = findKing(board, color);
    if (!king) return;
    const opp = oppositeColor(color);

    // Count enemy attacks on the 5×5 zone around the king (weighted by proximity)
    let danger = 0;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = king.row + dr;
        const c = king.col + dc;
        if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
        const proximity = Math.max(Math.abs(dr), Math.abs(dc)) === 1 ? 2 : 1;
        if (isSquareUnderAttack(board, r, c, opp)) danger += 8 * proximity;
      }
    }

    // Pawn shield (pawns directly in front of king)
    const dir = color === "white" ? -1 : 1;
    let shield = 0;
    for (let dc = -1; dc <= 1; dc++) {
      const c = king.col + dc;
      if (c < 0 || c >= 8) continue;
      const r = king.row + dir;
      if (r >= 0 && r < 8) {
        const p = board[r][c];
        if (p && p.type === "pawn" && p.color === color) shield += 12;
      }
    }

    score += sign * (shield - danger);
  };

  evalKing(botColor,  1);
  evalKing(oppColor, -1);

  return score;
};

// ── Endgame mop-up ────────────────────────────────────────────────────────────
// When the bot is winning in the endgame, reward driving the enemy king
// toward a corner and closing in with the bot's own king.

const evalMopUp = (board, botColor, oppColor, materialAdvantage) => {
  if (materialAdvantage < 200) return 0;
  const bk = findKing(board, botColor);
  const ok = findKing(board, oppColor);
  if (!bk || !ok) return 0;

  // Reward opponent king being in a corner
  const cornerPenalty =
    Math.max(3 - ok.row, ok.row - 4, 0) +
    Math.max(3 - ok.col, ok.col - 4, 0);

  // Reward bot king being close to opponent king
  const kingDist = Math.abs(bk.row - ok.row) + Math.abs(bk.col - ok.col);

  return cornerPenalty * 6 + (14 - kingDist) * 4;
};

// ── Main evaluator ────────────────────────────────────────────────────────────

export const scoreBoard = (board, botColor, enPassantTarget) => {
  const oppColor = oppositeColor(botColor);
  const endgame  = isEndgame(board);
  let material   = 0;
  let position   = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const mat = materialScore[p.type];
      const pos = getPositionBonus(p, r, c, endgame);
      if (p.color === botColor)  { material += mat; position += pos; }
      else                       { material -= mat; position -= pos; }
    }
  }

  // Mobility (pseudo-legal count — no board cloning, fast approximation)
  let botMoves = 0, oppMoves = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const n = generateMovesForPiece(board, r, c, enPassantTarget).length;
      if (p.color === botColor) botMoves += n; else oppMoves += n;
    }
  const mobility = (botMoves - oppMoves) * 4;

  // Check pressure
  const checkBonus =
    (isKingInCheck(board, oppColor) ?  30 : 0) +
    (isKingInCheck(board, botColor) ? -40 : 0);

  // Structural and safety terms
  const pawns    = evalPawnStructure(board, botColor, oppColor);
  const safety   = endgame ? 0 : evalKingSafety(board, botColor, oppColor);
  const mopUp    = endgame ? evalMopUp(board, botColor, oppColor, material) : 0;

  return material + position + mobility + checkBonus + pawns + safety + mopUp;
};
