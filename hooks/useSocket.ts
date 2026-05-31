import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { socketService } from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Hook for accessing the singleton WebSocket connection
 * Automatically connects with user authentication
 */
export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const userRole = user?.role || 'student';
    const userId = user?.id || 'anonymous';
    const groupId = user?.groupId;

    // Connect to socket service
    socketService.connect({
      role: userRole,
      userId,
      groupId,
    });

    // Subscribe to state changes
    const unsubscribe = socketService.onStateChange((state) => {
      setIsConnected(state.isConnected);
      setError(state.error);
    });

    // Set initial state
    const state = socketService.getState();
    setIsConnected(state.isConnected);
    setError(state.error);

    // Cleanup
    return () => {
      socketService.release();
      unsubscribe();
    };
  }, [user?.id, user?.role, user?.groupId]);

  return {
    socket: socketService.getSocket(),
    isConnected,
    error,
  };
};
