import Peer, { DataConnection } from 'peerjs';
import { GameState, PlayerKey } from '../types';
import { initializeBoard, makeMove } from '../game/boardLogic';
import { checkWinner } from '../game/winnerDetection';
import { P1_VALUE, P2_VALUE } from '../game/multiplicationEngine';

export interface PeerSession {
  peer: Peer;
  conn: DataConnection;
  role: PlayerKey;
  roomCode: string;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createPeerRoom(
  symbol: string,
  onCodeReady: (code: string) => void,
  onGameReady: (session: PeerSession, initialGameState: GameState) => void,
  onError: (errorMsg: string) => void
) {
  const roomCode = generateRoomCode();
  const peerId = `tictac-game-${roomCode.toLowerCase()}`;

  const peer = new Peer(peerId, {
    debug: 1,
  });

  peer.on('open', () => {
    onCodeReady(roomCode);
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      createPeerRoom(symbol, onCodeReady, onGameReady, onError);
    } else {
      onError('connection error: ' + (err.message || 'unable to host room'));
    }
  });

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      const p2Symbol = (conn.metadata && conn.metadata.symbol) ? conn.metadata.symbol : '○';
      const initialGameState: GameState = {
        board: initializeBoard(),
        players: {
          player1: { symbol, value: P1_VALUE },
          player2: { symbol: p2Symbol, value: P2_VALUE },
        },
        currentPlayer: 'player1',
        status: 'playing',
        winner: null,
        winningCells: [],
        roomCode,
        myPlayerKey: 'player1',
      };

      const session: PeerSession = {
        peer,
        conn,
        role: 'player1',
        roomCode,
      };

      conn.send({
        type: 'GAME_START',
        gameState: initialGameState,
      });

      onGameReady(session, initialGameState);
    });
  });
}

export function joinPeerRoom(
  roomCode: string,
  symbol: string,
  onGameReady: (session: PeerSession, initialGameState: GameState) => void,
  onError: (errorMsg: string) => void
) {
  const cleanCode = roomCode.trim().toLowerCase();
  const hostPeerId = `tictac-game-${cleanCode}`;

  const peer = new Peer({
    debug: 1,
  });

  peer.on('open', () => {
    const conn = peer.connect(hostPeerId, {
      metadata: { symbol },
      reliable: true,
    });

    conn.on('open', () => {
      // Waiting for GAME_START payload from host
    });

    conn.on('data', (data: any) => {
      if (data && data.type === 'GAME_START') {
        const session: PeerSession = {
          peer,
          conn,
          role: 'player2',
          roomCode: cleanCode.toUpperCase(),
        };

        const guestState: GameState = {
          ...data.gameState,
          myPlayerKey: 'player2',
        };

        onGameReady(session, guestState);
      }
    });

    conn.on('error', () => {
      onError('unable to connect to room. check the code and try again.');
    });
  });

  peer.on('error', () => {
    onError('room not found. check room code.');
  });
}
