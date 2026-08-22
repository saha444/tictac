import Peer, { DataConnection } from 'peerjs';
import { GameState, PlayerKey, getPairedSymbol } from '../types';
import { initializeBoard } from '../game/boardLogic';
import { P1_VALUE, P2_VALUE } from '../game/multiplicationEngine';

export interface PeerSession {
  peer: Peer;
  conn: DataConnection;
  role: PlayerKey;
  roomCode: string;
}

const STUN_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  },
};

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
  playerName: string,
  onCodeReady: (code: string) => void,
  onGameReady: (session: PeerSession, initialGameState: GameState) => void,
  onError: (errorMsg: string) => void
) {
  const roomCode = generateRoomCode();
  const peerId = `tictac-game-${roomCode.toLowerCase()}`;

  const peer = new Peer(peerId, STUN_CONFIG);

  peer.on('open', () => {
    onCodeReady(roomCode);
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      createPeerRoom(symbol, playerName, onCodeReady, onGameReady, onError);
    } else {
      onError('connection error: ' + (err.message || 'unable to host room'));
    }
  });

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      let p2Symbol = (conn.metadata && conn.metadata.symbol) ? conn.metadata.symbol : '○';
      const p2Name = (conn.metadata && conn.metadata.name) ? conn.metadata.name : 'player 2';

      // Ensure no two players can have the exact same symbol
      if (p2Symbol === symbol) {
        p2Symbol = getPairedSymbol(symbol);
      }

      const initialGameState: GameState = {
        board: initializeBoard(),
        players: {
          player1: { symbol, value: P1_VALUE, name: playerName || 'player 1' },
          player2: { symbol: p2Symbol, value: P2_VALUE, name: p2Name },
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
  playerName: string,
  onGameReady: (session: PeerSession, initialGameState: GameState) => void,
  onError: (errorMsg: string) => void
) {
  const cleanCode = roomCode.trim().toLowerCase();
  const hostPeerId = `tictac-game-${cleanCode}`;

  const peer = new Peer(STUN_CONFIG);

  peer.on('open', () => {
    const conn = peer.connect(hostPeerId, {
      metadata: { symbol, name: playerName || 'player 2' },
      reliable: true,
    });

    conn.on('open', () => {
      // Waiting for GAME_START payload
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
