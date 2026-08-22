// ============================================================
// AI ENGINE — Multiplication-based threat detection + Minimax
// Difficulty levels: 'easy' | 'tricky'
// ============================================================

import {
  WINNING_LINES,
  EMPTY,
  evaluateLineForPlayer,
} from './multiplicationEngine';
import { checkWinner, getAvailableMoves } from './winnerDetection';
import { makeMove } from './boardLogic';

export type Difficulty = 'easy' | 'tricky';

// ─── Position weights (strategic value of each cell) ─────────────────────────
const POSITION_WEIGHTS = [
  3, 2, 3,
  2, 4, 2,
  3, 2, 3,
];

// ─── Heuristic board evaluation ──────────────────────────────────────────────

function evaluateBoard(board: number[], myValue: number, opponentValue: number): number {
  let score = 0;
  for (const line of WINNING_LINES) {
    score += evaluateLineForPlayer(board, line, myValue, opponentValue);
  }
  board.forEach((val, idx) => {
    if (val === myValue) score += POSITION_WEIGHTS[idx];
    else if (val === opponentValue) score -= POSITION_WEIGHTS[idx];
  });
  return score;
}

// ─── Minimax with Alpha-Beta Pruning (used by Tricky) ────────────────────────

function minimax(
  board: number[],
  depth: number,
  isMaximizing: boolean,
  myValue: number,
  opponentValue: number,
  alpha: number,
  beta: number
): number {
  const result = checkWinner(board);
  if (result.winner === (myValue === 2 ? 'player1' : 'player2')) return 1000 - depth;
  if (result.winner === (myValue === 2 ? 'player2' : 'player1')) return -1000 + depth;
  if (result.winner === 'draw') return 0;

  const moves = getAvailableMoves(board);
  if (moves.length === 0 || depth === 0) return evaluateBoard(board, myValue, opponentValue);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move, myValue)!;
      const score = minimax(newBoard, depth - 1, false, myValue, opponentValue, alpha, beta);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move, opponentValue)!;
      const score = minimax(newBoard, depth - 1, true, myValue, opponentValue, alpha, beta);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ─── Immediate Win/Block Detection using multiplication ───────────────────────

function findImmediateWinOrBlock(board: number[], value: number): number | null {
  for (const line of WINNING_LINES) {
    const vals = line.map((i) => board[i]);
    const emptyIdx = vals.findIndex((v) => v === EMPTY);
    if (
      emptyIdx !== -1 &&
      vals.filter((v) => v === value).length === 2 &&
      vals.filter((v) => v === EMPTY).length === 1
    ) {
      return line[emptyIdx];
    }
  }
  return null;
}

// ─── Main AI function ─────────────────────────────────────────────────────────

export function predictBestMove(
  board: number[],
  myValue: number,
  difficulty: Difficulty
): number {
  const opponentValue = myValue === 2 ? 5 : 2;
  const available = getAvailableMoves(board);
  if (available.length === 0) return -1;

  // ── EASY ─────────────────────────────────────────────────────────────────────
  // Win if possible, otherwise 50/50 smart vs random — feels casual
  if (difficulty === 'easy') {
    // Try to win immediately
    const win = findImmediateWinOrBlock(board, myValue);
    if (win !== null && Math.random() > 0.3) return win;
    // 55% of the time just pick a random cell
    if (Math.random() < 0.55) {
      return available[Math.floor(Math.random() * available.length)];
    }
    // Otherwise block or play a decent move
    const block = findImmediateWinOrBlock(board, opponentValue);
    if (block !== null) return block;
    return available[Math.floor(Math.random() * available.length)];
  }

  // ── TRICKY (Medium + Hard combined) ──────────────────────────────────────────
  // 1. Win immediately
  const win = findImmediateWinOrBlock(board, myValue);
  if (win !== null) return win;
  // 2. Block opponent
  const block = findImmediateWinOrBlock(board, opponentValue);
  if (block !== null) return block;
  // 3. Full Minimax look-ahead
  let bestScore = -Infinity;
  let bestMove = available[0];
  const depth = Math.min(available.length, 9);

  for (const move of available) {
    const newBoard = makeMove(board, move, myValue)!;
    const score =
      minimax(newBoard, depth - 1, false, myValue, opponentValue, -Infinity, Infinity) +
      POSITION_WEIGHTS[move] * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}
