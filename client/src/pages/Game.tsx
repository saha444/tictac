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
import { getSocket } from '../multiplayer/socketClient';

interface GameProps {
  mode: GameMode;
  mySymbol: string;
  difficulty?: Difficulty;
  roomCode?: string;
  myPlayerKey?: PlayerKey;
  initialGameState?: Partial<GameState>;
  onHome: () => void;
}

function createInitialState(p1Symbol: string, p2Symbol: string): GameState {
  return {
    board: initializeBoard(),
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
  onHome,
}: GameProps) {
  const isMultiplayer = mode === 'multiplayer';
  const socket = isMultiplayer ? getSocket() : null;

  const p2Symbol = isMultiplayer
    ? (initialGameState?.players?.player2?.symbol ?? '○')
    : getPairedSymbol(mySymbol);

  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialGameState && isMultiplayer) {
      return {
        board: initialGameState.board ?? initializeBoard(),
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
      ...createInitialState(mySymbol, p2Symbol),
      roomCode,
      myPlayerKey,
    };
  });

  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });
  const [p1RematchReady, setP1RematchReady] = useState(false);
  const [p2RematchReady, setP2RematchReady] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gameState.winner === 'player1') {
      setScores((s) => ({ ...s, player1: s.player1 + 1 }));
    } else if (gameState.winner === 'player2') {
      setScores((s) => ({ ...s, player2: s.player2 + 1 }));
    } else if (gameState.winner === 'draw') {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
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
    if (!isMultiplayer || !socket) return;

    function onBoardUpdated({ room }: any) {
      setGameState((prev) => ({
        ...prev,
        board: room.board,
        currentPlayer: room.currentPlayer,
        status: room.status,
        winner: room.winner,
        winningCells: room.winningCells,
        players: {
          player1: { ...prev.players.player1, ...room.players.player1 },
          player2: room.players.player2
            ? { ...prev.players.player2, ...room.players.player2 }
            : prev.players.player2,
        },
      }));
    }

    function onRematchStatus({ ready, room, p1Ready, p2Ready }: any) {
      setP1RematchReady(p1Ready);
      setP2RematchReady(p2Ready);
      if (ready) {
        setGameState((prev) => ({
          ...prev,
          board: room.board,
          currentPlayer: room.currentPlayer,
          status: room.status,
          winner: null,
          winningCells: [],
        }));
        setP1RematchReady(false);
        setP2RematchReady(false);
      }
    }

    function onOpponentLeft() {
      setGameState((prev) => ({
        ...prev,
        status: 'finished',
        winner: myPlayerKey === 'player1' ? 'player1' : 'player2',
      }));
    }

    socket.on('board-updated', onBoardUpdated);
    socket.on('rematch-status', onRematchStatus);
    socket.on('opponent-left', onOpponentLeft);

    return () => {
      socket.off('board-updated', onBoardUpdated);
      socket.off('rematch-status', onRematchStatus);
      socket.off('opponent-left', onOpponentLeft);
    };
  }, [isMultiplayer, socket, myPlayerKey]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameState.status !== 'playing') return;

      if (isMultiplayer) {
        if (gameState.currentPlayer !== myPlayerKey) return;
        socket?.emit('make-move', { roomCode, cellIndex: index });
        return;
      }

      const currentValue =
        gameState.currentPlayer === 'player1' ? P1_VALUE : P2_VALUE;

      const newBoard = makeMove(gameState.board, index, currentValue);
      if (!newBoard) return;

      const result = checkWinner(newBoard);
      const nextPlayer: PlayerKey =
        gameState.currentPlayer === 'player1' ? 'player2' : 'player1';

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: result.winner ? prev.currentPlayer : nextPlayer,
        status: result.winner ? 'finished' : 'playing',
        winner: result.winner,
        winningCells: result.winningCells,
      }));
    },
    [gameState, isMultiplayer, myPlayerKey, roomCode, socket]
  );

  function handlePlayAgain() {
    setGameState((prev) => ({
      ...prev,
      board: initializeBoard(),
      currentPlayer: 'player1',
      status: 'playing',
      winner: null,
      winningCells: [],
    }));
  }

  function handleRematch() {
    socket?.emit('rematch-request', { roomCode });
  }

  const isMyTurn = isMultiplayer
    ? gameState.currentPlayer === myPlayerKey
    : gameState.currentPlayer === 'player1';

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
          <p className="logo__sub">room: {roomCode}</p>
        )}
        {!isMultiplayer && (
          <p className="logo__sub">{difficulty} mode</p>
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
          onPlayAgain={handlePlayAgain}
          onHome={onHome}
          onRematch={isMultiplayer ? handleRematch : undefined}
        />
      )}
    </div>
  );
}
