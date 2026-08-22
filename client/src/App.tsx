import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Game from './pages/Game';
import RoomLobby from './components/RoomLobby/RoomLobby';
import { Difficulty, GameMode, PlayerKey, GameState } from './types';
import { PeerSession } from './multiplayer/peerMultiplayer';
import './index.css';

type AppView = 'landing' | 'home' | 'lobby' | 'game';
type ThemeMode = 'dark' | 'light';

interface MultiplayerSession {
  roomCode: string;
  playerKey: PlayerKey;
  initialState?: Partial<GameState>;
  peerSession?: PeerSession | null;
}

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [gameMode, setGameMode] = useState<GameMode>('computer');
  const [mySymbol, setMySymbol] = useState('♡');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mpSession, setMpSession] = useState<MultiplayerSession | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function handleStartComputer(symbol: string, diff: Difficulty) {
    setMySymbol(symbol);
    setDifficulty(diff);
    setGameMode('computer');
    setMpSession(null);
    setView('game');
  }

  function handleStartMultiplayer(symbol: string) {
    setMySymbol(symbol);
    setGameMode('multiplayer');
    setView('lobby');
  }

  function handleGameReady(session: PeerSession, initialRoom: GameState) {
    setMpSession({
      roomCode: session.roomCode,
      playerKey: session.role,
      initialState: initialRoom,
      peerSession: session,
    });
    setView('game');
  }

  function handleGoHome() {
    setView('home');
    if (mpSession?.peerSession?.conn) {
      try {
        mpSession.peerSession.conn.send({ type: 'LEAVE' });
        mpSession.peerSession.conn.close();
      } catch {}
    }
    setMpSession(null);
  }

  return (
    <>
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {theme === 'dark' ? 'light mode' : 'dark mode'}
      </button>

      <div className="app-container">
        {view === 'landing' && (
          <Landing onEnter={() => setView('home')} />
        )}

        {view === 'home' && (
          <Home
            onStartComputer={handleStartComputer}
            onStartMultiplayer={handleStartMultiplayer}
          />
        )}

        {view === 'lobby' && (
          <RoomLobby
            mySymbol={mySymbol}
            onBack={handleGoHome}
            onGameReady={handleGameReady}
          />
        )}

        {view === 'game' && (
          <Game
            key={mpSession?.roomCode ?? 'computer-game'}
            mode={gameMode}
            mySymbol={mySymbol}
            difficulty={difficulty}
            roomCode={mpSession?.roomCode}
            myPlayerKey={mpSession?.playerKey ?? 'player1'}
            initialGameState={mpSession?.initialState}
            peerSession={mpSession?.peerSession}
            onHome={handleGoHome}
          />
        )}
      </div>
    </>
  );
}
