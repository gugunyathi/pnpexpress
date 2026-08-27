import { io, Socket } from 'socket.io-client';

// Shared singleton socket instance configured for container compatibility
export const socket: Socket = io({
  transports: ['polling', 'websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
