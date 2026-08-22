import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../multiplayer/socketClient';

interface RoomLobbyProps {
  mySymbol: string;
  onBack: () => void;
  onGameReady: (
    roomCode: string,
    playerKey: 'player1' | 'player2',
    initialRoom: any
  ) => void;
}

export default function RoomLobby({ mySymbol, onBack, onGameReady }: RoomLobbyProps) {
  const [view, setView] = useState<'choose' | 'create' | 'join'>('choose');
  const [createdCode, setCreatedCode] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const myPlayerKeyRef = useRef<'player1' | 'player2' | null>(null);
  const roomCodeRef = useRef<string>('');

  const socket = getSocket();

  useEffect(() => {
    function onGameStart({ room }: any) {
      if (!myPlayerKeyRef.current || !roomCodeRef.current) return;
      onGameReady(roomCodeRef.current, myPlayerKeyRef.current, room);
    }

    socket.on('game-start', onGameStart);
    return () => {
      socket.off('game-start', onGameStart);
    };
  }, [onGameReady, socket]);

  function handleCreateRoom() {
    setError('');
    myPlayerKeyRef.current = 'player1';

    function onRoomCreated({ roomCode: code }: any) {
      roomCodeRef.current = code;
      setCreatedCode(code);
      setIsWaiting(true);
      setView('create');
    }

    function onServerError({ message }: any) {
      setError(message);
      myPlayerKeyRef.current = null;
    }

    socket.once('room-created', onRoomCreated);
    socket.once('error', onServerError);
    socket.emit('create-room', { symbol: mySymbol });
  }

  function handleJoinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter A Valid Room Code');
      return;
    }
    setError('');

    myPlayerKeyRef.current = 'player2';
    roomCodeRef.current = code;

    function onServerError({ message }: any) {
      setError(message);
      myPlayerKeyRef.current = null;
      roomCodeRef.current = '';
    }

    socket.once('error', onServerError);
    socket.emit('join-room', { roomCode: code, symbol: mySymbol });
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
        <button className="nav-back" onClick={onBack}>Back</button>

        <div className="logo">
          <h1 className="logo__title">Room Ready</h1>
          <p className="logo__sub">Share The Code With Your Friend</p>
        </div>

        <div className="card">
          <div className="room-code-display">
            <div className="room-code-label">Room Code</div>
            <div className="room-code-value" id="room-code">{createdCode}</div>
          </div>

          <button
            id="btn-copy-code"
            className="btn btn--ghost btn--sm room-code-copy"
            onClick={copyCode}
          >
            {copied ? 'Copied' : 'Copy Code'}
          </button>

          <div className="section-sep" style={{ margin: '16px 0' }} />

          <div className="flex items-center" style={{ gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your Symbol:
            </span>
            <span style={{ fontSize: '1.5rem' }}>{mySymbol}</span>
          </div>

          <div className="waiting-indicator">
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <span>Waiting For Opponent</span>
          </div>
        </div>

        <div className="connection-status">
          <div className="connection-dot connection-dot--connected" />
          Connected To Server
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
          Back
        </button>

        <div className="logo">
          <h1 className="logo__title">Join Room</h1>
          <p className="logo__sub">Enter Your Friend's Room Code</p>
        </div>

        <div className="card">
          <div className="input-group">
            <label className="input-label" htmlFor="join-code-input">Room Code</label>
            <input
              id="join-code-input"
              className="text-input"
              placeholder="A7K29"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              maxLength={5}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: '8px' }}>
              {error}
            </div>
          )}

          <button
            id="btn-join-room"
            className="btn btn--secondary"
            onClick={handleJoinRoom}
            disabled={joinCode.length < 4}
            style={{ marginTop: '16px' }}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <button className="nav-back" onClick={onBack}>Back</button>

      <div className="logo">
        <h1 className="logo__title">Multiplayer</h1>
        <p className="logo__sub">Play With A Friend</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-sm mb-md">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Your Symbol:
          </span>
          <span style={{ fontSize: '1.8rem' }}>{mySymbol}</span>
        </div>

        {error && (
          <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <div className="mode-buttons">
          <button id="btn-create-room" className="btn btn--primary" onClick={handleCreateRoom}>
            Create Room
          </button>

          <div className="divider">Or</div>

          <button
            id="btn-join-room-view"
            className="btn btn--secondary"
            onClick={() => setView('join')}
          >
            Join A Room
          </button>
        </div>
      </div>
    </div>
  );
}
