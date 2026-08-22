import { GameState, GameMode, PlayerKey } from '../../types';

interface GameStatusProps {
  gameState: GameState;
  mode: GameMode;
  myPlayerKey: PlayerKey;
  scores: { player1: number; player2: number; draws: number };
}

export default function GameStatus({
  gameState,
  mode,
  myPlayerKey,
  scores,
}: GameStatusProps) {
  const { currentPlayer, status, players } = gameState;
  const p1 = players.player1;
  const p2 = players.player2;

  const isMyTurn = currentPlayer === myPlayerKey;
  const isPlaying = status === 'playing';
  const currentSymbol =
    currentPlayer === 'player1' ? p1.symbol : (p2?.symbol ?? '?');

  let turnText: string;
  if (status === 'finished') {
    turnText = 'Game Over';
  } else if (mode === 'computer') {
    turnText = isMyTurn
      ? 'Your Turn'
      : 'Ai Is Thinking';
  } else {
    turnText = isMyTurn ? 'Your Turn' : "Opponent's Turn";
  }

  return (
    <div className="status-bar">
      <div className={`status-turn ${isPlaying && isMyTurn ? 'your-turn' : ''}`}>
        <span className="turn-symbol">{isPlaying ? currentSymbol : ''}</span>{' '}
        {turnText}
      </div>

      <div className="score-board">
        <div className="score-item score-item--p1">
          <span className="score-item__symbol">{p1.symbol}</span>
          <span className="score-item__count">{scores.player1}</span>
        </div>
        <div className="score-vs">{scores.draws > 0 ? `${scores.draws}d` : 'vs'}</div>
        <div className="score-item score-item--p2">
          <span className="score-item__symbol">{p2?.symbol ?? '?'}</span>
          <span className="score-item__count">{scores.player2}</span>
        </div>
      </div>
    </div>
  );
}
