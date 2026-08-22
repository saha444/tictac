import { useState, useEffect, useRef } from 'react';
import { getSocket, isServerConfigured } from '../../multiplayer/socketClient';

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
  const [isConnected, setIsConnected] = useState(false);

  const myPlayerKeyRef = useRef<'player1' | 'player2' | null>(null);
  const roomCodeRef = useRef<string>('');

  const socket = getSocket();

  useEffect(() => {
    setIsConnected(socket.connected);

    function onConnect() {
      setIsConnected(true);
      setError('');
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onConnectError() {
      setIsConnected(false);
      if (!isServerConfigured()) {
        setError('multiplayer server url (VITE_SERVER_URL) is missing in vercel settings');
      } else {
        setError('unable to connect to multiplayer server');
      }
    }

    function onGameStart({ room }: any) {
      if (!myPlayerKeyRef.current || !roomCodeRef.current) return;
      onGameReady(roomCodeRef.current, myPlayerKeyRef.current, room);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('game-start', onGameStart);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('game-start', onGameStart);
    };
  }, [onGameReady, socket]);

  function handleCreateRoom() {
    setError('');
    myPlayerKeyRef.current = 'player1';

    if (!isServerConfigured()) {
      setError('multiplayer server url (VITE_SERVER_URL) is missing in vercel settings');
      return;
    }

    if (!socket.connected) {
      socket.connect();
      setError('connecting to server...');
    }

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
      setError('enter a valid room code');
      return;
    }
    setError('');

    myPlayerKeyRef.current = 'player2';
    roomCodeRef.current = code;

    if (!isServerConfigured()) {
      setError('multiplayer server url (VITE_SERVER_URL) is missing in vercel settings');
      return;
    }

    if (!socket.connected) {
      socket.connect();
      setError('connecting to server...');
    }

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
              your symbol:
            </span>
            <span style={{ fontSize: '1.5rem' }}>{mySymbol}</span>
          </div>

          <div className="waiting-indicator">
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <span>waiting for opponent</span>
          </div>
        </div>

        <div className="connection-status">
          <div className={`connection-dot ${isConnected ? 'connection-dot--connected' : ''}`} />
          {isConnected ? 'connected to server' : 'reconnecting to server'}
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
          <p className="logo__sub">enter your friend's room code</p>
        </div>

        <div className="card">
          <div className="input-group">
            <label className="input-label" htmlFor="join-code-input">room code</label>
            <input
              id="join-code-input"
              className="text-input"
              placeholder="a7k29"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              maxLength={5}
              autoFocus
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
            disabled={joinCode.length < 4}
            style={{ marginTop: '16px' }}
          >
            join room
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
          <button id="btn-create-room" className="btn btn--primary" onClick={handleCreateRoom}>
            create room
          </button>

          <div className="divider">or</div>

          <button
            id="btn-join-room-view"
            className="btn btn--secondary"
            onClick={() => setView('join')}
          >
            join a room
          </button>
        </div>
      </div>
    </div>
  );
}
