import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      auth: { token: localStorage.getItem('accessToken') },
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
  if (socket?.connected) {
    socket.disconnect();
  }
};
