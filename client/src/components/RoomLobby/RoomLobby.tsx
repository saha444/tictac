import { useState } from 'react';
import { createPeerRoom, joinPeerRoom, PeerSession } from '../../multiplayer/peerMultiplayer';
import { GameState } from '../../types';

interface RoomLobbyProps {
  mySymbol: string;
  onBack: () => void;
  onGameReady: (
    session: PeerSession,
    initialRoom: GameState
  ) => void;
}

export default function RoomLobby({ mySymbol, onBack, onGameReady }: RoomLobbyProps) {
  const [view, setView] = useState<'choose' | 'create' | 'join'>('choose');
  const [playerName, setPlayerName] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  function handleCreateRoom() {
    if (!playerName.trim()) {
      setError('please enter your name first');
      return;
    }
    setError('');
    setIsConnecting(true);

    createPeerRoom(
      mySymbol,
      playerName.trim(),
      (code) => {
        setCreatedCode(code);
        setIsWaiting(true);
        setView('create');
        setIsConnecting(false);
      },
      (session, initialGameState) => {
        onGameReady(session, initialGameState);
      },
      (errMsg) => {
        setError(errMsg);
        setIsConnecting(false);
      }
    );
  }

  function handleJoinRoom() {
    if (!playerName.trim()) {
      setError('please enter your name first');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('enter a valid room code');
      return;
    }
    setError('');
    setIsConnecting(true);

    joinPeerRoom(
      code,
      mySymbol,
      playerName.trim(),
      (session, initialGameState) => {
        onGameReady(session, initialGameState);
      },
      (errMsg) => {
        setError(errMsg);
        setIsConnecting(false);
      }
    );
  }

  function copyCode() {
    navigator.clipboard.writeText(createdCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (view === 'create' && isWaiting) {
    return (
      <div className="page page-enter">
        <button className="nav-back" onClick={onBack}>back</button>

        <div className="logo">
          <h1 className="logo__title">room ready</h1>
          <p className="logo__sub">share the code with your friend</p>
        </div>

        <div className="card">
          <div className="room-code-display">
            <div className="room-code-label">room code</div>
            <div className="room-code-value" id="room-code">{createdCode}</div>
          </div>

          <button
            id="btn-copy-code"
            className="btn btn--ghost btn--sm room-code-copy"
            onClick={copyCode}
          >
            {copied ? 'copied' : 'copy code'}
          </button>

          <div className="section-sep" style={{ margin: '16px 0' }} />

          <div className="flex items-center" style={{ gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {playerName} ({mySymbol})
            </span>
          </div>

          <div className="waiting-indicator">
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <span>waiting for opponent</span>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="page page-enter">
        <button
          className="nav-back"
          onClick={() => { setView('choose'); setError(''); }}
        >
          back
        </button>

        <div className="logo">
          <h1 className="logo__title">join room</h1>
          <p className="logo__sub">enter room details</p>
        </div>

        <div className="card">
          <div className="input-group mb-md">
            <label className="input-label" htmlFor="player-name-input">your name</label>
            <input
              id="player-name-input"
              className="text-input"
              placeholder="enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="join-code-input">room code</label>
            <input
              id="join-code-input"
              className="text-input"
              placeholder="a7k29"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              maxLength={5}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
              {error}
            </div>
          )}

          <button
            id="btn-join-room"
            className="btn btn--secondary"
            onClick={handleJoinRoom}
            disabled={joinCode.length < 4 || !playerName.trim() || isConnecting}
            style={{ marginTop: '16px' }}
          >
            {isConnecting ? 'connecting...' : 'join room'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <button className="nav-back" onClick={onBack}>back</button>

      <div className="logo">
        <h1 className="logo__title">multiplayer</h1>
        <p className="logo__sub">play with a friend</p>
      </div>

      <div className="card">
        <div className="input-group mb-md">
          <label className="input-label" htmlFor="player-name-main">your name</label>
          <input
            id="player-name-main"
            className="text-input"
            placeholder="enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
          />
        </div>

        <div className="flex items-center gap-sm mb-md">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            your symbol:
          </span>
          <span style={{ fontSize: '1.8rem' }}>{mySymbol}</span>
        </div>

        {error && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <div className="mode-buttons">
          <button
            id="btn-create-room"
            className="btn btn--primary"
            onClick={handleCreateRoom}
            disabled={!playerName.trim() || isConnecting}
          >
            {isConnecting ? 'creating room...' : 'create room'}
          </button>

          <div className="divider">or</div>

          <button
            id="btn-join-room-view"
            className="btn btn--secondary"
            onClick={() => { setView('join'); setError(''); }}
          >
            join a room
          </button>
        </div>
      </div>
    </div>
  );
}
