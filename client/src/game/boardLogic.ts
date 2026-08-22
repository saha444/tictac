// ============================================================
// BOARD LOGIC — Board initialization and move application
// ============================================================

import { EMPTY } from './multiplicationEngine';

/** Initialize a blank 3x3 board as a flat array of 9 cells, all EMPTY (1) */
export function initializeBoard(): number[] {
  return Array(9).fill(EMPTY);
}

/**
 * Apply a move to a board (immutably).
 * Returns a new board with the player's value placed at `index`.
 * Returns null if the move is invalid.
 */
export function makeMove(board: number[], index: number, playerValue: number): number[] | null {
  if (index < 0 || index > 8) return null;
  if (board[index] !== EMPTY) return null;
  const newBoard = [...board];
  newBoard[index] = playerValue;
  return newBoard;
}

/**
 * Convert a flat board index to [row, col].
 */
export function indexToRowCol(index: number): [number, number] {
  return [Math.floor(index / 3), index % 3];
}

/**
 * Convert [row, col] to a flat board index.
 */
export function rowColToIndex(row: number, col: number): number {
  return row * 3 + col;
}
