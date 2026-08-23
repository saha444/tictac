// ============================================================
// SERVER ENTRY POINT — Express + Socket.IO
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  createRoom,
  joinRoom,
  makeMove,
  requestRematch,
  handleDisconnect,
} = require('./roomManager');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── CREATE ROOM ──────────────────────────────────────────────────────────────
  socket.on('create-room', ({ symbol }) => {
    if (!symbol) return socket.emit('error', { message: 'Symbol required' });
    const { roomCode, room } = createRoom(socket.id, symbol);
    socket.join(roomCode);
    socket.emit('room-created', {
      roomCode,
      playerKey: 'player1',
      symbol,
      room: sanitizeRoom(room),
    });
    console.log(`[Room] Created: ${roomCode} by ${socket.id}`);
  });

  // ── JOIN ROOM ────────────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomCode, symbol }) => {
    if (!roomCode || !symbol) {
      return socket.emit('error', { message: 'Room code and symbol required' });
    }

    const result = joinRoom(roomCode.toUpperCase(), socket.id, symbol);
    if (result.error) {
      return socket.emit('error', { message: result.error });
    }

    const { room } = result;
    socket.join(roomCode.toUpperCase());

    // Notify joiner
    socket.emit('room-joined', {
      roomCode: roomCode.toUpperCase(),
      playerKey: 'player2',
      symbol,
      room: sanitizeRoom(room),
    });

    // Notify creator
    socket.to(roomCode.toUpperCase()).emit('opponent-joined', {
      room: sanitizeRoom(room),
    });

    // Start game for both
    io.to(roomCode.toUpperCase()).emit('game-start', { room: sanitizeRoom(room) });

    console.log(`[Room] ${roomCode.toUpperCase()} started`);
  });

  // ── MAKE MOVE ────────────────────────────────────────────────────────────────
  socket.on('make-move', ({ roomCode, cellIndex }) => {
    if (typeof cellIndex !== 'number') {
      return socket.emit('error', { message: 'Invalid move data' });
    }

    const result = makeMove(roomCode, socket.id, cellIndex);
    if (result.error) {
      return socket.emit('move-error', { message: result.error });
    }

    io.to(roomCode).emit('board-updated', { room: sanitizeRoom(result.room) });

    if (result.room.status === 'finished') {
      console.log(`[Room] ${roomCode} finished — winner: ${result.room.winner}`);
    }
  });

  // ── REMATCH ──────────────────────────────────────────────────────────────────
  socket.on('rematch-request', ({ roomCode }) => {
    const result = requestRematch(roomCode, socket.id);
    if (result.error) {
      return socket.emit('error', { message: result.error });
    }

    // Notify both about current rematch state
    io.to(roomCode).emit('rematch-status', {
      ready: result.ready,
      room: sanitizeRoom(result.room),
      p1Ready: result.room.players.player1.rematchReady,
      p2Ready: result.room.players.player2?.rematchReady ?? false,
    });
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const info = handleDisconnect(socket.id);
    if (info) {
      io.to(info.roomCode).emit('opponent-left', {
        disconnectedPlayer: info.disconnectedPlayer,
      });
    }
  });
});

/** Strip sensitive/internal socket IDs from room data sent to client */
function sanitizeRoom(room) {
  return {
    code: room.code,
    board: room.board,
    startingPlayer: room.startingPlayer || 'player1',
    currentPlayer: room.currentPlayer,
    status: room.status,
    winner: room.winner,
    winningCells: room.winningCells,
    players: {
      player1: {
        symbol: room.players.player1.symbol,
        value: room.players.player1.value,
        rematchReady: room.players.player1.rematchReady,
      },
      player2: room.players.player2
        ? {
            symbol: room.players.player2.symbol,
            value: room.players.player2.value,
            rematchReady: room.players.player2.rematchReady,
          }
        : null,
    },
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
