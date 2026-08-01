import { getLegalMovesForPiece } from "./legal-moves.js";

const PIECE_LETTER = { king: "K", queen: "Q", rook: "R", bishop: "B", knight: "N" };
const FILES = "abcdefgh";

const toFile = (col) => FILES[col];
const toRank = (row) => String(8 - row);

export const buildSAN = (boardBefore, { type, color, fromRow, fromCol, toRow, toCol, special, didPromote, promotionType }) => {
  if (special === "castleKing")  return "O-O";
  if (special === "castleQueen") return "O-O-O";

  const isCapture = !!boardBefore[toRow][toCol] || special === "enPassant";
  const dest = toFile(toCol) + toRank(toRow);

  if (type === "pawn") {
    let san = isCapture ? toFile(fromCol) + "x" + dest : dest;
    if (didPromote) san += "=" + PIECE_LETTER[promotionType];
    return san;
  }

  const disambig = getDisambiguator(boardBefore, type, color, fromRow, fromCol, toRow, toCol);
  return PIECE_LETTER[type] + disambig + (isCapture ? "x" : "") + dest;
};

const getDisambiguator = (board, type, color, fromRow, fromCol, toRow, toCol) => {
  const rivals = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r === fromRow && c === fromCol) continue;
      const p = board[r][c];
      if (!p || p.type !== type || p.color !== color) continue;
      const moves = getLegalMovesForPiece(board, r, c, color, null);
      if (moves.some((m) => m.row === toRow && m.col === toCol)) {
        rivals.push({ row: r, col: c });
      }
    }
  }

  if (rivals.length === 0) return "";

  const sameFile = rivals.some((r) => r.col === fromCol);
  const sameRank = rivals.some((r) => r.row === fromRow);

  if (!sameFile) return toFile(fromCol);
  if (!sameRank) return toRank(fromRow);
  return toFile(fromCol) + toRank(fromRow);
};
