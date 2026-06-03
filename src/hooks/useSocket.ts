import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { setupSocketEventHandlers } from '@/utils/socketEventHandlers';
import { SOCKET_EVENTS } from '@/lib/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export const useSocket = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToast = useUIStore((s) => s.addToast);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      initialized.current = false;
      return;
    }

    const socket = connectSocket();
    if (!initialized.current) {
      setupSocketEventHandlers(socket, queryClient);
      initialized.current = true;
    }

    const onConnectError = () => {
      addToast({ message: 'Reconnecting...', severity: 'warning' });
    };

    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect_error', onConnectError);
    };
  }, [isAuthenticated, addToast]);

  const joinRoom = (room: string) => {
    getSocket().emit(SOCKET_EVENTS.JOIN_ROOM, { room });
  };

  const leaveRoom = (room: string) => {
    getSocket().emit(SOCKET_EVENTS.LEAVE_ROOM, { room });
  };

  return { joinRoom, leaveRoom, socket: getSocket() };
};
