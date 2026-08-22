interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        gap: '32px',
        padding: '0 16px',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(2.2rem, 9.5vw, 4.5rem)',
          fontWeight: 'bold',
          color: 'var(--text-main)',
          letterSpacing: 'clamp(1px, 1vw, 4px)',
          textAlign: 'center',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        tic-tac-toe
      </h1>

      <button
        onClick={onEnter}
        className="btn btn--landing"
        style={{
          padding: '14px 36px',
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          fontWeight: 'bold',
          letterSpacing: '2px',
          width: 'auto',
          maxWidth: '90vw',
        }}
      >
        enter the game
      </button>
    </div>
  );
}
