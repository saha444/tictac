import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const DEFAULT_PRODUCTION_SERVER = 'https://tictac-server.onrender.com';

export function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return DEFAULT_PRODUCTION_SERVER;
  }
  return 'http://localhost:3001';
}

export function isServerConfigured(): boolean {
  return true;
}

export function getSocket(): Socket {
  if (!socket) {
    const targetUrl = getServerUrl();

    socket = io(targetUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 800,
      timeout: 20000,
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
