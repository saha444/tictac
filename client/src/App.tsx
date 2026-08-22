import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Game from './pages/Game';
import RoomLobby from './components/RoomLobby/RoomLobby';
import { Difficulty, GameMode, PlayerKey, GameState } from './types';
import { getSocket, getServerUrl } from './multiplayer/socketClient';
import './index.css';

type AppView = 'landing' | 'home' | 'lobby' | 'game';
type ThemeMode = 'dark' | 'light';

interface MultiplayerSession {
  roomCode: string;
  playerKey: PlayerKey;
  initialState?: Partial<GameState>;
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

  // Warm up socket connection & server on initial page load / first touch in background
  useEffect(() => {
    function warmUp() {
      try {
        const s = getSocket();
        if (!s.connected) {
          s.connect();
        }
        const url = getServerUrl();
        if (url && url.startsWith('http')) {
          fetch(`${url}/health`, { mode: 'cors' }).catch(() => {});
        }
      } catch {
        // Ignore background warmup errors
      }
    }

    warmUp();
    window.addEventListener('pointerdown', warmUp, { once: true });
    return () => {
      window.removeEventListener('pointerdown', warmUp);
    };
  }, []);

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

  function handleGameReady(roomCode: string, playerKey: PlayerKey, initialRoom: Partial<GameState>) {
    setMpSession({ roomCode, playerKey, initialState: initialRoom });
    setView('game');
  }

  function handleGoHome() {
    setView('home');
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
            onHome={handleGoHome}
          />
        )}
      </div>
    </>
  );
}
