import { GameState, GameMode, PlayerKey } from '../../types';

interface ResultModalProps {
  gameState: GameState;
  mode: GameMode;
  myPlayerKey: PlayerKey;
  p1RematchReady?: boolean;
  p2RematchReady?: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onRematch?: () => void;
}

export default function ResultModal({
  gameState,
  mode,
  myPlayerKey,
  p1RematchReady = false,
  p2RematchReady = false,
  onPlayAgain,
  onHome,
  onRematch,
}: ResultModalProps) {
  const { winner, players } = gameState;
  const p1 = players.player1;
  const p2 = players.player2;

  if (!winner) return null;

  const mySymbol = myPlayerKey === 'player1' ? p1.symbol : (p2?.symbol ?? '?');
  const opponentSymbol = myPlayerKey === 'player1' ? (p2?.symbol ?? '?') : p1.symbol;

  let title = '';
  let subtitle = '';
  let symbols = '';

  if (winner === 'draw') {
    title = 'Draw';
    subtitle = 'No Winning Product Was Created. Equal Forces!';
    symbols = `${mySymbol} ${opponentSymbol}`;
  } else if (
    (winner === 'player1' && myPlayerKey === 'player1') ||
    (winner === 'player2' && myPlayerKey === 'player2')
  ) {
    title = mode === 'computer' ? 'You Win!' : 'Player Wins!';
    subtitle =
      mode === 'computer'
        ? 'The Multiplication Engine Is On Your Side!'
        : 'Perfect Alignment. Victory Achieved!';
    symbols = `${mySymbol} ${mySymbol} ${mySymbol}`;
  } else {
    title = mode === 'computer' ? 'Game Over' : 'Opponent Wins';
    subtitle =
      mode === 'computer'
        ? 'The Ai Predicted Your Move. Try Again!'
        : 'Better Luck Next Time!';
    symbols = `${opponentSymbol} ${opponentSymbol} ${opponentSymbol}`;
  }

  const winnerLabel =
    mode === 'multiplayer' && winner !== 'draw'
      ? winner === 'player1'
        ? `${p1.symbol} Player 1 Wins`
        : `${p2?.symbol ?? '?'} Player 2 Wins`
      : title;

  const displayTitle = mode === 'multiplayer' && winner !== 'draw' ? winnerLabel : title;

  const showRematch = mode === 'multiplayer' && onRematch;
  const myRematchReady = myPlayerKey === 'player1' ? p1RematchReady : p2RematchReady;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Game Result">
      <div className="modal">
        <h2
          className="modal-title"
          style={mode === 'multiplayer' && winner !== 'draw' ? { fontSize: '1.4rem' } : {}}
        >
          {displayTitle}
        </h2>

        <div className="modal-symbols" aria-hidden="true">
          {symbols}
        </div>

        <p className="modal-subtitle">{subtitle}</p>

        {showRematch && (
          <div className="modal-rematch-status">
            <div className="rematch-player">
              <span>{p1.symbol} Player 1</span>
              <span className={`rematch-player-status ${p1RematchReady ? 'ready' : 'waiting'}`}>
                {p1RematchReady ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <div className="rematch-player">
              <span>{p2?.symbol ?? '?'} Player 2</span>
              <span className={`rematch-player-status ${p2RematchReady ? 'ready' : 'waiting'}`}>
                {p2RematchReady ? 'Ready' : 'Waiting'}
              </span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          {showRematch ? (
            <>
              <button
                id="btn-rematch"
                className={`btn btn--primary ${myRematchReady ? 'btn--ghost' : ''}`}
                onClick={onRematch}
                disabled={myRematchReady}
              >
                {myRematchReady ? 'Waiting For Opponent' : 'Rematch'}
              </button>
              <button id="btn-leave-room" className="btn btn--danger" onClick={onHome}>
                Leave Room
              </button>
            </>
          ) : (
            <>
              <button id="btn-play-again" className="btn btn--primary" onClick={onPlayAgain}>
                {mode === 'computer' ? 'Try Again' : 'Play Again'}
              </button>
              <button id="btn-back-home" className="btn btn--ghost" onClick={onHome}>
                Back To Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
