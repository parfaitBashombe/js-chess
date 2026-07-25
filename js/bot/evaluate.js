import { materialScore, positionBonus } from "./tables.js";
import { isKingInCheck } from "../board/check.js";
import { getAllLegalMovesForColor } from "../board/legal-moves.js";
import { oppositeColor } from "../board/helpers.js";

const getPositionBonus = (piece, row, col) => {
  const table = positionBonus[piece.type];
  const tableRow = piece.color === "white" ? row : 7 - row;
  return table[tableRow][col];
};

export const scoreBoard = (board, botColor, enPassantTarget) => {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const pieceScore = materialScore[piece.type] + getPositionBonus(piece, row, col);
      score += piece.color === botColor ? pieceScore : -pieceScore;
    }
  }

  const botMoveCount      = getAllLegalMovesForColor(board, botColor, enPassantTarget).length;
  const opponentMoveCount = getAllLegalMovesForColor(board, oppositeColor(botColor), enPassantTarget).length;
  score += (botMoveCount - opponentMoveCount) * 4;

  if (isKingInCheck(board, oppositeColor(botColor))) score += 35;
  if (isKingInCheck(board, botColor))                score -= 45;

  return score;
};
