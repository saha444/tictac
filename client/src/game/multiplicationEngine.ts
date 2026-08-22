// ============================================================
// MULTIPLICATION ENGINE — Core numeric constants and utilities
// ============================================================

export const EMPTY = 1;
export const P1_VALUE = 2;   // Player 1's numeric identity
export const P2_VALUE = 5;   // Player 2's numeric identity

export const WINNING_LINES_3: number[][] = [
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

export const WINNING_LINES_4: number[][] = [
  // 4 Rows
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // 4 Columns
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // 2 Diagonals
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

export function getWinningLines(gridSize: number = 3): number[][] {
  return gridSize === 4 ? WINNING_LINES_4 : WINNING_LINES_3;
}

export function getWinProduct(playerValue: number, gridSize: number = 3): number {
  return playerValue ** gridSize;
}

export function getLineProduct(board: number[], line: number[]): number {
  return line.reduce((product, cellIndex) => product * board[cellIndex], 1);
}

export function evaluateLineForPlayer(
  board: number[],
  line: number[],
  myValue: number,
  opponentValue: number
): number {
  const vals = line.map((i) => board[i]);
  const product = vals.reduce((p, v) => p * v, 1);
  const targetProduct = myValue ** line.length;
  const oppTargetProduct = opponentValue ** line.length;

  if (product === targetProduct) return 10000;
  if (product === oppTargetProduct) return -10000;

  const myCount = vals.filter((v) => v === myValue).length;
  const oppCount = vals.filter((v) => v === opponentValue).length;
  const emptyCount = vals.filter((v) => v === EMPTY).length;

  if (myCount > 0 && oppCount > 0) return 0;

  if (myCount === line.length - 1 && emptyCount === 1) return 900;
  if (myCount > 0 && emptyCount === line.length - myCount) return myCount * 10;

  if (oppCount === line.length - 1 && emptyCount === 1) return -800;

  return 0;
}
