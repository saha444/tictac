// ============================================================
// WINNER DETECTION — Based on multiplication products
// ============================================================

import {
  getWinningLines,
  getWinProduct,
  EMPTY,
  getLineProduct,
} from './multiplicationEngine';

export type WinnerResult = {
  winner: 'player1' | 'player2' | 'draw' | null;
  winningCells: number[];
};

/**
 * Check the board for a winner.
 * Automatically infers gridSize (3 for 9 cells, 4 for 16 cells).
 */
export function checkWinner(board: number[]): WinnerResult {
  const gridSize = Math.round(Math.sqrt(board.length)) || 3;
  const winningLines = getWinningLines(gridSize);
  const p1Target = getWinProduct(2, gridSize);
  const p2Target = getWinProduct(5, gridSize);

  for (const line of winningLines) {
    const product = getLineProduct(board, line);
    if (product === p1Target) {
      return { winner: 'player1', winningCells: [...line] };
    }
    if (product === p2Target) {
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
