// ============================================================
// SERVER-SIDE GAME ENGINE (mirrors client game logic)
// Plain JS — no TypeScript annotations
// ============================================================

const EMPTY = 1;
const P1_VALUE = 2;
const P2_VALUE = 5;
const P1_WIN = 8;   // 2^3
const P2_WIN = 125; // 5^3

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function initBoard() {
  return Array(9).fill(EMPTY);
}

function checkWinner(board) {
  for (const line of WINNING_LINES) {
    const product = board[line[0]] * board[line[1]] * board[line[2]];
    if (product === P1_WIN) return { winner: 'player1', winningCells: [...line] };
    if (product === P2_WIN) return { winner: 'player2', winningCells: [...line] };
  }
  if (board.every((c) => c !== EMPTY)) return { winner: 'draw', winningCells: [] };
  return { winner: null, winningCells: [] };
}

function isValidMove(board, index) {
  return index >= 0 && index <= 8 && board[index] === EMPTY;
}

module.exports = { initBoard, checkWinner, isValidMove, EMPTY, P1_VALUE, P2_VALUE };
