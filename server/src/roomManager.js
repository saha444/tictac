// ============================================================
// ROOM MANAGER — Handles room lifecycle and move validation
// ============================================================

const { initBoard, checkWinner, isValidMove, P1_VALUE, P2_VALUE } = require('./gameEngine');

/** @type {Map<string, Room>} */
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure uniqueness
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

/**
 * Create a room. Returns { roomCode, room }.
 */
function createRoom(socketId, symbol) {
  const roomCode = generateRoomCode();
  const room = {
    code: roomCode,
    board: initBoard(),
    players: {
      player1: { socketId, symbol, value: P1_VALUE, rematchReady: false },
      player2: null,
    },
    currentPlayer: 'player1',
    status: 'waiting', // waiting | playing | finished
    winner: null,
    winningCells: [],
  };
  rooms.set(roomCode, room);
  return { roomCode, room };
}

/**
 * Join an existing room. Returns { room, playerKey } or { error }.
 */
function joinRoom(roomCode, socketId, symbol) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'waiting') return { error: 'Room is already full or game in progress' };
  if (room.players.player1.symbol === symbol) {
    return { error: 'Symbol already taken by player 1. Choose a different symbol.' };
  }

  room.players.player2 = { socketId, symbol, value: P2_VALUE, rematchReady: false };
  room.status = 'playing';
  rooms.set(roomCode, room);
  return { room, playerKey: 'player2' };
}

/**
 * Attempt a move. Returns { room, error }.
 */
function makeMove(roomCode, socketId, cellIndex) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'playing') return { error: 'Game not in progress' };

  // Identify player
  const playerKey =
    room.players.player1.socketId === socketId
      ? 'player1'
      : room.players.player2?.socketId === socketId
      ? 'player2'
      : null;

  if (!playerKey) return { error: 'Not a player in this room' };
  if (playerKey !== room.currentPlayer) return { error: 'Not your turn' };
  if (!isValidMove(room.board, cellIndex)) return { error: 'Invalid move' };

  const playerValue = room.players[playerKey].value;
  room.board[cellIndex] = playerValue;

  // Check outcome
  const result = checkWinner(room.board);
  if (result.winner) {
    room.winner = result.winner;
    room.winningCells = result.winningCells;
    room.status = 'finished';
  } else {
    room.currentPlayer = room.currentPlayer === 'player1' ? 'player2' : 'player1';
  }

  rooms.set(roomCode, room);
  return { room };
}

/**
 * Request a rematch. Returns { ready: boolean, room }.
 */
function requestRematch(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'finished') return { error: 'Invalid state' };

  const playerKey =
    room.players.player1.socketId === socketId ? 'player1' :
    room.players.player2?.socketId === socketId ? 'player2' : null;

  if (!playerKey) return { error: 'Not a player' };

  room.players[playerKey].rematchReady = true;

  const bothReady =
    room.players.player1.rematchReady && room.players.player2?.rematchReady;

  if (bothReady) {
    // Reset game
    room.board = initBoard();
    room.currentPlayer = 'player1';
    room.status = 'playing';
    room.winner = null;
    room.winningCells = [];
    room.players.player1.rematchReady = false;
    if (room.players.player2) room.players.player2.rematchReady = false;
    rooms.set(roomCode, room);
    return { ready: true, room };
  }

  rooms.set(roomCode, room);
  return { ready: false, room };
}

/**
 * Handle disconnect — find which room the socket was in.
 */
function handleDisconnect(socketId) {
  for (const [code, room] of rooms.entries()) {
    const isP1 = room.players.player1.socketId === socketId;
    const isP2 = room.players.player2?.socketId === socketId;
    if (isP1 || isP2) {
      rooms.delete(code);
      return { roomCode: code, room, disconnectedPlayer: isP1 ? 'player1' : 'player2' };
    }
  }
  return null;
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

module.exports = { createRoom, joinRoom, makeMove, requestRematch, handleDisconnect, getRoom };
