// ============================================================
// BOARD LOGIC — Board initialization and move application
// ============================================================

import { EMPTY } from './multiplicationEngine';

/** Initialize a blank board (3x3 or 4x4) as a flat array filled with EMPTY (1) */
export function initializeBoard(gridSize: number = 3): number[] {
  return Array(gridSize * gridSize).fill(EMPTY);
}

/**
 * Apply a move to a board (immutably).
 * Returns a new board with the player's value placed at `index`.
 * Returns null if the move is invalid.
 */
export function makeMove(board: number[], index: number, playerValue: number): number[] | null {
  if (index < 0 || index >= board.length) return null;
  if (board[index] !== EMPTY) return null;
  const newBoard = [...board];
  newBoard[index] = playerValue;
  return newBoard;
}

/** Convert flat board index to [row, col] */
export function indexToRowCol(index: number, gridSize: number = 3): [number, number] {
  return [Math.floor(index / gridSize), index % gridSize];
}

/** Convert [row, col] to a flat board index */
export function rowColToIndex(row: number, col: number, gridSize: number = 3): number {
  return row * gridSize + col;
}
