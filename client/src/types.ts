// Shared TypeScript types across the app

export type PlayerKey = 'player1' | 'player2';
export type GameStatus = 'idle' | 'waiting' | 'playing' | 'finished';
export type GameMode = 'computer' | 'multiplayer';
export type WinnerType = 'player1' | 'player2' | 'draw' | null;
export type Difficulty = 'easy' | 'tricky';

export interface PlayerInfo {
  name?: string;
  symbol: string;
  value: 2 | 5;
  rematchReady?: boolean;
}

export interface GamePlayers {
  player1: PlayerInfo;
  player2: PlayerInfo | null;
}

export interface GameState {
  board: number[];
  gridSize?: number;
  players: GamePlayers;
  currentPlayer: PlayerKey;
  status: GameStatus;
  winner: WinnerType;
  winningCells: number[];
  roomCode?: string;
  myPlayerKey?: PlayerKey;
}

export const SYMBOL_PAIRS: [string, string][] = [
  ['♡', '★'],
  ['𓆉', '𓆝'],
  ['✿', '☁︎'],
  ['✗', '○'],
];

export const AVAILABLE_SYMBOLS = SYMBOL_PAIRS.flat();

export function getPairedSymbol(playerSymbol: string): string {
  for (const [a, b] of SYMBOL_PAIRS) {
    if (playerSymbol === a) return b;
    if (playerSymbol === b) return a;
  }
  return '★';
}
