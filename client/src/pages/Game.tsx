import { useState, useEffect, useCallback, useRef } from 'react';
import Board from '../components/Board/Board';
import GameStatus from '../components/GameStatus/GameStatus';
import ResultModal from '../components/ResultModal/ResultModal';
import { GameState, GameMode, PlayerKey, Difficulty, getPairedSymbol } from '../types';
import { initializeBoard } from '../game/boardLogic';
import { checkWinner } from '../game/winnerDetection';
import { makeMove } from '../game/boardLogic';
import { predictBestMove } from '../game/aiEngine';
import { P1_VALUE, P2_VALUE } from '../game/multiplicationEngine';
import { PeerSession } from '../multiplayer/peerMultiplayer';

interface GameProps {
  mode: GameMode;
  mySymbol: string;
  difficulty?: Difficulty;
  roomCode?: string;
  myPlayerKey?: PlayerKey;
  initialGameState?: Partial<GameState>;
  peerSession?: PeerSession | null;
  onHome: () => void;
}

function createInitialState(p1Symbol: string, p2Symbol: string, gridSize: number = 3): GameState {
  return {
    board: initializeBoard(gridSize),
    gridSize,
    players: {
      player1: { symbol: p1Symbol, value: P1_VALUE },
      player2: { symbol: p2Symbol, value: P2_VALUE },
    },
    currentPlayer: 'player1',
    status: 'playing',
    winner: null,
    winningCells: [],
  };
}

export default function Game({
  mode,
  mySymbol,
  difficulty = 'easy',
  roomCode,
  myPlayerKey = 'player1',
  initialGameState,
  peerSession,
  onHome,
}: GameProps) {
  const isMultiplayer = mode === 'multiplayer';

  const p2Symbol = isMultiplayer
    ? (initialGameState?.players?.player2?.symbol ?? '○')
    : getPairedSymbol(mySymbol);

  const [lastStartingPlayer, setLastStartingPlayer] = useState<PlayerKey>(
    initialGameState?.currentPlayer ?? 'player1'
  );

  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialGameState && isMultiplayer) {
      return {
        board: initialGameState.board ?? initializeBoard(3),
        gridSize: initialGameState.gridSize ?? 3,
        players: {
          player1: initialGameState.players?.player1 ?? { symbol: mySymbol, value: P1_VALUE },
          player2: initialGameState.players?.player2 ?? { symbol: p2Symbol, value: P2_VALUE },
        },
        currentPlayer: initialGameState.currentPlayer ?? 'player1',
        status: initialGameState.status ?? 'playing',
        winner: initialGameState.winner ?? null,
        winningCells: initialGameState.winningCells ?? [],
        roomCode,
        myPlayerKey,
      };
    }
    return {
      ...createInitialState(mySymbol, p2Symbol, 3),
      roomCode,
      myPlayerKey,
    };
  });

  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });
  const [consecutiveDraws, setConsecutiveDraws] = useState(0);
  const [p1RematchReady, setP1RematchReady] = useState(false);
  const [p2RematchReady, setP2RematchReady] = useState(false);
  const [is4GridRequestedByMe, setIs4GridRequestedByMe] = useState(false);
  const [is4GridChallengedByOpponent, setIs4GridChallengedByOpponent] = useState(false);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gameState.winner === 'player1') {
      setScores((s) => ({ ...s, player1: s.player1 + 1 }));
      setConsecutiveDraws(0);
    } else if (gameState.winner === 'player2') {
      setScores((s) => ({ ...s, player2: s.player2 + 1 }));
      setConsecutiveDraws(0);
    } else if (gameState.winner === 'draw') {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      setConsecutiveDraws((prev) => prev + 1);
    }
  }, [gameState.winner]);

  useEffect(() => {
    if (isMultiplayer) return;
    if (gameState.status !== 'playing') return;
    if (gameState.currentPlayer !== 'player2') return;

    aiTimerRef.current = setTimeout(() => {
      const bestMove = predictBestMove(gameState.board, P2_VALUE, difficulty);
      if (bestMove >= 0) {
        handleCellClick(bestMove);
      }
    }, 500);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [gameState.currentPlayer, gameState.status, isMultiplayer, difficulty, gameState.board]);

  useEffect(() => {
    if (!isMultiplayer || !peerSession || !peerSession.conn) return;

    const conn = peerSession.conn;

    function handlePeerData(data: any) {
      if (!data) return;

      if (data.type === 'STATE_UPDATE') {
        setGameState((prev) => ({
          ...data.gameState,
          myPlayerKey: prev.myPlayerKey || myPlayerKey,
        }));
        if (data.gameState.status === 'playing' && data.gameState.winner === null) {
          setLastStartingPlayer(data.gameState.currentPlayer);
        }
      } else if (data.type === 'CHALLENGE_4GRID') {
        setIs4GridChallengedByOpponent(true);
      } else if (data.type === 'ACCEPT_4GRID') {
        const nextStart: PlayerKey = lastStartingPlayer === 'player1' ? 'player2' : 'player1';
        setLastStartingPlayer(nextStart);

        const resetState: GameState = {
          ...gameState,
          board: initializeBoard(4),
          gridSize: 4,
          currentPlayer: nextStart,
          status: 'playing',
          winner: null,
          winningCells: [],
          myPlayerKey,
        };
        setGameState(resetState);
        setP1RematchReady(false);
        setP2RematchReady(false);
        setIs4GridRequestedByMe(false);
        setIs4GridChallengedByOpponent(false);
      } else if (data.type === 'REMATCH_REQUEST') {
        if (data.playerKey === 'player1') setP1RematchReady(true);
        if (data.playerKey === 'player2') setP2RematchReady(true);

        if (data.p1Ready && data.p2Ready) {
          const currentSize = gameState.gridSize ?? 3;
          const nextStart: PlayerKey = lastStartingPlayer === 'player1' ? 'player2' : 'player1';
          setLastStartingPlayer(nextStart);

          const resetState: GameState = {
            ...gameState,
            board: initializeBoard(currentSize),
            currentPlayer: nextStart,
            status: 'playing',
            winner: null,
            winningCells: [],
            myPlayerKey,
          };
          setGameState(resetState);
          setP1RematchReady(false);
          setP2RematchReady(false);
        }
      } else if (data.type === 'LEAVE') {
        setGameState((prev) => ({
          ...prev,
          status: 'finished',
          winner: myPlayerKey === 'player1' ? 'player1' : 'player2',
        }));
      }
    }

    conn.on('data', handlePeerData);
    conn.on('close', () => {
      setGameState((prev) => ({
        ...prev,
        status: 'finished',
        winner: myPlayerKey === 'player1' ? 'player1' : 'player2',
      }));
    });

    return () => {
      conn.off('data', handlePeerData);
    };
  }, [isMultiplayer, peerSession, myPlayerKey, gameState, lastStartingPlayer]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameState.status !== 'playing') return;
      if (isMultiplayer && gameState.currentPlayer !== myPlayerKey) return;

      const currentValue =
        gameState.currentPlayer === 'player1' ? P1_VALUE : P2_VALUE;

      const newBoard = makeMove(gameState.board, index, currentValue);
      if (!newBoard) return;

      const result = checkWinner(newBoard);
      const nextPlayer: PlayerKey =
        gameState.currentPlayer === 'player1' ? 'player2' : 'player1';

      const newState: GameState = {
        ...gameState,
        board: newBoard,
        currentPlayer: result.winner ? gameState.currentPlayer : nextPlayer,
        status: result.winner ? 'finished' : 'playing',
        winner: result.winner,
        winningCells: result.winningCells,
        myPlayerKey,
      };

      setGameState(newState);

      if (isMultiplayer && peerSession && peerSession.conn) {
        peerSession.conn.send({
          type: 'STATE_UPDATE',
          gameState: newState,
        });
      }
    },
    [gameState, isMultiplayer, myPlayerKey, peerSession]
  );

  function handlePlayAgain() {
    const currentSize = gameState.gridSize ?? 3;
    const nextStart: PlayerKey = lastStartingPlayer === 'player1' ? 'player2' : 'player1';
    setLastStartingPlayer(nextStart);

    setGameState((prev) => ({
      ...prev,
      board: initializeBoard(currentSize),
      currentPlayer: nextStart,
      status: 'playing',
      winner: null,
      winningCells: [],
      myPlayerKey: prev.myPlayerKey || myPlayerKey,
    }));
  }

  function handleSwitch4Grid() {
    if (!isMultiplayer) {
      handleAccept4Grid();
      return;
    }

    setIs4GridRequestedByMe(true);
    if (peerSession?.conn) {
      peerSession.conn.send({ type: 'CHALLENGE_4GRID' });
    }
  }

  function handleAccept4Grid() {
    const nextStart: PlayerKey = lastStartingPlayer === 'player1' ? 'player2' : 'player1';
    setLastStartingPlayer(nextStart);

    const newBoard = initializeBoard(4);
    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      gridSize: 4,
      currentPlayer: nextStart,
      status: 'playing',
      winner: null,
      winningCells: [],
      myPlayerKey,
    };

    setGameState(newGameState);
    setP1RematchReady(false);
    setP2RematchReady(false);
    setIs4GridRequestedByMe(false);
    setIs4GridChallengedByOpponent(false);

    if (isMultiplayer && peerSession?.conn) {
      peerSession.conn.send({ type: 'ACCEPT_4GRID' });
      peerSession.conn.send({
        type: 'STATE_UPDATE',
        gameState: newGameState,
      });
    }
  }

  function handleRematch() {
    if (!peerSession || !peerSession.conn) return;

    const nextP1Ready = myPlayerKey === 'player1' ? true : p1RematchReady;
    const nextP2Ready = myPlayerKey === 'player2' ? true : p2RematchReady;

    if (myPlayerKey === 'player1') setP1RematchReady(true);
    if (myPlayerKey === 'player2') setP2RematchReady(true);

    if (nextP1Ready && nextP2Ready) {
      const currentSize = gameState.gridSize ?? 3;
      const nextStart: PlayerKey = lastStartingPlayer === 'player1' ? 'player2' : 'player1';
      setLastStartingPlayer(nextStart);

      const resetState: GameState = {
        ...gameState,
        board: initializeBoard(currentSize),
        currentPlayer: nextStart,
        status: 'playing',
        winner: null,
        winningCells: [],
        myPlayerKey,
      };
      setGameState(resetState);
      setP1RematchReady(false);
      setP2RematchReady(false);

      peerSession.conn.send({
        type: 'REMATCH_REQUEST',
        playerKey: myPlayerKey,
        p1Ready: true,
        p2Ready: true,
      });
      peerSession.conn.send({
        type: 'STATE_UPDATE',
        gameState: resetState,
      });
    } else {
      peerSession.conn.send({
        type: 'REMATCH_REQUEST',
        playerKey: myPlayerKey,
        p1Ready: nextP1Ready,
        p2Ready: nextP2Ready,
      });
    }
  }

  const isMyTurn = isMultiplayer
    ? gameState.currentPlayer === myPlayerKey
    : gameState.currentPlayer === 'player1';

  const opponentName =
    myPlayerKey === 'player1'
      ? (gameState.players.player2?.name || 'player 2')
      : (gameState.players.player1.name || 'player 1');

  return (
    <div className="page page--wide page-enter">
      <button className="nav-back" onClick={onHome}>
        home
      </button>

      <div className="logo text-center">
        <h1 className="logo__title" style={{ fontSize: '1.8rem' }}>
          {isMultiplayer ? 'multiplayer' : 'vs computer'}
        </h1>
        {isMultiplayer && roomCode && (
          <p className="logo__sub">room: {roomCode} ({gameState.gridSize ?? 3}x{gameState.gridSize ?? 3})</p>
        )}
        {!isMultiplayer && (
          <p className="logo__sub">{difficulty} mode ({gameState.gridSize ?? 3}x{gameState.gridSize ?? 3})</p>
        )}
      </div>

      <GameStatus
        gameState={gameState}
        mode={mode}
        myPlayerKey={myPlayerKey}
        scores={scores}
      />

      <Board
        gameState={gameState}
        onCellClick={handleCellClick}
        isMyTurn={isMyTurn}
      />

      {gameState.winner && (
        <ResultModal
          gameState={gameState}
          mode={mode}
          myPlayerKey={myPlayerKey}
          p1RematchReady={p1RematchReady}
          p2RematchReady={p2RematchReady}
          consecutiveDraws={consecutiveDraws}
          is4GridRequestedByMe={is4GridRequestedByMe}
          is4GridChallengedByOpponent={is4GridChallengedByOpponent}
          opponentName={opponentName}
          onPlayAgain={handlePlayAgain}
          onHome={onHome}
          onRematch={isMultiplayer ? handleRematch : undefined}
          onSwitch4Grid={handleSwitch4Grid}
          onAccept4Grid={handleAccept4Grid}
        />
      )}
    </div>
  );
}
