// ============================================================
// WINNER DETECTION — Based on multiplication products & Early Draw Analysis
// ============================================================

import {
  getWinningLines,
  getWinProduct,
  EMPTY,
  P1_VALUE,
  P2_VALUE,
  getLineProduct,
} from './multiplicationEngine';

export type WinnerResult = {
  winner: 'player1' | 'player2' | 'draw' | null;
  winningCells: number[];
};

/**
 * Evaluates whether a draw is mathematically inevitable.
 * Returns true if neither player has any remaining unblocked winning line.
 */
export function isDrawInevitable(board: number[], gridSize: number = 3): boolean {
  const winningLines = getWinningLines(gridSize);

  // A line is winnable for P1 if it contains NO P2 pieces
  const isP1Winnable = winningLines.some((line) =>
    line.every((idx) => board[idx] !== P2_VALUE)
  );

  // A line is winnable for P2 if it contains NO P1 pieces
  const isP2Winnable = winningLines.some((line) =>
    line.every((idx) => board[idx] !== P1_VALUE)
  );

  // If both players are blocked on all lines, a draw is guaranteed!
  return !isP1Winnable && !isP2Winnable;
}

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

  if (checkDraw(board) || isDrawInevitable(board, gridSize)) {
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
