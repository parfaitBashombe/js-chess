import { findBestMove } from "./index.js";

self.onmessage = ({ data }) => {
  const { board, color, enPassantTarget, timeLimitMs, jobId } = data;
  const result = findBestMove(board, color, enPassantTarget, timeLimitMs);
  self.postMessage({ result, jobId });
};
