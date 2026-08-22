// ============================================================
// MULTIPLICATION ENGINE — Core numeric constants and utilities
// ============================================================

/** Numeric values for the board cells */
export const EMPTY = 1;
export const P1_VALUE = 2;   // Player 1's numeric identity
export const P2_VALUE = 5;   // Player 2's numeric identity

/** Winning products */
export const P1_WIN_PRODUCT = P1_VALUE ** 3; // 8
export const P2_WIN_PRODUCT = P2_VALUE ** 3; // 125

/** All 8 possible winning lines as flat board index triples */
export const WINNING_LINES: [number, number, number][] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/** Calculate the product of three cell values */
export function calculateLineProduct(a: number, b: number, c: number): number {
  return a * b * c;
}

/** Returns the product of a line given the board (flat array of 9) */
export function getLineProduct(board: number[], line: [number, number, number]): number {
  return board[line[0]] * board[line[1]] * board[line[2]];
}

/**
 * Evaluate a line's potential for a given player value.
 * Returns a heuristic score based on multiplication patterns.
 *
 * own^3         → WIN
 * own^2 * 1     → imminent win / high threat
 * own^1 * 1^2   → low development
 * opponent in line → blocked (0 potential)
 */
export function evaluateLineForPlayer(
  board: number[],
  line: [number, number, number],
  myValue: number,
  opponentValue: number
): number {
  const vals = line.map((i) => board[i]);
  const product = vals[0] * vals[1] * vals[2];

  // Win
  if (product === myValue ** 3) return 10000;
  // Opponent wins
  if (product === opponentValue ** 3) return -10000;

  // Check for blocking / threats
  const myCount = vals.filter((v) => v === myValue).length;
  const oppCount = vals.filter((v) => v === opponentValue).length;
  const emptyCount = vals.filter((v) => v === EMPTY).length;

  // Blocked line — opponent piece present, no value
  if (myCount > 0 && oppCount > 0) return 0;

  // My threats
  if (myCount === 2 && emptyCount === 1) return 900;  // near win
  if (myCount === 1 && emptyCount === 2) return 10;   // developing

  // Opponent threats (negative — want to block)
  if (oppCount === 2 && emptyCount === 1) return -800; // urgent block
  if (oppCount === 1 && emptyCount === 2) return -5;   // low threat

  return 0;
}
