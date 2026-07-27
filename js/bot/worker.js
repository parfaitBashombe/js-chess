import { findBestMove } from "./index.js";

self.onmessage = ({ data }) => {
  const { board, color, enPassantTarget, difficulty, jobId } = data;
  const result = findBestMove(board, color, enPassantTarget, difficulty);
  self.postMessage({ result, jobId });
};
