import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicit) return explicit;

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return 'http://localhost:5000';
  }
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      auth: { token: localStorage.getItem('accessToken') },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const s = getSocket();
  s.auth = { token: localStorage.getItem('accessToken') };
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = (): void => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

/**
 * Update auth token after a refresh so future (re)connections use the new JWT.
 * We deliberately avoid forcing a disconnect/reconnect while the socket is
 * already connected — doing so drops the connection (and any in-flight
 * `conversation:*` room membership) for no reason, since the existing
 * connection was authenticated with a still-valid token at handshake time.
 * Only reconnect if the socket had already dropped.
 */
export const refreshSocketAuth = (token: string): void => {
  if (!socket) return;
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
};
