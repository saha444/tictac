// ============================================================
// AI ENGINE — Multiplication-based threat detection + Heuristics
// Difficulty levels: 'easy' | 'tricky'
// ============================================================

import {
  getWinningLines,
  EMPTY,
  evaluateLineForPlayer,
} from './multiplicationEngine';
import { getAvailableMoves } from './winnerDetection';
import { makeMove } from './boardLogic';

export type Difficulty = 'easy' | 'tricky';

function findImmediateWinOrBlock(board: number[], value: number): number | null {
  const gridSize = Math.round(Math.sqrt(board.length)) || 3;
  const winningLines = getWinningLines(gridSize);

  for (const line of winningLines) {
    const vals = line.map((i) => board[i]);
    const emptyIdx = vals.findIndex((v) => v === EMPTY);
    if (
      emptyIdx !== -1 &&
      vals.filter((v) => v === value).length === line.length - 1 &&
      vals.filter((v) => v === EMPTY).length === 1
    ) {
      return line[emptyIdx];
    }
  }
  return null;
}

export function predictBestMove(
  board: number[],
  myValue: number,
  difficulty: Difficulty
): number {
  const opponentValue = myValue === 2 ? 5 : 2;
  const available = getAvailableMoves(board);
  if (available.length === 0) return -1;

  // 1. Try to win immediately
  const win = findImmediateWinOrBlock(board, myValue);
  if (win !== null) return win;

  // 2. Try to block opponent
  const block = findImmediateWinOrBlock(board, opponentValue);
  if (block !== null) return block;

  if (difficulty === 'easy') {
    return available[Math.floor(Math.random() * available.length)];
  }

  // 3. Smart heuristic move selection for Tricky mode
  const gridSize = Math.round(Math.sqrt(board.length)) || 3;
  const winningLines = getWinningLines(gridSize);

  let bestMove = available[0];
  let bestScore = -Infinity;

  for (const move of available) {
    const newBoard = makeMove(board, move, myValue)!;
    let score = 0;
    for (const line of winningLines) {
      score += evaluateLineForPlayer(newBoard, line, myValue, opponentValue);
    }
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
