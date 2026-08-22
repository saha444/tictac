// ============================================================
// WINNER DETECTION — Based on multiplication products
// ============================================================

import {
  WINNING_LINES,
  P1_WIN_PRODUCT,
  P2_WIN_PRODUCT,
  EMPTY,
  getLineProduct,
} from './multiplicationEngine';

export type WinnerResult = {
  winner: 'player1' | 'player2' | 'draw' | null;
  winningCells: number[];
};

/**
 * Check the board for a winner.
 * board: flat array [9] of 1 | 2 | 5
 */
export function checkWinner(board: number[]): WinnerResult {
  for (const line of WINNING_LINES) {
    const product = getLineProduct(board, line);
    if (product === P1_WIN_PRODUCT) {
      return { winner: 'player1', winningCells: [...line] };
    }
    if (product === P2_WIN_PRODUCT) {
      return { winner: 'player2', winningCells: [...line] };
    }
  }

  if (checkDraw(board)) {
    return { winner: 'draw', winningCells: [] };
  }

  return { winner: null, winningCells: [] };
}

/** All cells are occupied (no EMPTY) */
export function checkDraw(board: number[]): boolean {
  return board.every((cell) => cell !== EMPTY);
}

/** Indices of empty cells */
export function getAvailableMoves(board: number[]): number[] {
  return board.reduce<number[]>((acc, val, idx) => {
    if (val === EMPTY) acc.push(idx);
    return acc;
  }, []);
}
