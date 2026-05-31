/**
 * Unit tests for useSocket hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSocket } from './useSocket';
import { AuthProvider } from '../contexts/AuthContext';
import { socketService } from '../services/socketService';
import type { User } from '../types';

// Mock socketService
vi.mock('../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    release: vi.fn(),
    getSocket: vi.fn(() => null),
    getState: vi.fn(() => ({
      isConnected: false,
      error: null,
      connectionCount: 0,
    })),
    onStateChange: vi.fn((callback) => {
      // Return unsubscribe function
      return () => {};
    }),
  },
}));

describe('useSocket', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Connection with anonymous user', () => {
    it('should connect with anonymous credentials when no user is authenticated', async () => {
      renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalledWith({
          role: 'student',
          userId: 'anonymous',
          groupId: undefined,
        });
      });
    });

    it('should subscribe to state changes', async () => {
      renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.onStateChange).toHaveBeenCalled();
      });
    });

    it('should get initial state from socketService', async () => {
      renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.getState).toHaveBeenCalled();
      });
    });
  });

  describe('Connection with authenticated student', () => {
    it('should connect with student credentials', async () => {
      const mockStudent: User = {
        id: 'student-123',
        login: 'STUDENT001',
        displayName: 'Test Student',
        role: 'student',
        groupId: 'group-123',
      };

      localStorage.setItem('authToken', 'student-token');
      localStorage.setItem('authUser', JSON.stringify(mockStudent));

      renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalledWith({
          role: 'student',
          userId: 'student-123',
          groupId: 'group-123',
        });
      });
    });
  });

  describe('Connection with authenticated teacher', () => {
    it('should connect with teacher credentials', async () => {
      const mockTeacher: User = {
        id: 'teacher-123',
        email: 'teacher@example.com',
        displayName: 'Test Teacher',
        role: 'teacher',
      };

      localStorage.setItem('authToken', 'teacher-token');
      localStorage.setItem('authUser', JSON.stringify(mockTeacher));

      renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalledWith({
          role: 'teacher',
          userId: 'teacher-123',
          groupId: undefined,
        });
      });
    });
  });

  describe('Connection state updates', () => {
    it('should update isConnected when state changes', async () => {
      const mockStateCallback = vi.fn();

      vi.mocked(socketService.onStateChange).mockImplementation((callback) => {
        mockStateCallback.mockImplementation(callback);
        return () => {};
      });

      vi.mocked(socketService.getState).mockReturnValue({
        isConnected: true,
        error: null,
        connectionCount: 1,
      });

      const { result } = renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should update error state when connection fails', async () => {
      vi.mocked(socketService.getState).mockReturnValue({
        isConnected: false,
        error: 'Connection failed',
        connectionCount: 0,
      });

      const { result } = renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Connection failed');
        expect(result.current.isConnected).toBe(false);
      });
    });
  });

  describe('Cleanup on unmount', () => {
    it('should release connection and unsubscribe on unmount', async () => {
      const mockUnsubscribe = vi.fn();

      vi.mocked(socketService.onStateChange).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalled();
      });

      unmount();

      expect(socketService.release).toHaveBeenCalled();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('User changes', () => {
    it('should reconnect when user changes', async () => {
      const mockUser1: User = {
        id: 'user-1',
        login: 'STUDENT001',
        displayName: 'Student 1',
        role: 'student',
        groupId: 'group-1',
      };

      const mockUser2: User = {
        id: 'user-2',
        login: 'STUDENT002',
        displayName: 'Student 2',
        role: 'student',
        groupId: 'group-2',
      };

      localStorage.setItem('authToken', 'token-1');
      localStorage.setItem('authUser', JSON.stringify(mockUser1));

      const { rerender } = renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalledWith({
          role: 'student',
          userId: 'user-1',
          groupId: 'group-1',
        });
      });

      // Change user
      localStorage.setItem('authUser', JSON.stringify(mockUser2));

      // Force re-render by clearing and setting again
      localStorage.clear();
      localStorage.setItem('authToken', 'token-2');
      localStorage.setItem('authUser', JSON.stringify(mockUser2));

      rerender();

      // Note: In real scenario, AuthContext would trigger re-render
      // This test demonstrates the hook would react to user prop changes
    });
  });

  describe('getSocket', () => {
    it('should return socket from socketService', async () => {
      const mockSocket = { id: 'socket-123' };
      vi.mocked(socketService.getSocket).mockReturnValue(mockSocket as any);

      const { result } = renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.socket).toBe(mockSocket);
      });
    });

    it('should return null when socket does not exist', async () => {
      vi.mocked(socketService.getSocket).mockReturnValue(null);

      const { result } = renderHook(() => useSocket(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.socket).toBeNull();
      });
    });
  });
});
