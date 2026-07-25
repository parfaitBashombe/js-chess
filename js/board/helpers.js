const columnLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const isInsideBoard = (row, col) =>
  row >= 0 && row < 8 && col >= 0 && col < 8;

export const oppositeColor = (color) => (color === "white" ? "black" : "white");

export const toSquareName = (row, col) => `${columnLetters[col]}${8 - row}`;

export const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

export const findKing = (board, color) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === "king" && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};
