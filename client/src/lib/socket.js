import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

export function getSocket() {
  const token = localStorage.getItem('token');
  if (socket && token !== currentToken) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    currentToken = token;
    socket = io(window.location.origin, {
      path: '/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
  }
  return socket;
}

export function isSocketConnected() {
  return socket?.connected || false;
}
