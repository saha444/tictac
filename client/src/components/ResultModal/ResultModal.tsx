import { GameState, GameMode, PlayerKey } from '../../types';

interface ResultModalProps {
  gameState: GameState;
  mode: GameMode;
  myPlayerKey: PlayerKey;
  p1RematchReady?: boolean;
  p2RematchReady?: boolean;
  consecutiveDraws?: number;
  onPlayAgain: () => void;
  onHome: () => void;
  onRematch?: () => void;
  onSwitch4Grid?: () => void;
}

export default function ResultModal({
  gameState,
  mode,
  myPlayerKey,
  p1RematchReady = false,
  p2RematchReady = false,
  consecutiveDraws = 0,
  onPlayAgain,
  onHome,
  onRematch,
  onSwitch4Grid,
}: ResultModalProps) {
  const { winner } = gameState;

  if (!winner) return null;

  let title = '';
  if (winner === 'draw') {
    title = 'draw';
  } else if (
    (winner === 'player1' && myPlayerKey === 'player1') ||
    (winner === 'player2' && myPlayerKey === 'player2')
  ) {
    title = 'you win';
  } else {
    title = 'you lose';
  }

  const isMultiplayer = mode === 'multiplayer';
  const showRematch = isMultiplayer && onRematch;
  const myRematchReady = myPlayerKey === 'player1' ? p1RematchReady : p2RematchReady;
  const show4GridPrompt = consecutiveDraws >= 3 && onSwitch4Grid;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '24px 16px 36px 16px',
        background: 'rgba(0, 0, 0, 0.35)',
        pointerEvents: 'none',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="match result"
    >
      <div
        className="card"
        style={{
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          pointerEvents: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(12px)',
          padding: '24px 20px',
        }}
      >
        <h2
          style={{
            fontSize: '2.2rem',
            fontWeight: 'bold',
            color: 'var(--text-main)',
            marginBottom: show4GridPrompt ? '12px' : '20px',
            letterSpacing: '2px',
          }}
        >
          {title}
        </h2>

        {show4GridPrompt && (
          <button
            id="btn-switch-4grid"
            className="btn btn--primary mb-md"
            onClick={onSwitch4Grid}
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          >
            challenge a 4 grid play?
          </button>
        )}

        <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
          {showRematch ? (
            <>
              <button
                id="btn-rematch"
                className="btn btn--primary"
                onClick={onRematch}
                disabled={myRematchReady}
                style={{ flex: 1 }}
              >
                {myRematchReady ? 'waiting...' : 'rematch'}
              </button>
              <button
                id="btn-leave-room"
                className="btn btn--secondary"
                onClick={onHome}
                style={{ flex: 1 }}
              >
                exit
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-play-again"
                className="btn btn--primary"
                onClick={onPlayAgain}
                style={{ flex: 1 }}
              >
                rematch
              </button>
              <button
                id="btn-back-home"
                className="btn btn--secondary"
                onClick={onHome}
                style={{ flex: 1 }}
              >
                exit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
