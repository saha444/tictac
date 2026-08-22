import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://tictac-server.onrender.com' // or window.location.origin
    : 'http://localhost:3001');

export function getSocket(): Socket {
  if (!socket) {
    const targetUrl =
      import.meta.env.VITE_SERVER_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? window.location.origin
        : 'http://localhost:3001');

    socket = io(targetUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
