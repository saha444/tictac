import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return ''; // Not configured on production frontend host
  }
  return 'http://localhost:3001';
}

export function isServerConfigured(): boolean {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return true;
  }
  return Boolean(import.meta.env.VITE_SERVER_URL);
}

export function getSocket(): Socket {
  if (!socket) {
    const targetUrl = getServerUrl() || 'http://localhost:3001';

    socket = io(targetUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 8000,
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
